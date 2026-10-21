import os
import sys
import boto3
from botocore.config import Config

def get_env_var(name, default=None):
    # 1. First check environment variables (GitHub Actions)
    val = os.getenv(name)
    if val:
        return val.strip()
    
    # 2. Fallback to local .env file if present
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if k.strip() == name:
                        return v.strip()
    return default

def main():
    if len(sys.argv) < 2:
        print("Usage: python upload_to_r2.py <file1> <file2> ...")
        sys.exit(0)

    files_to_upload = sys.argv[1:]

    endpoint_url = get_env_var('R2_ENDPOINT_URL')
    access_key_id = get_env_var('R2_ACCESS_KEY_ID')
    secret_access_key = get_env_var('R2_SECRET_ACCESS_KEY')
    bucket_name = get_env_var('R2_BUCKET_NAME', 'realrankus-data')

    if not endpoint_url or not access_key_id or not secret_access_key:
        print("[ERROR] Missing Cloudflare R2 credentials (R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)")
        sys.exit(1)

    s3 = boto3.client(
        service_name='s3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

    print(f"=== Uploading {len(files_to_upload)} files to Cloudflare R2 ({bucket_name}) ===")

    success_count = 0
    for local_path in files_to_upload:
        # Standardize path separators
        norm_path = os.path.normpath(local_path).replace('\\', '/')
        if norm_path.startswith('./'):
            norm_path = norm_path[2:]

        if not os.path.exists(norm_path):
            print(f"[SKIP] File not found: {norm_path}")
            continue

        # Content-Type detection
        content_type = 'application/octet-stream'
        if norm_path.endswith('.json'):
            content_type = 'application/json; charset=utf-8'
        elif norm_path.endswith('.html'):
            content_type = 'text/html; charset=utf-8'
        elif norm_path.endswith('.js'):
            content_type = 'application/javascript; charset=utf-8'
        elif norm_path.endswith('.css'):
            content_type = 'text/css; charset=utf-8'
        elif norm_path.endswith('.png'):
            content_type = 'image/png'

        try:
            # Upload with no-cache so latest data is immediately served
            extra_args = {
                'ContentType': content_type,
                'CacheControl': 'no-cache, no-store, must-revalidate'
            }
            s3.upload_file(norm_path, bucket_name, norm_path, ExtraArgs=extra_args)
            print(f"[SUCCESS] Uploaded: {norm_path} -> s3://{bucket_name}/{norm_path}")
            success_count += 1
        except Exception as e:
            print(f"[FAIL] Error uploading {norm_path}: {e}")

    print(f"=== Completed: {success_count}/{len(files_to_upload)} files uploaded ===")

if __name__ == '__main__':
    main()

