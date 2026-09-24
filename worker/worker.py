import os
from dotenv import load_dotenv
load_dotenv()

import boto3
import cv2
import json
import time
from datetime import datetime

# AWS Clients Setup
s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

# Configurations
QUEUE_URL = os.environ.get('SQS_QUEUE_URL')
RAW_BUCKET = os.environ.get('RAW_BUCKET_NAME')
PROCESSED_BUCKET = os.environ.get('PROCESSED_BUCKET_NAME')

# DynamoDB table (matches the Node.js API)
TABLE_NAME = dynamodb.Table('Jobs')

# How many times we retry a message before giving up and deleting it
MAX_RETRIES = 3

def process_image(download_path, upload_path):
    """Apply OpenCV enhancement pipeline to a medical image."""
    # 1. Read as grayscale
    img = cv2.imread(download_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Could not read image at {download_path}. File may be corrupt or unsupported format.")

    # 2. Non-Local Means Denoising (good for X-ray noise)
    enhanced_img = cv2.fastNlMeansDenoising(img, None, h=10, templateWindowSize=7, searchWindowSize=21)

    # 3. CLAHE — contrast-limited adaptive histogram equalization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_img = clahe.apply(enhanced_img)

    # 4. Save the enhanced image
    cv2.imwrite(upload_path, enhanced_img)
    print(f"  ✓ Image processed and saved to {upload_path}")

def mark_job_failed(job_id, error_message):
    """Update DynamoDB to mark the job as failed."""
    try:
        now = datetime.utcnow().isoformat() + "Z"
        TABLE_NAME.update_item(
            Key={'jobId': job_id},
            UpdateExpression="SET #st = :failed, #err = :err, updatedAt = :now",
            ExpressionAttributeNames={'#st': 'status', '#err': 'error'},
            ExpressionAttributeValues={
                ':failed': 'failed',
                ':err': str(error_message),
                ':now': now
            }
        )
        print(f"  ✗ Job {job_id} marked as failed in DynamoDB.")
    except Exception as db_err:
        print(f"  ✗ Could not update DynamoDB for failed job {job_id}: {db_err}")

def poll_queue():
    print("Worker started. Listening for messages on SQS...")
    while True:
        response = sqs_client.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5,             # Long polling — saves cost & reduces empty polls
            AttributeNames=['ApproximateReceiveCount']  # Track retry count
        )

        if 'Messages' not in response:
            print("No messages in queue. Waiting...")
            time.sleep(2)
            continue

        for message in response['Messages']:
            receipt_handle = message['ReceiptHandle']

            # Check how many times this message has been received
            receive_count = int(message.get('Attributes', {}).get('ApproximateReceiveCount', 1))

            try:
                body = json.loads(message['Body'])
                job_id = body.get('jobId', body.get('taskId'))
                image_key = body.get('originalKey', body.get('imageKey'))

                if not job_id or not image_key:
                    print(f"  ✗ Malformed message (missing jobId or originalKey). Deleting.")
                    sqs_client.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
                    continue

                print(f"\n→ Received Job: {job_id}")
                print(f"  Image key: {image_key}  (attempt #{receive_count})")

                # Local file paths (no /tmp — works cross-platform)
                safe_key = image_key.replace('/', '_')
                local_raw_path = f"raw_{safe_key}"
                local_processed_path = f"processed_{safe_key}"

                # ── Step A: Download from S3 ─────────────────────────────────
                print(f"  ↓ Downloading from s3://{RAW_BUCKET}/{image_key}")
                s3_client.download_file(RAW_BUCKET, image_key, local_raw_path)

                # ── Step B: Process with OpenCV ──────────────────────────────
                print(f"  ⚙ Processing image...")
                process_image(local_raw_path, local_processed_path)

                # ── Step C: Upload to Processed Bucket ───────────────────────
                processed_key = f"enhanced/{job_id}/{safe_key}"
                print(f"  ↑ Uploading to s3://{PROCESSED_BUCKET}/{processed_key}")
                s3_client.upload_file(local_processed_path, PROCESSED_BUCKET, processed_key)

                # ── Step D: Update DynamoDB → completed ──────────────────────
                now = datetime.utcnow().isoformat() + "Z"
                TABLE_NAME.update_item(
                    Key={'jobId': job_id},
                    UpdateExpression=(
                        "SET #st = :completed, enhancedKey = :ek, "
                        "completedAt = :ca, updatedAt = :ca, progress = :p"
                    ),
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={
                        ':completed': 'completed',
                        ':ek': processed_key,
                        ':ca': now,
                        ':p': 100
                    }
                )
                print(f"  ✓ DynamoDB updated → completed")

                # ── Step E: Delete from SQS ──────────────────────────────────
                sqs_client.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
                print(f"  ✓ Job {job_id} completed successfully!")

            except Exception as e:
                print(f"  ✗ Error processing message: {e}")

                if receive_count >= MAX_RETRIES:
                    # Give up — mark failed in DynamoDB and remove from queue
                    print(f"  ✗ Max retries ({MAX_RETRIES}) reached. Discarding message.")
                    job_id = None
                    try:
                        body = json.loads(message['Body'])
                        job_id = body.get('jobId', body.get('taskId'))
                    except Exception:
                        pass
                    if job_id:
                        mark_job_failed(job_id, str(e))
                    sqs_client.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
                else:
                    print(f"  ↺ Will retry (attempt {receive_count}/{MAX_RETRIES})")

            finally:
                # Clean up local temp files
                for path in [locals().get('local_raw_path'), locals().get('local_processed_path')]:
                    if path and os.path.exists(path):
                        os.remove(path)

if __name__ == "__main__":
    poll_queue()