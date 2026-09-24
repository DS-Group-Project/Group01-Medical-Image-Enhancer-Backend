import os
import json
import uuid
import boto3
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Set up variables from environment
aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
aws_region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

RAW_BUCKET = os.environ.get('RAW_BUCKET_NAME')
QUEUE_URL = os.environ.get('SQS_QUEUE_URL')

# Initialize AWS Clients
s3_client = boto3.client(
    's3',
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key,
    region_name=aws_region
)

sqs_client = boto3.client(
    'sqs',
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key,
    region_name=aws_region
)

def trigger_test():
    # Generate a unique Job ID and image file name
    job_id = str(uuid.uuid4())
    image_key = f"xray_{job_id}.jpg"
    
    # 1. Upload sample.jpg to the S3 bucket
    print(f"Uploading sample.jpg to {RAW_BUCKET} as {image_key}...")
    s3_client.upload_file("sample.jpg", RAW_BUCKET, image_key)
    
    # 2. Create the SQS message payload matching the Node.js API format
    message_body = {
        "jobId": job_id,
        "originalKey": image_key
    }
    
    # 3. Send the message to the SQS queue
    print("Sending message to SQS queue...")
    sqs_client.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message_body)
    )
    print(f"Trigger successful! Job ID: {job_id}")

if __name__ == "__main__":
    trigger_test()