from dotenv import load_dotenv
load_dotenv()
import boto3
import cv2
import json
import os
import time
from datetime import datetime

# AWS Clients Setup (Make sure your AWS CLI/Environment variables are configured)
s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

# Configurations
QUEUE_URL = os.environ.get('SQS_QUEUE_URL')
RAW_BUCKET = os.environ.get('RAW_BUCKET_NAME')
PROCESSED_BUCKET = os.environ.get('PROCESSED_BUCKET_NAME')

# Changed table name to 'Jobs' to match the Node.js API
TABLE_NAME = dynamodb.Table('Jobs')

def process_image(download_path, upload_path):
    # 1. Read the image using OpenCV
    img = cv2.imread(download_path, cv2.IMREAD_GRAYSCALE)
    
    # 2. Apply Spatial Filter (Non-Local Means Denoising for medical images)
    enhanced_img = cv2.fastNlMeansDenoising(img, None, h=10, templateWindowSize=7, searchWindowSize=21)
    
    # 3. Save the enhanced image temporarily
    cv2.imwrite(upload_path, enhanced_img)
    print(f"Image processed and saved to {upload_path}")

def poll_queue():
    print("Worker started. Listening for messages on SQS...")
    while True:
        response = sqs_client.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5 # Long polling
        )
        
        if 'Messages' in response:
            for message in response['Messages']:
                try:
                    body = json.loads(message['Body'])
                    
                    # Updated keys (jobId and originalKey) to match the payload from the Node.js API
                    # Using .get() as a fallback to ensure compatibility with our earlier test script
                    job_id = body.get('jobId', body.get('taskId'))
                    image_key = body.get('originalKey', body.get('imageKey'))
                    
                    print(f"Received Job: {job_id} for image: {image_key}")
                    
                    # Removed /tmp/ from the path to ensure it runs correctly on Windows during local testing
                    # Replaced forward slashes to prevent OS directory creation errors
                    local_raw_path = f"raw_{image_key.replace('/', '_')}"
                    local_processed_path = f"processed_{image_key.replace('/', '_')}"
                    
                    # Step A: Download from S3
                    s3_client.download_file(RAW_BUCKET, image_key, local_raw_path)
                    
                    # Step B: Process Image with OpenCV
                    process_image(local_raw_path, local_processed_path)
                    
                    # Step C: Upload to Processed S3 Bucket
                    processed_key = f"enhanced_{image_key}"
                    s3_client.upload_file(local_processed_path, PROCESSED_BUCKET, processed_key)
                    
                    # Step D: Update DynamoDB Status (Matching the Node.js 'markCompleted' logic)
                    now = datetime.utcnow().isoformat() + "Z"
                    TABLE_NAME.update_item(
                        Key={'jobId': job_id},
                        UpdateExpression="SET #st = :completed, enhancedKey = :ek, completedAt = :ca, updatedAt = :ca, progress = :p",
                        ExpressionAttributeNames={
                            '#st': 'status'
                        },
                        ExpressionAttributeValues={
                            ':completed': 'completed',
                            ':ek': processed_key,
                            ':ca': now,
                            ':p': 100
                        }
                    )
                    
                    # Step E: Delete message from SQS Queue
                    sqs_client.delete_message(
                        QueueUrl=QUEUE_URL,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                    print(f"Job {job_id} completed successfully!\n")
                    
                    # Clean up local files
                    if os.path.exists(local_raw_path):
                        os.remove(local_raw_path)
                    if os.path.exists(local_processed_path):
                        os.remove(local_processed_path)
                        
                except Exception as e:
                    print(f"Error processing message: {e}")
        else:
            print("No messages in queue. Waiting...")
            time.sleep(2)

if __name__ == "__main__":
    poll_queue()