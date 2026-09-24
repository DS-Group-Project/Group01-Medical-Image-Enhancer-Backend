import boto3
import json
import uuid

# === AWS Configuration ===
# Using the credentials provided by the Project Lead
aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
REGION = 'us-east-1'

# Replace this with the actual SQS Queue URL you copied from the AWS Console
SQS_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/240037737007/ImageProcessingQueue'
RAW_BUCKET = 'medicalimagesds'
PROCESSED_BUCKET = 'processedmedicalimage'
# Initialize AWS Clients for S3 and SQS
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION
)
sqs_client = boto3.client(
    'sqs',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION
)

def test_workflow():
    # 1. Define the local image path to be tested
    # Make sure you have an image named 'sample.jpg' in the same directory
    local_image_path = "sample.jpg"  
    
    # 2. Generate a unique Task ID and define the S3 object key
    task_id = str(uuid.uuid4())
    image_key = f"xray_{task_id}.jpg"

    print(f"Step 1: Uploading {local_image_path} to S3 bucket ({RAW_BUCKET})...")
    try:
        s3_client.upload_file(local_image_path, RAW_BUCKET, image_key)
        print("S3 Upload successful!")
    except Exception as e:
        print(f"S3 Upload failed: {e}")
        return

    print("Step 2: Sending message to SQS queue...")
    # Create the message payload matching the format expected by the worker
    message_body = {
        "taskId": task_id,
        "imageKey": image_key
    }
    
    try:
        sqs_client.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps(message_body)
        )
        print(f"Success! Task {task_id} sent to SQS.")
        print("Please check the terminal where your Worker is running to see the processing logs!")
    except Exception as e:
        print(f"SQS Message failed: {e}")

if __name__ == "__main__":
    test_workflow()