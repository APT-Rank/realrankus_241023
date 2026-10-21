import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config

def get_env_var(name, default=None):
    val = os.getenv(name)
    if val:
        return val.strip()
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if k.strip() == name:
                        return v.strip()
    return default

def get_r2_client():
    endpoint_url = get_env_var('R2_ENDPOINT_URL')
    access_key_id = get_env_var('R2_ACCESS_KEY_ID')
    secret_access_key = get_env_var('R2_SECRET_ACCESS_KEY')

    if not endpoint_url or not access_key_id or not secret_access_key:
        raise ValueError("Missing R2 credentials in environment or .env file.")

    return boto3.client(
        service_name='s3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(
            signature_version='s3v4',
            max_pool_connections=32,
            retries={'max_attempts': 5, 'mode': 'standard'}
        ),
        region_name='auto'
    )

def fetch_existing_r2_objects(s3, bucket_name, prefix='price/recent/'):
    print(f"[*] Querying existing objects in s3://{bucket_name}/{prefix} ...")
    existing = {}
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
    count = 0
    for page in pages:
        for obj in page.get('Contents', []):
            existing[obj['Key']] = obj['Size']
            count += 1
    print(f"[*] Found {count} existing objects in R2 under '{prefix}'.")
    return existing

def collect_local_files(base_dir='price/recent', filter_str=None):
    local_files = []
    norm_base = os.path.normpath(base_dir)
    for root, dirs, files in os.walk(norm_base):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.normpath(full_path).replace('\\', '/')
            if rel_path.startswith('./'):
                rel_path = rel_path[2:]
            if filter_str and filter_str not in rel_path:
                continue
            size = os.path.getsize(full_path)
            local_files.append((full_path, rel_path, size))
    return local_files

def upload_single_file(s3, bucket_name, full_path, r2_key, size):
    extra_args = {
        'ContentType': 'application/json; charset=utf-8' if r2_key.endswith('.json') else 'application/octet-stream',
        'CacheControl': 'no-cache, no-store, must-revalidate'
    }
    s3.upload_file(full_path, bucket_name, r2_key, ExtraArgs=extra_args)
    return r2_key, size

def sync_price_to_r2(force=False, max_workers=20, dry_run=False, filter_str=None):
    bucket_name = get_env_var('R2_BUCKET_NAME', 'realrankus-data')
    s3 = get_r2_client()

    prefix = 'price/recent/'
    if filter_str:
        prefix = f"price/recent/{filter_str.strip('/')}/"

    existing_r2 = {}
    if not force:
        existing_r2 = fetch_existing_r2_objects(s3, bucket_name, prefix)

    local_files = collect_local_files('price/recent', filter_str=filter_str)
    total_files = len(local_files)
    total_bytes = sum(f[2] for f in local_files)
    print(f"[*] Local files found: {total_files} files ({total_bytes / (1024*1024):.2f} MB)")

    to_upload = []
    skipped = 0
    skipped_bytes = 0

    for full_path, r2_key, size in local_files:
        if not force and r2_key in existing_r2 and existing_r2[r2_key] == size:
            skipped += 1
            skipped_bytes += size
        else:
            to_upload.append((full_path, r2_key, size))

    print(f"[*] Skipped (already up-to-date in R2): {skipped} files ({skipped_bytes / (1024*1024):.2f} MB)")
    print(f"[*] Queued for upload: {len(to_upload)} files ({sum(x[2] for x in to_upload) / (1024*1024):.2f} MB)")

    if dry_run:
        print("[*] Dry run completed.")
        return

    if not to_upload:
        print("[*] All files are already up-to-date in R2! Nothing to upload.")
        return

    start_time = time.time()
    uploaded_count = 0
    uploaded_bytes = 0
    failed_count = 0

    print(f"\n[*] Starting parallel upload with {max_workers} worker threads...\n")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(upload_single_file, s3, bucket_name, item[0], item[1], item[2]): item
            for item in to_upload
        }

        for future in as_completed(futures):
            item = futures[future]
            try:
                r2_key, size = future.result()
                uploaded_count += 1
                uploaded_bytes += size
                if uploaded_count % 50 == 0 or uploaded_count == len(to_upload):
                    elapsed = time.time() - start_time
                    speed_mb = (uploaded_bytes / (1024 * 1024)) / (elapsed + 0.001)
                    percent = (uploaded_count / len(to_upload)) * 100
                    print(f"[{percent:5.1f}%] {uploaded_count}/{len(to_upload)} uploaded ({uploaded_bytes / (1024*1024):.1f} MB, {speed_mb:.2f} MB/s)")
            except Exception as e:
                failed_count += 1
                print(f"[FAIL] Error uploading {item[1]}: {e}")

    total_time = time.time() - start_time
    print(f"\n=== Sync Completed in {total_time:.2f} seconds ===")
    print(f"Uploaded: {uploaded_count} files ({uploaded_bytes / (1024*1024):.2f} MB)")
    print(f"Failed: {failed_count} files")

if __name__ == '__main__':
    force_upload = '--force' in sys.argv
    is_dry_run = '--dry-run' in sys.argv
    workers = 20
    filter_arg = None
    for arg in sys.argv:
        if arg.startswith('--workers='):
            workers = int(arg.split('=')[1])
        elif arg.startswith('--filter='):
            filter_arg = arg.split('=')[1]

    sync_price_to_r2(force=force_upload, max_workers=workers, dry_run=is_dry_run, filter_str=filter_arg)
