import os
import sys
import json
import re
import math
import time
import argparse
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8'
}

def fetch_json(url):
    req = urllib.request.Request(url, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def fetch_html(url):
    req = urllib.request.Request(url, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8')

def build_complex_3d(search_code, apt_name, law_addr, output_dir="data/3d", overwrite=False):
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"{search_code}.json")
    
    if not overwrite and os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
        return True, "Already exists (SKIP)"
        
    try:
        # 1. Clean apartment name
        clean_name = re.sub(r'\(.*?\)', '', apt_name).strip()
        addr_parts = str(law_addr).split()
        gu = next((p for p in addr_parts if p.endswith('구') or p.endswith('군') or p.endswith('시')), '')
        dong = next((p for p in addr_parts if p.endswith('동') or p.endswith('읍') or p.endswith('면') or p.endswith('리')), '')

        # 2. Query apt-suggest
        suggest_url = f"https://jiblab.kr/api/apt-suggest?q={urllib.parse.quote(clean_name)}"
        suggest_data = fetch_json(suggest_url)
        suggestions = suggest_data.get('suggestions', [])
        
        matched = None
        for s in suggestions:
            s_gu = s.get('gu', '') or s.get('regionName', '')
            s_dong = s.get('dong', '')
            if (gu and gu in s_gu) and (dong and dong in s_dong):
                matched = s
                break
        if not matched:
            for s in suggestions:
                s_gu = s.get('gu', '') or s.get('regionName', '')
                if gu and gu in s_gu:
                    matched = s
                    break
        if not matched and suggestions:
            matched = suggestions[0]
            
        if not matched:
            return False, f"No suggestion match for {apt_name}"
            
        region_slug = matched.get('regionSlug')
        apt_slug = matched.get('aptName')
        
        # 3. Fetch detail page
        detail_url = f"https://jiblab.kr/apt/{urllib.parse.quote(apt_slug)}?region={region_slug}"
        html = fetch_html(detail_url)
        cx_matches = re.findall(r'cx_[a-zA-Z0-9]+', html)
        if not cx_matches:
            return False, f"No 3D ID for {apt_name}"
            
        cx_id = cx_matches[0]
        
        # 4. Fetch 3D building geometry
        complex_3d_url = f"https://jiblab.kr/api/complex-3d/{cx_id}"
        raw_3d_data = fetch_json(complex_3d_url)
        
        # 5. Format, Filter & Save
        raw_center = raw_3d_data.get("center")
        center_obj = {"lat": 37.5, "lng": 127.0}
        if isinstance(raw_center, (list, tuple)) and len(raw_center) >= 2:
            a, b = float(raw_center[0]), float(raw_center[1])
            center_obj = {"lat": b, "lng": a} if a > 100 else {"lat": a, "lng": b}
        elif isinstance(raw_center, dict):
            center_obj = {
                "lat": float(raw_center.get("lat", raw_center.get("y", 37.5))),
                "lng": float(raw_center.get("lng", raw_center.get("x", 127.0)))
            }

        def evaluate_ring(ring, lat_ref):
            if not ring or len(ring) < 3:
                return 0.0, 0.0, 0.0
            kx = 111319.49 * math.cos(math.radians(lat_ref))
            ky = 111319.49
            xs = [p[0] * kx for p in ring]
            ys = [p[1] * ky for p in ring]
            span_x = max(xs) - min(xs)
            span_y = max(ys) - min(ys)
            min_span = min(span_x, span_y)
            box_area = span_x * span_y
            n = len(ring)
            area = 0.5 * abs(sum(xs[i] * ys[(i + 1) % n] - xs[(i + 1) % n] * ys[i] for i in range(n)))
            return area, box_area, min_span

        valid_buildings = []
        for b in raw_3d_data.get("buildings", []):
            rings = b.get("rings")
            if not rings or not rings[0] or len(rings[0]) < 3:
                continue
            area, box_area, min_span = evaluate_ring(rings[0], center_obj["lat"])
            if area < 25.0 or box_area < 25.0 or min_span < 3.0:
                continue
            if area < 65.0 or min_span < 6.5:
                if b.get("floors", 1) > 2:
                    b["floors"] = 2
                    if "height" in b: b["height"] = min(b["height"], 6.0)
                    if "heightM" in b: b["heightM"] = min(b["heightM"], 6.0)
                    b["lines"] = []
                    b["residential"] = False
                    b["selectable"] = False
            valid_buildings.append(b)

        valid_neighbors = []
        for nb in raw_3d_data.get("neighbors", []):
            rings = nb.get("rings")
            if not rings or not rings[0] or len(rings[0]) < 3:
                continue
            area, box_area, min_span = evaluate_ring(rings[0], center_obj["lat"])
            if area < 25.0 or box_area < 25.0 or min_span < 3.0:
                continue
            valid_neighbors.append(nb)

        output_data = {
            "searchCode": str(search_code),
            "name": apt_name,
            "lawAddr": law_addr,
            "center": center_obj,
            "buildings": valid_buildings,
            "neighbors": valid_neighbors,
            "floorBands": raw_3d_data.get("floorBands", []),
            "coverage": raw_3d_data.get("coverage", {}),
            "sourceComplexId": cx_id
        }
        
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))
            
        return True, f"Saved ({len(output_data['buildings'])} blds, {len(output_data['neighbors'])} nbrs)"
    except Exception as e:
        return False, str(e)

def run_batch(month_dir="202611", top_n=20, output_dir="data/3d", limit=None, workers=3):
    if not os.path.exists(month_dir):
        print(f"Directory {month_dir} not found!")
        return

    files = [f for f in os.listdir(month_dir) if f.endswith('.json') and not f.startswith('1000000000') and not f.startswith('summary')]
    print(f"Scanning {len(files)} gungu files in {month_dir} (Top {top_n} per gungu)...")

    seen_codes = set()
    targets = []
    for fname in sorted(files):
        fpath = os.path.join(month_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                d = json.load(f)
                items = d.get('data', [])
                for item in items[:top_n]:
                    code = item.get('검색코드') or item.get('searchCode')
                    name = item.get('아파트명')
                    addr = item.get('법정동주소')
                    rank = item.get('rank', 0)
                    if code and name and str(code) not in seen_codes:
                        seen_codes.add(str(code))
                        targets.append({
                            'code': str(code),
                            'name': name,
                            'addr': addr or '',
                            'rank': rank,
                            'file': fname
                        })
        except Exception as e:
            print(f"Error reading {fname}: {e}")

    if limit:
        targets = targets[:limit]

    print(f"Total unique target complexes to build: {len(targets)}")

    success_cnt = 0
    skip_cnt = 0
    fail_cnt = 0
    start_time = time.time()

    def process_target(t, idx):
        code = t['code']
        name = t['name']
        addr = t['addr']
        out_file = os.path.join(output_dir, f"{code}.json")

        if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            return idx, t, True, "Already exists (SKIP)"

        ok, msg = build_complex_3d(code, name, addr, output_dir=output_dir)
        time.sleep(0.2)
        return idx, t, ok, msg

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process_target, t, i + 1): t for i, t in enumerate(targets)}
        for future in as_completed(futures):
            idx, t, ok, msg = future.result()
            if "SKIP" in msg:
                skip_cnt += 1
                status = "SKIP"
            elif ok:
                success_cnt += 1
                status = "OK"
            else:
                fail_cnt += 1
                status = "FAIL"

            done_total = success_cnt + skip_cnt + fail_cnt
            if done_total % 10 == 0 or status == "OK" or done_total == len(targets):
                elapsed = time.time() - start_time
                print(f"[{done_total}/{len(targets)}] ({status}) {t['name']} ({t['code']}) -> {msg} (Elapsed: {elapsed:.1f}s)", flush=True)

    elapsed_total = time.time() - start_time
    print("\n==========================================", flush=True)
    print(f"Batch completed: Total {len(targets)} | Success {success_cnt} | Skipped {skip_cnt} | Failed {fail_cnt} | Total Time: {elapsed_total:.1f}s", flush=True)
    print("==========================================", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RealRankers 3D Complex Builder")
    parser.add_argument("--code", help="Complex searchCode")
    parser.add_argument("--name", help="Apartment name")
    parser.add_argument("--addr", help="Legal address")
    parser.add_argument("--batch", action="store_true", help="Run batch build for all gungu")
    parser.add_argument("--month", default="202611", help="Monthly data directory (default: 202611)")
    parser.add_argument("--top", type=int, default=20, help="Top N per gungu (default: 20)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of complexes")
    parser.add_argument("--workers", type=int, default=3, help="Worker threads (default: 3)")
    parser.add_argument("--output", default="data/3d", help="Output directory")

    args = parser.parse_args()

    if args.batch:
        run_batch(month_dir=args.month, top_n=args.top, output_dir=args.output, limit=args.limit, workers=args.workers)
    elif args.code and args.name:
        ok, msg = build_complex_3d(args.code, args.name, args.addr or "", output_dir=args.output, overwrite=True)
        print(f"Result for {args.name} ({args.code}): {ok} - {msg}")
    else:
        print("Running quick test...")
        for code, name, addr in [("111515", "헬리오시티", "서울시 송파구 가락동 913"), ("72", "상계주공10단지", "서울시 노원구 상계동 666")]:
            ok, msg = build_complex_3d(code, name, addr, output_dir=args.output)
            print(f"[{code}] {name} -> {ok}: {msg}")
