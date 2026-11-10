import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import boto3
    from botocore.config import Config
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "boto3"])
    import boto3
    from botocore.config import Config

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))

def get_env_var(name, default=None):
    val = os.getenv(name)
    if val:
        return val.strip()

    for env_candidate in ['.env', os.path.join(REPO_ROOT, '.env'), os.path.join(REPO_ROOT, 'complex3d', '.env')]:
        if os.path.exists(env_candidate):
            with open(env_candidate, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        if k.strip() == name:
                            return v.strip().strip('"').strip("'")
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

def fetch_existing_r2_objects(s3, bucket_name, prefix='data/3d/'):
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

def collect_local_files(custom_dir=None):
    dirs_to_check = []
    if custom_dir:
        dirs_to_check.append(custom_dir)
    dirs_to_check.extend([
        os.path.join(REPO_ROOT, 'complex3d', 'data', '3d'),
        os.path.join(REPO_ROOT, 'data', '3d')
    ])

    seen = set()
    local_files = []
    for base_dir in dirs_to_check:
        if not os.path.exists(base_dir):
            continue
        for f in os.listdir(base_dir):
            if f.endswith('.json') and f not in seen:
                seen.add(f)
                full_path = os.path.join(base_dir, f)
                r2_key = f"data/3d/{f}"
                size = os.path.getsize(full_path)
                local_files.append((full_path, r2_key, size))
    return local_files

def upload_single_file(s3, bucket_name, full_path, r2_key, size):
    extra_args = {
        'ContentType': 'application/json; charset=utf-8',
        'CacheControl': 'public, max-age=604800, stale-while-revalidate=86400' # 7 days CDN cache
    }
    s3.upload_file(full_path, bucket_name, r2_key, ExtraArgs=extra_args)
    return r2_key, size

def sync_3d_to_r2(force=False, max_workers=24, dry_run=False, target_dir=None):
    bucket_name = get_env_var('R2_BUCKET_NAME', 'realrankus-data')
    s3 = get_r2_client()

    prefix = 'data/3d/'
    existing_r2 = {}
    if not force:
        existing_r2 = fetch_existing_r2_objects(s3, bucket_name, prefix)

    local_files = collect_local_files(target_dir)
    total_files = len(local_files)
    total_bytes = sum(f[2] for f in local_files)
    print(f"[*] Local 3D files found: {total_files} files ({total_bytes / (1024*1024):.2f} MB)")

    to_upload = []
    skipped = 0
    skipped_bytes = 0

    for full_path, r2_key, size in local_files:
        if not force and r2_key in existing_r2 and existing_r2[r2_key] == size:
            skipped += 1
            skipped_bytes += size
        else:
            to_upload.append((full_path, r2_key, size))

    print(f"[*] Skipped (already in R2): {skipped} files ({skipped_bytes / (1024*1024):.2f} MB)")
    print(f"[*] Queued for upload: {len(to_upload)} files ({sum(x[2] for x in to_upload) / (1024*1024):.2f} MB)")

    if dry_run:
        print("[*] Dry run mode enabled. No files were uploaded.")
        return

    if not to_upload:
        print("[*] All 3D files are already up-to-date in R2. Nothing to upload.")
        return

    print(f"[*] Starting upload with {max_workers} threads...")
    start_time = time.time()
    uploaded_files = 0
    uploaded_bytes = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(upload_single_file, s3, bucket_name, item[0], item[1], item[2]): item for item in to_upload}
        for future in as_completed(futures):
            try:
                r2_key, size = future.result()
                uploaded_files += 1
                uploaded_bytes += size
                if uploaded_files % 100 == 0 or uploaded_files == len(to_upload):
                    elapsed = time.time() - start_time
                    speed = (uploaded_bytes / (1024*1024)) / elapsed if elapsed > 0 else 0
                    print(f"[{uploaded_files}/{len(to_upload)}] Uploaded {uploaded_bytes / (1024*1024):.2f} MB ({speed:.2f} MB/s)")
            except Exception as e:
                item = futures[future]
                print(f"[!] Error uploading {item[1]}: {e}")

    total_time = time.time() - start_time
    print(f"[+] 3D R2 sync complete: {uploaded_files} files ({uploaded_bytes / (1024*1024):.2f} MB) in {total_time:.2f}s")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Sync 3D complex data to Cloudflare R2")
    parser.add_argument('--force', action='store_true', help='Force re-upload of all files')
    parser.add_argument('--dry-run', action='store_true', help='Simulate upload without actual changes')
    parser.add_argument('--workers', type=int, default=24, help='Number of upload threads (default: 24)')
    parser.add_argument('--dir', default=None, help='Target directory containing 3D JSON files')
    args = parser.parse_args()

    sync_3d_to_r2(force=args.force, max_workers=args.workers, dry_run=args.dry_run, target_dir=args.dir)
