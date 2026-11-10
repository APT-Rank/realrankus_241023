import os
import boto3
from botocore.config import Config

# read .env
env = {}
if os.path.exists('.env'):
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()

s3 = boto3.client(
    service_name='s3',
    endpoint_url=env.get('R2_ENDPOINT_URL'),
    aws_access_key_id=env.get('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=env.get('R2_SECRET_ACCESS_KEY'),
    config=Config(signature_version='s3v4'),
    region_name='auto'
)

bucket = env.get('R2_BUCKET_NAME', 'realrankus-data')
print(f"Connecting to R2 bucket: {bucket}...")

paginator = s3.get_paginator('list_objects_v2')
total_size = 0
total_count = 0
prefixes = {}

for page in paginator.paginate(Bucket=bucket):
    for obj in page.get('Contents', []):
        size = obj['Size']
        total_size += size
        total_count += 1
        prefix = obj['Key'].split('/')[0] if '/' in obj['Key'] else 'root'
        prefixes[prefix] = prefixes.get(prefix, 0) + size

print(f"\n=== R2 Bucket [{bucket}] Status ===")
print(f"Total objects: {total_count}")
print(f"Total size: {total_size / (1024*1024):.2f} MB ({total_size / (1024*1024*1024):.3f} GB)")
print("Breakdown by folder:")
for p, s in prefixes.items():
    print(f"  - {p}/ : {s / (1024*1024):.2f} MB")
