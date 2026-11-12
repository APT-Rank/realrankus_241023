"""
build_all_korea_3d.py
=====================
전국 GIS 건물 SHP + 국토교통부 건축물대장(표제부/전유부) 융합 3D 빌더 파이프라인

융합 데이터:
1. 전국 GIS 건물 외곽선 SHP (EPSG:5186 -> EPSG:4326): 실측 동별 풋프린트 & 높이
2. 건축물대장 표제부 (mart_djy_03.txt): 엘리베이터, 자주식/기계식 주차, 층고, 내진/구조, 사용승인일
3. 건축물대장 전유부 (mart_djy_09.txt): 라인별 계단식 단차(floorMin/Max), 1층 필로티, 실존 호수 목록

출력:
complex3d/data/3d/{searchCode}.json 및 data/3d/{searchCode}.json
R2 동기화:
--upload 옵션 시 Cloudflare R2 버킷 s3://realrankus-data/data/3d/ 에 자동 동기화
"""

import os
import sys
import glob
import json
import re
import math
import time
import argparse
from concurrent.futures import ThreadPoolExecutor

try:
    import pyproj
    import geopandas as gpd
    import pandas as pd
    from shapely.geometry import mapping
except ImportError:
    print("Required packages: pyproj, geopandas, pandas, shapely")
    sys.exit(1)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
GIS_DIR = r"D:\real_estate_data\99_GIS_Building_shp"
PYOJE_PATH = os.path.join(GIS_DIR, r"국토교통부_건축물대장_표제부\mart_djy_03.txt")
JEONYU_PATH = os.path.join(GIS_DIR, r"국토교통부_건축물대장_전유부\mart_djy_09.txt")
OUTPUT_DIR = os.path.join(REPO_ROOT, "complex3d", "data", "3d")

# Coordinate transformers
transformer_to_5186 = pyproj.Transformer.from_crs('EPSG:4326', 'EPSG:5186', always_xy=True)
transformer_to_4326 = pyproj.Transformer.from_crs('EPSG:5186', 'EPSG:4326', always_xy=True)

SIDO_MAP = {
    '11': '서울', '12': '광주/전남', '26': '부산', '27': '대구', '28': '인천', '29': '광주',
    '30': '대전', '31': '울산', '36': '세종', '41': '경기', '42': '강원',
    '43': '충북', '44': '충남', '45': '전북', '46': '전남', '47': '경북',
    '48': '경남', '50': '제주', '51': '강원', '52': '전북'
}

def load_all_target_complexes(month_dir=os.path.join(REPO_ROOT, "202611"), filter_sido=None):
    """Load all unique complexes from RealRankus month folder."""
    files = [f for f in os.listdir(month_dir) if f.endswith('.json') and not f.startswith('1000000000') and not f.startswith('summary')]
    
    complexes = {}
    for fname in sorted(files):
        sido_prefix = fname[:2]
        if filter_sido and filter_sido != 'all' and sido_prefix != filter_sido:
            continue
            
        fpath = os.path.join(month_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as fp:
                d = json.load(fp)
                for it in d.get('data', []):
                    code = str(it.get('검색코드') or it.get('searchCode') or '')
                    if not code or code in complexes:
                        continue
                    
                    addr = it.get('법정동주소') or ''
                    name = it.get('아파트명') or ''
                    x = float(it.get('X') or 0)
                    y = float(it.get('Y') or 0)
                    if x == 0 or y == 0:
                        continue
                        
                    # Extract parcel bun and ji
                    m = re.search(r'(\d+)(?:-(\d+))?$', addr.strip())
                    bun = f"{int(m.group(1)):04d}" if m else "0000"
                    ji = f"{int(m.group(2)):04d}" if m and m.group(2) else "0000"
                    
                    complexes[code] = {
                        'code': code,
                        'name': name,
                        'addr': addr,
                        'x': x,
                        'y': y,
                        'sido': sido_prefix,
                        'sigungu_code': fname[:5],
                        'bun': bun,
                        'ji': ji,
                        'households': it.get('세대수') or 0
                    }
        except Exception as e:
            print(f"Error reading {fname}: {e}")
            
    return complexes

AUX_KEYWORDS = (
    '경비', '관리', '노인', '주차', '상가', '유치원', '어린이집', '근린',
    '펌프', '전기', '변전', '발전', '기계', '보일러', '창고', '쓰레기',
    '분리', '화장실', '주민', '커뮤니티', '복지', '문고', '독서', '헬스',
    '테니스', '정자', '공공', '경로당', '문주', '스포츠', '체육'
)

def is_aux_name(name):
    s = str(name or '').strip()
    return any(k in s for k in AUX_KEYWORDS)

def extract_dong_from_addr(addr):
    s = re.sub(r'\s+(?:산\s*)?\d+(?:-\d+)?(?:번지?)?$', '', str(addr or '').strip())
    parts = s.split()
    return parts[-1] if parts else ''

def _norm_bjdong_stem(dong_tok):
    """Normalize 행정동/법정동 token so 상계8동==상계동, 성수1가동==성수동1가, while keeping 일원동!=역삼동."""
    s = re.sub(r'\s+', '', str(dong_tok or '').strip())
    if not s:
        return ''
    s = re.sub(r'동(?=\d+가$)', '', s)
    s = re.sub(r'(?:제?\d+)?동$', '', s)
    return s

_BRAND_ALIASES = (
    (r'the\s*sharp|더\s*샵', '더샵'),
    (r'hill\s*state|힐스테이트', '힐스테이트'),
    (r'raemian|래미안', '래미안'),
    (r'prugio|푸르지오', '푸르지오'),
    (r'lotte\s*castle|롯데캐슬', '롯데캐슬'),
    (r'i[\s\-]*park|아이파크', '아이파크'),
    (r'e[\s\-]*편한세상', 'e편한세상'),
    (r'forena|포레나', '포레나'),
    (r'elife|엘리프', '엘리프'),
    (r'haus\s*d|하우스디', '하우스디'),
    (r'(?<![a-z0-9])xi(?![a-z0-9])', '자이'),
)

def _clean_cpx_text(s):
    s = str(s or '').lower()
    s = re.sub(r'\(.*?\)', '', s)
    for pat, rep in _BRAND_ALIASES:
        s = re.sub(pat, rep, s)
    s = re.sub(r'아파트|주상복합|도시형생활주택|오피스텔', '', s)
    s = re.sub(r'[\s\.\,\·\-\_]+', '', s)
    return s.strip()

def _extract_unit_tags(s):
    """Extract 단지/차수/지구 tags so 10단지 never matches 9단지 or 1단지."""
    txt = str(s or '')
    danji = re.findall(r'(\d+)\s*단지', txt)
    chasu = re.findall(r'(\d+)\s*차', txt)
    jigu = re.findall(r'(\d+)\s*지구', txt)
    roman = re.findall(r'(Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|I{1,3}V?)', txt) if any(r in txt for r in ('Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ')) else []
    return set(danji), set(chasu), set(jigu), set(roman)

def is_strict_name_match(cpx_name, pyoje_bld_names, cand_a24):
    """Strict complex name matching replacing naive [:4] substring matching."""
    cand_raw = str(cand_a24 or '').strip()
    if not cand_raw or cand_raw == 'None':
        return False

    c_danji, c_chasu, c_jigu, c_rom = _extract_unit_tags(cpx_name)
    a_danji, a_chasu, a_jigu, a_rom = _extract_unit_tags(cand_raw)

    # Reject explicit danji/chasu/jigu/roman mismatches (e.g. 10단지 vs 9단지, 1차 vs 2차)
    if c_danji and a_danji and not (c_danji & a_danji):
        return False
    if c_chasu and a_chasu and not (c_chasu & a_chasu):
        return False
    if c_jigu and a_jigu and not (c_jigu & a_jigu):
        return False
    if c_rom and a_rom and not (c_rom & a_rom):
        return False

    cand_clean = _clean_cpx_text(cand_raw)
    if len(cand_clean) < 2:
        return False

    # Build normalized candidate target names from 202611 + Pyoje ledger
    targets = [_clean_cpx_text(cpx_name)]
    for pn in (pyoje_bld_names or []):
        pc = _clean_cpx_text(pn)
        if pc and len(pc) >= 2:
            targets.append(pc)

    # Also strip trailing '마을' prefix (e.g., '꽃메마을한라신영프로방스' -> '한라신영프로방스')
    stripped_targets = list(targets)
    for t in targets:
        m = re.match(r'^[가-힣]{2,5}(?:마을|신도시|지구)(.+)$', t)
        if m and len(m.group(1)) >= 3:
            stripped_targets.append(m.group(1))

    for t in stripped_targets:
        if not t or len(t) < 2:
            continue
        if t == cand_clean:
            return True
        if len(t) >= 4 and len(cand_clean) >= 4:
            if t in cand_clean or cand_clean in t:
                return True
    return False

def is_strong_full_name_match(cpx_name, pyoje_bld_names, cand_a24):
    """Stricter full-name match (len >= 5 exact/full containment) safe for cross-parcel rescue."""
    if not is_strict_name_match(cpx_name, pyoje_bld_names, cand_a24):
        return False
    cand_clean = _clean_cpx_text(cand_a24)
    if len(cand_clean) < 5:
        return False
    targets = [_clean_cpx_text(cpx_name)] + [_clean_cpx_text(p) for p in (pyoje_bld_names or [])]
    for t in targets:
        if len(t) >= 5 and (t == cand_clean or t in cand_clean or cand_clean in t):
            return True
    return False

def is_needle_or_sliver(geom):
    """Filter out footprints < 25 sqm or minimum width < 3.0m (including rotated bbox)."""
    if geom is None or geom.is_empty:
        return True
    if geom.area < 25.0:
        return True
    minx, miny, maxx, maxy = geom.bounds
    if min(maxx - minx, maxy - miny) < 3.0:
        return True
    try:
        mrr = geom.minimum_rotated_rectangle
        if mrr is not None and mrr.geom_type == 'Polygon':
            coords = list(mrr.exterior.coords)
            if len(coords) >= 4:
                e1 = math.hypot(coords[1][0] - coords[0][0], coords[1][1] - coords[0][1])
                e2 = math.hypot(coords[2][0] - coords[1][0], coords[2][1] - coords[1][1])
                if min(e1, e2) < 3.0:
                    return True
    except Exception:
        pass
    return False

def _norm_dong_key(d):
    s = re.sub(r'\s+', '', str(d or '').strip())
    s = re.sub(r'^제(?=\d)', '', s)
    return s

def match_ledger_dong(dong_name, ledger_dict):
    """Exact and numeric-token safe dong matcher ('1동' never matches '101동')."""
    if not ledger_dict or not dong_name:
        return None
    if dong_name in ledger_dict:
        return ledger_dict[dong_name]
    norm_target = _norm_dong_key(dong_name)
    for k, v in ledger_dict.items():
        if _norm_dong_key(k) == norm_target:
            return v
    m_num = re.match(r'^(\d+)동?$', norm_target)
    if m_num:
        num_str = m_num.group(1)
        for k, v in ledger_dict.items():
            kn = _norm_dong_key(k)
            km = re.match(r'^(\d+)동?$', kn)
            if km and km.group(1) == num_str:
                return v
    return None

def scan_ledgers_for_complexes(complex_list):
    """Scan Pyoje and Jeonyu text files once for target complexes."""
    target_parcels = {} # (sigungu, bun, ji) -> set of bjdong stems
    for c in complex_list:
        pk = (c['sigungu_code'], c['bun'], c['ji'])
        stem = _norm_bjdong_stem(extract_dong_from_addr(c.get('addr', '')))
        if pk not in target_parcels:
            target_parcels[pk] = set()
        if stem:
            target_parcels[pk].add(stem)
        
    print(f"Indexing ledgers for {len(target_parcels)} target parcels...")
    
    # 1. Scan Pyoje (표제부)
    pyoje_data = {} # (sigungu, dong_stem, bun, ji) -> { 'dongs': {dong -> dict}, 'pnu_set': set(), 'bld_names': set() }
    t0 = time.time()
    if os.path.exists(PYOJE_PATH):
        with open(PYOJE_PATH, 'r', encoding='utf-8', errors='ignore') as fp:
            for line in fp:
                parts = line.strip().split('|')
                if len(parts) > 60:
                    sigungu = parts[8]
                    bun = parts[11]
                    ji = parts[12]
                    pk = (sigungu, bun, ji)
                    if pk in target_parcels:
                        row_stem = _norm_bjdong_stem(extract_dong_from_addr(parts[5]))
                        exp_stems = target_parcels[pk]
                        if exp_stems and row_stem and row_stem not in exp_stems:
                            continue
                        key = (sigungu, row_stem if exp_stems else '', bun, ji)
                        bjdong = parts[9].strip()
                        pnu_type = '1' if parts[10].strip() in ('0', '') else '2'
                        pnu = f"{sigungu}{bjdong}{pnu_type}{bun}{ji}"

                        bld_name = parts[7].strip()
                        dong = parts[22].strip() or bld_name
                        main_sub = parts[24].strip()
                        use_cd = parts[34].strip()
                        use_nm = parts[35].strip()
                        use_etc = parts[36].strip()

                        if key not in pyoje_data:
                            pyoje_data[key] = {'dongs': {}, 'pnu_set': set(), 'bld_names': set()}
                        if len(pnu) == 19:
                            pyoje_data[key]['pnu_set'].add(pnu)
                        if bld_name:
                            pyoje_data[key]['bld_names'].add(bld_name)

                        try:
                            hh = int(parts[37]) if parts[37] else 0
                        except Exception:
                            hh = 0
                        try:
                            height = float(parts[42]) if parts[42] else 0.0
                        except Exception:
                            height = 0.0
                        try:
                            grnd_flr = int(parts[43]) if parts[43] else 0
                        except Exception:
                            grnd_flr = 0
                        try:
                            ugrnd_flr = int(parts[44]) if parts[44] else 0
                        except Exception:
                            ugrnd_flr = 0
                        try:
                            elev_pass = int(parts[45]) if parts[45] else 0
                        except Exception:
                            elev_pass = 0
                        try:
                            elev_emerg = int(parts[46]) if parts[46] else 0
                        except Exception:
                            elev_emerg = 0
                        try:
                            park_indoor = float(parts[48]) if parts[48] else 0
                        except Exception:
                            park_indoor = 0
                        try:
                            park_self = int(parts[54]) if parts[54] else 0
                        except Exception:
                            park_self = 0

                        is_res = (
                            main_sub == '주건축물' and
                            (use_cd == '02000' or '공동주택' in use_nm or '아파트' in use_etc) and
                            (not is_aux_name(dong)) and
                            (hh > 0 or grnd_flr >= 3)
                        )

                        pyoje_data[key]['dongs'][dong] = {
                            'bld_name': bld_name,
                            'dong': dong,
                            'height': height,
                            'grnd_flr': grnd_flr,
                            'ugrnd_flr': ugrnd_flr,
                            'elev_pass': elev_pass,
                            'elev_emerg': elev_emerg,
                            'park_indoor': park_indoor,
                            'park_self': park_self,
                            'struct': parts[32].strip(),
                            'use_apr': parts[60].strip(),
                            'hh': hh,
                            'is_res': is_res
                        }
        print(f"Pyoje indexed in {time.time()-t0:.2f}s (found {len(pyoje_data)} parcels)")
    else:
        print("Pyoje file not found, skipping Pyoje indexing.")

    # 2. Scan Jeonyu (전유부)
    jeonyu_data = {} # (sigungu, dong_stem, bun, ji) -> dong -> { line_floors: {}, units: [], min_floor, max_floor }
    t0 = time.time()
    if os.path.exists(JEONYU_PATH):
        with open(JEONYU_PATH, 'r', encoding='utf-8', errors='ignore') as fp:
            for line in fp:
                parts = line.strip().split('|')
                if len(parts) > 25:
                    sigungu = parts[8]
                    bun = parts[11]
                    ji = parts[12]
                    pk = (sigungu, bun, ji)
                    if pk in target_parcels:
                        row_stem = _norm_bjdong_stem(extract_dong_from_addr(parts[5]))
                        exp_stems = target_parcels[pk]
                        if exp_stems and row_stem and row_stem not in exp_stems:
                            continue
                        key = (sigungu, row_stem if exp_stems else '', bun, ji)
                        dong = parts[21].strip()
                        ho = parts[22].strip()
                        try:
                            flr = int(parts[25]) if parts[25] else 1
                        except Exception:
                            flr = 1
                            
                        if key not in jeonyu_data:
                            jeonyu_data[key] = {}
                        if dong not in jeonyu_data[key]:
                            jeonyu_data[key][dong] = {
                                'line_floors': {},
                                'units': [],
                                'min_floor': 999,
                                'max_floor': 0
                            }
                            
                        # Determine line from ho (e.g. 101 -> line 1, 1502 -> line 2)
                        m_line = re.search(r'(\d{1,2})$', ho)
                        line_no = f"{int(m_line.group(1)):02d}" if m_line else "01"
                        
                        lf = jeonyu_data[key][dong]['line_floors']
                        if line_no not in lf:
                            lf[line_no] = {'floorMin': flr, 'floorMax': flr, 'count': 0}
                        lf[line_no]['floorMin'] = min(lf[line_no]['floorMin'], flr)
                        lf[line_no]['floorMax'] = max(lf[line_no]['floorMax'], flr)
                        lf[line_no]['count'] += 1
                        
                        jeonyu_data[key][dong]['min_floor'] = min(jeonyu_data[key][dong]['min_floor'], flr)
                        jeonyu_data[key][dong]['max_floor'] = max(jeonyu_data[key][dong]['max_floor'], flr)
                        if len(jeonyu_data[key][dong]['units']) < 100: # keep sample
                            jeonyu_data[key][dong]['units'].append({'unit': ho, 'floor': flr, 'line': line_no})
                            
        print(f"Jeonyu indexed in {time.time()-t0:.2f}s (found {len(jeonyu_data)} parcels)")
    else:
        print("Jeonyu file not found, skipping Jeonyu indexing.")
        
    return pyoje_data, jeonyu_data

def _geom_to_rings(geom):
    rings = []
    if geom.geom_type == 'Polygon':
        coords = [list(transformer_to_4326.transform(x, y)) for x, y in geom.exterior.coords]
        rings.append(coords)
        for interior in geom.interiors:
            rings.append([list(transformer_to_4326.transform(x, y)) for x, y in interior.coords])
    elif geom.geom_type == 'MultiPolygon':
        poly = max(geom.geoms, key=lambda a: a.area)
        coords = [list(transformer_to_4326.transform(x, y)) for x, y in poly.exterior.coords]
        rings.append(coords)
        for interior in poly.interiors:
            rings.append([list(transformer_to_4326.transform(x, y)) for x, y in interior.coords])
    return rings

def build_complex_json(cpx, gdf_sido, pyoje_data, jeonyu_data, source_label='korea_gis_ledger_fused_v2'):
    """Build a rich 3D JSON using PNU + strict complex name + Pyoje ground-truth orphan rescue."""
    cx, cy = transformer_to_5186.transform(cpx['x'], cpx['y'])
    try:
        hh_total = int(str(cpx.get('households') or 0).replace(',', '').strip())
    except Exception:
        hh_total = 0

    # Dynamic bounding box radius based on household count (prevents cropping large complexes)
    radius_m = 550 if hh_total >= 1500 else (420 if hh_total >= 500 else 320)
    bbox = (cx - radius_m, cy - radius_m, cx + radius_m, cy + radius_m)
    try:
        matched_gdf = gdf_sido.cx[bbox[0]:bbox[2], bbox[1]:bbox[3]]
    except Exception:
        return None
        
    if len(matched_gdf) == 0:
        return None

    addr_dong = extract_dong_from_addr(cpx.get('addr', ''))
    dong_stem = _norm_bjdong_stem(addr_dong)
    parcel_key = (cpx['sigungu_code'], dong_stem, cpx['bun'], cpx['ji'])
    if parcel_key not in pyoje_data and (cpx['sigungu_code'], '', cpx['bun'], cpx['ji']) in pyoje_data:
        parcel_key = (cpx['sigungu_code'], '', cpx['bun'], cpx['ji'])
    pyoje_bundle = pyoje_data.get(parcel_key, {})
    cpx_pyoje = pyoje_bundle.get('dongs', {})
    pnu_set = pyoje_bundle.get('pnu_set', set())
    pyoje_bld_names = pyoje_bundle.get('bld_names', set())
    cpx_jeonyu = jeonyu_data.get(parcel_key, {})

    pyoje_res_dongs = {k: v for k, v in cpx_pyoje.items() if v.get('is_res')}
    bun_int = int(cpx['bun']) if cpx['bun'].isdigit() else 0
    ji_int = int(cpx['ji']) if cpx['ji'].isdigit() else 0
    bun_ji_str = f"{bun_int}-{ji_int}" if ji_int > 0 else str(bun_int)

    # Classify each GIS feature inside dynamic bbox
    selected_rows = []
    selected_indices = set()
    assigned_pyoje_keys = set()

    # Stage 1: Exact Parcel / PNU Match
    for idx, row in matched_gdf.iterrows():
        geom = row.geometry
        if is_needle_or_sliver(geom):
            continue

        a2 = str(row.get('A2') or '').strip()
        a4 = str(row.get('A4') or '').strip()
        a5 = str(row.get('A5') or '').strip()
        a9 = str(row.get('A9') or '').strip()
        a24 = str(row.get('A24') or '').strip()
        a25 = str(row.get('A25') or '').strip()

        in_pnu = (a2 in pnu_set) if pnu_set else False
        in_parcel = (addr_dong and addr_dong in a4 and a5 == bun_ji_str)

        if not (in_pnu or in_parcel):
            continue

        # Exclude single-family detached houses if Pyoje says this is a multi-unit parcel
        if a9 == '단독주택' and pyoje_res_dongs and a25 not in cpx_pyoje:
            continue

        # Shared parcel guard: if A24 explicitly names a DIFFERENT complex, reject
        if a24 and a24 != 'None' and not is_strict_name_match(cpx['name'], pyoje_bld_names, a24):
            # Allow generic/aux structures explicitly named in Pyoje (e.g. 상가동, 관리동)
            if not (a25 and match_ledger_dong(a25, cpx_pyoje)):
                continue

        # For unlabeled (A24=None, A25=None) polygons on the same parcel:
        # drop tiny sheds < 65sqm immediately; larger ones go through unlabeled filtering below
        if (not a24 or a24 == 'None') and (not a25 or a25 == 'None') and geom.area < 65.0:
            continue

        selected_rows.append((idx, row, None))
        selected_indices.add(idx)

    # Stage 2: Strict Complex Name Match (captures sub-parcel aux & multi-parcel complexes without neighboring complex collisions)
    c_danji, _, _, _ = _extract_unit_tags(cpx['name'])
    pyoje_has_numbered = any(re.search(r'\d+동?$', _norm_dong_key(k)) for k in pyoje_res_dongs)
    for idx, row in matched_gdf.iterrows():
        if idx in selected_indices:
            continue
        geom = row.geometry
        if is_needle_or_sliver(geom):
            continue
        a5 = str(row.get('A5') or '').strip()
        a9 = str(row.get('A9') or '').strip()
        a24 = str(row.get('A24') or '').strip()
        a25 = str(row.get('A25') or '').strip()
        if a9 == '단독주택':
            continue
        if not is_strict_name_match(cpx['name'], pyoje_bld_names, a24):
            continue

        # Guard for candidates OUTSIDE Stage 1's exact parcel when Pyoje exists:
        # Never pull in neighboring complexes that merely share a generic name (e.g. 상계주공아파트, 꽃메마을 현대홈타운)
        if pyoje_res_dongs:
            gc = geom.centroid
            dist_m = math.hypot(gc.x - cx, gc.y - cy)
            strong_nm = is_strong_full_name_match(cpx['name'], pyoje_bld_names, a24)
            if a25 and a25 != 'None' and not is_aux_name(a25):
                if match_ledger_dong(a25, cpx_pyoje) is None:
                    # Consolidated single-ledger mixed-use towers (e.g. Pyoje '래미안 용산 더 센트럴' vs VWorld A동/B동)
                    if not (not pyoje_has_numbered and strong_nm and dist_m <= 180.0):
                        continue
            else:
                if match_ledger_dong(a25, cpx_pyoje) is None:
                    a5_bun = re.split(r'\D+', a5)[0] if a5 else ''
                    same_bun = (bun_int > 0 and a5_bun == str(bun_int))
                    if not (same_bun or (strong_nm and dist_m <= 220.0)):
                        continue
                    a_danji, _, _, _ = _extract_unit_tags(f"{a24} {a25}")
                    if c_danji and (not a_danji or not (c_danji & a_danji)):
                        if not (strong_nm and dist_m <= 220.0):
                            continue

        selected_rows.append((idx, row, None))
        selected_indices.add(idx)

    # Stage 2.5: Nearby Parcel-Cluster Dong-Set Rescue (when Stage 1 + 2 found 0 non-aux residential-scale polygons)
    has_res_cand_so_far = any(
        (not is_aux_name(str(r.get('A25') or ''))) and (r.geometry.area >= 120.0 or float(r.get('A26') or 0) >= 3)
        for _, r, _ in selected_rows
    )
    if (not has_res_cand_so_far) and pyoje_res_dongs:
        clusters = {}
        c_sig = str(cpx.get('sigungu_code') or '')
        search_r = 220.0 if hh_total >= 500 else 160.0
        for idx, row in matched_gdf.iterrows():
            if idx in selected_indices:
                continue
            geom = row.geometry
            if is_needle_or_sliver(geom):
                continue
            a2 = str(row.get('A2') or '').strip()
            a5 = str(row.get('A5') or '').strip()
            a9 = str(row.get('A9') or '').strip()
            a24 = str(row.get('A24') or '').strip()
            a25 = str(row.get('A25') or '').strip()
            if a9 == '단독주택':
                continue
            if c_sig and len(a2) >= 5 and a2[:5] != c_sig:
                continue
            gc = geom.centroid
            dist_m = math.hypot(gc.x - cx, gc.y - cy)
            if dist_m > search_r:
                continue
            pk = a2[:19] if len(a2) >= 19 else (f"{a5}" if a5 else '')
            if not pk:
                continue
            cl = clusters.setdefault(pk, {'rows': [], 'matched': set(), 'unmatched_num': set(), 'bad_name': False, 'name_ok': False, 'min_dist': 9999.0})
            cl['rows'].append((idx, row))
            cl['min_dist'] = min(cl['min_dist'], dist_m)
            try:
                flr_v = int(float(row.get('A26') or 0))
            except Exception:
                flr_v = 0
            if a24 and a24 != 'None':
                if is_strict_name_match(cpx['name'], pyoje_bld_names, a24):
                    cl['name_ok'] = True
                elif flr_v >= 3 and not is_aux_name(a25):
                    cl['bad_name'] = True
            dn = a25 if (a25 and a25 != 'None') else ''
            if dn and ',' not in dn and not is_aux_name(dn):
                pm = match_ledger_dong(dn, pyoje_res_dongs)
                if pm:
                    cl['matched'].add(pm['dong'])
                elif match_ledger_dong(dn, cpx_pyoje) is None and re.match(r'^(?:제?\d+|[A-Za-z])동?$', _norm_dong_key(dn)):
                    cl['unmatched_num'].add(_norm_dong_key(dn))

        qualifying = []
        for pk, cl in clusters.items():
            if cl['bad_name']:
                continue
            m_cnt = len(cl['matched'])
            u_cnt = len(cl['unmatched_num'])
            md = cl['min_dist']
            ok = (
                (m_cnt >= 2 and u_cnt == 0 and md <= 130.0)
                or (m_cnt >= 3 and u_cnt <= 1 and m_cnt >= u_cnt * 2 and md <= 130.0)
                or (len(pyoje_res_dongs) == 1 and m_cnt == 1 and u_cnt == 0 and md <= 75.0)
                or (cl['name_ok'] and u_cnt == 0 and md <= 100.0)
            )
            if ok:
                qualifying.append((m_cnt, -md, pk, cl))
        if qualifying:
            qualifying.sort(reverse=True)
            best_m, _, best_pk, best_cl = qualifying[0]
            chosen_pks = [best_cl]
            # Also include sibling multi-parcel clusters that explicitly share matched name/dongs without conflict
            for m_cnt, neg_md, pk, cl in qualifying[1:]:
                if cl['name_ok'] or (cl['matched'] and len(cl['unmatched_num']) == 0 and (-neg_md) <= 100.0):
                    chosen_pks.append(cl)
            for cl in chosen_pks:
                for idx, row in cl['rows']:
                    if idx not in selected_indices:
                        selected_rows.append((idx, row, None))
                        selected_indices.add(idx)

    # Track which Pyoje residential dongs have already been matched
    for idx, row, forced_dong in selected_rows:
        dn = forced_dong or str(row.get('A25') or '').strip()
        if not dn or dn == 'None':
            m_d = re.search(r'(\d+동)', str(row.get('A24') or ''))
            dn = m_d.group(1) if m_d else ''
        p_match = match_ledger_dong(dn, pyoje_res_dongs)
        if p_match:
            assigned_pyoje_keys.add(p_match['dong'])

    # Separate labeled rows vs unlabeled (A24=None, A25=None) Stage 1 rows
    missing_res_dongs = [v for k, v in pyoje_res_dongs.items() if k not in assigned_pyoje_keys]
    unlabeled_stage1 = []
    cleaned_selected = []
    for idx, row, fd in selected_rows:
        a24 = str(row.get('A24') or '').strip()
        a25 = str(row.get('A25') or '').strip()
        if (not a24 or a24 == 'None') and (not a25 or a25 == 'None') and fd is None:
            unlabeled_stage1.append((idx, row))
        else:
            cleaned_selected.append((idx, row, fd))

    unlabeled_stage1.sort(key=lambda item: -item[1].geometry.area)
    kept_unlabeled = []
    for idx, row in unlabeled_stage1:
        a9 = str(row.get('A9') or '').strip()
        try:
            flr_shp = int(float(row.get('A26') or 0))
        except Exception:
            flr_shp = 0
        # Pair unlabeled apartment-sized footprint with a missing Pyoje residential dong
        if missing_res_dongs and row.geometry.area >= 150.0 and (a9 in ('', 'None', '공동주택', '아파트') or flr_shp >= 3):
            target_p = missing_res_dongs.pop(0)
            kept_unlabeled.append((idx, row, target_p['dong']))
            assigned_pyoje_keys.add(target_p['dong'])
        elif flr_shp >= 1 and a9 not in ('', 'None', '공동주택', '아파트') and row.geometry.area >= 65.0:
            # Keep only genuine non-residential facilities that have real floor & usage metadata
            kept_unlabeled.append((idx, row, None))
        else:
            # Drop unlabeled zero-floor parking ramps/slabs so ghost '동_X (5F/15m)' blocks are never emitted
            selected_indices.discard(idx)

    selected_rows = cleaned_selected + kept_unlabeled

    # Stage 3: Cross-boundary / Mis-parcel Orphan Polygon Rescue (e.g., 603동 on 보정동 1209)
    if missing_res_dongs and len(selected_rows) > 0:
        # Compute spatial hull bounds of already matched complex buildings
        xs_c = [r.geometry.centroid.x for _, r, _ in selected_rows]
        ys_c = [r.geometry.centroid.y for _, r, _ in selected_rows]
        min_bx, max_bx = min(xs_c) - 90.0, max(xs_c) + 90.0
        min_by, max_by = min(ys_c) - 90.0, max(ys_c) + 90.0
        cpx_mid_x, cpx_mid_y = sum(xs_c) / len(xs_c), sum(ys_c) / len(ys_c)

        orphan_candidates = []
        for idx, row in matched_gdf.iterrows():
            if idx in selected_indices:
                continue
            geom = row.geometry
            if is_needle_or_sliver(geom) or geom.area < 200.0:
                continue
            a9 = str(row.get('A9') or '').strip()
            a24 = str(row.get('A24') or '').strip()
            a25 = str(row.get('A25') or '').strip()
            # Must be unlabeled (GIS missing attribute) and not an explicit non-residential facility
            if (a24 and a24 != 'None') or (a25 and a25 != 'None'):
                continue
            if a9 and a9 not in ('None', '', '공동주택', '아파트'):
                continue
            gc = geom.centroid
            if min_bx <= gc.x <= max_bx and min_by <= gc.y <= max_by:
                dist = math.hypot(gc.x - cpx_mid_x, gc.y - cpx_mid_y)
                orphan_candidates.append((dist, -geom.area, idx, row))

        orphan_candidates.sort()
        for _, _, idx, row in orphan_candidates:
            if not missing_res_dongs:
                break
            target_p = missing_res_dongs.pop(0)
            selected_rows.append((idx, row, target_p['dong']))
            selected_indices.add(idx)
            assigned_pyoje_keys.add(target_p['dong'])

    if len(selected_rows) == 0:
        return None

    buildings = []
    total_households = 0
    total_elev_pass = 0
    total_elev_emerg = 0
    total_park_self = 0
    max_height = 0.0
    structures = set()
    use_approval_dates = set()
    res_built_count = 0

    for idx, row, forced_dong in selected_rows:
        geom = row.geometry
        if is_needle_or_sliver(geom):
            continue

        bld_name = str(row.get('A24') or '')
        dong_name = forced_dong or str(row.get('A25') or '')
        if not dong_name or dong_name == 'None':
            m_d = re.search(r'(\d+동)', bld_name)
            dong_name = m_d.group(1) if m_d else f"동_{len(buildings)+1}"

        rings = _geom_to_rings(geom)
        if not rings:
            continue

        p_dong = match_ledger_dong(dong_name, cpx_pyoje)
        j_dong = match_ledger_dong(dong_name, cpx_jeonyu)

        try:
            flr_val = row['A26']
            flr = int(float(flr_val)) if flr_val is not None and not pd.isna(flr_val) else 0
        except Exception:
            flr = 0

        try:
            h_val = row['A16']
            height = float(h_val) if h_val is not None and not pd.isna(h_val) else 0.0
        except Exception:
            height = 0.0

        if p_dong:
            if p_dong['height'] > 0:
                height = p_dong['height']
            if p_dong['grnd_flr'] > 0:
                flr = p_dong['grnd_flr']
            if p_dong['struct']:
                structures.add(p_dong['struct'])
            if p_dong['use_apr']:
                use_approval_dates.add(p_dong['use_apr'])
            total_elev_pass += p_dong['elev_pass']
            total_elev_emerg += p_dong['elev_emerg']
            total_park_self += p_dong['park_self']
        elif flr <= 0 and '지하주차' in dong_name:
            continue

        if height <= 0:
            height = max(flr * 3.0, 9.0) if flr > 0 else 15.0
        if flr <= 0:
            flr = max(int(height / 3.0), 3)

        # Needle-tower protection for small auxiliary structures (25~65 sqm or narrow span < 6.5m)
        minx, miny, maxx, maxy = geom.bounds
        min_span = min(maxx - minx, maxy - miny)
        is_small_aux = (geom.area < 65.0 or min_span < 6.5)

        lines = []
        piloti = False
        is_res_bld = (not is_aux_name(dong_name)) and (not is_small_aux) and (flr >= 3 or (p_dong is not None and p_dong.get('is_res', False) and flr >= 2))

        if is_small_aux and flr > 2:
            flr = 2
            height = min(height, 6.0)
            is_res_bld = False
        elif j_dong and not is_small_aux:
            for l_no, l_data in sorted(j_dong['line_floors'].items()):
                lines.append({
                    'line': l_no,
                    'floorMin': l_data['floorMin'],
                    'floorMax': l_data['floorMax'],
                    'count': l_data['count']
                })
            piloti = (j_dong['min_floor'] > 1)

        if is_res_bld:
            res_built_count += 1

        max_height = max(max_height, height)

        bld_hh = sum(l['count'] for l in lines) if lines else (p_dong['hh'] if p_dong else 0)
        bld_entry = {
            'id': f"bd_{cpx['code']}_{len(buildings)+1}",
            'dong': dong_name,
            'name': f"{cpx['name']} {dong_name}",
            'usage': '공동주택' if is_res_bld else '부속시설',
            'residential': is_res_bld,
            'households': bld_hh,
            'floors': flr,
            'floorsBelow': p_dong['ugrnd_flr'] if p_dong else 1,
            'heightM': round(height, 2),
            'approvalDate': p_dong['use_apr'] if p_dong else '',
            'piloti': piloti,
            'lines': lines,
            'units': j_dong['units'] if (j_dong and not is_small_aux) else [],
            'hardware': {
                'elevPass': p_dong['elev_pass'] if p_dong else 0,
                'elevEmerg': p_dong['elev_emerg'] if p_dong else 0,
                'parkSelf': p_dong['park_self'] if p_dong else 0,
                'structure': p_dong['struct'] if p_dong else '철근콘크리트구조'
            },
            'rings': rings,
            'kind': 'primary',
            'selectable': is_res_bld,
            'label': dong_name
        }
        total_households += bld_hh
        buildings.append(bld_entry)

    # Safety Abort: if Pyoje expects >= 2 residential buildings but 0 were genuinely matched
    if len(pyoje_res_dongs) >= 2 and res_built_count == 0:
        return None

    # Stage 5: Separate surrounding buildings into neighbors[] (max 80 within 220m)
    neighbors = []
    nbr_cands = []
    for idx, row in matched_gdf.iterrows():
        if idx in selected_indices:
            continue
        geom = row.geometry
        if geom is None or geom.is_empty or geom.area < 80.0:
            continue
        nearby_building_text = ' '.join(str(row.get(field) or '') for field in ('A9', 'A24', 'A25'))
        if '아파트' in nearby_building_text or '공동주택' in nearby_building_text:
            continue
        gc = geom.centroid
        dist = math.hypot(gc.x - cx, gc.y - cy)
        if dist <= 220.0:
            nbr_cands.append((dist, idx, row))
    nbr_cands.sort(key=lambda x: x[0])
    for _, idx, row in nbr_cands[:80]:
        rings = _geom_to_rings(row.geometry)
        if not rings:
            continue
        try:
            n_flr = int(float(row['A26'])) if row['A26'] is not None and not pd.isna(row['A26']) else 3
        except Exception:
            n_flr = 3
        n_flr = max(1, n_flr)
        try:
            n_h = float(row['A16']) if row['A16'] is not None and not pd.isna(row['A16']) else 0.0
        except Exception:
            n_h = 0.0
        if n_h <= 0:
            n_h = n_flr * 3.0
        neighbors.append({
            'id': f"nb_{cpx['code']}_{len(neighbors)+1}",
            'dong': str(row.get('A25') or row.get('A24') or ''),
            'floors': n_flr,
            'heightM': round(n_h, 2),
            'rings': rings,
            'kind': 'neighbor',
            'selectable': False
        })

    # Build complex-level hardware specs
    specs = {
        'totalDongCount': res_built_count or len(buildings),
        'totalHouseholds': total_households or cpx['households'],
        'maxHeightM': round(max_height, 2),
        'maxFloors': max((b['floors'] for b in buildings), default=0),
        'avgFloorHeightM': round(max_height / max((b['floors'] for b in buildings), default=1), 2),
        'structure': next(iter(structures), '철근콘크리트구조'),
        'useApprovalDate': next(iter(use_approval_dates), ''),
        'parking': {
            'totalSelf': total_park_self,
            'perHousehold': round(total_park_self / (total_households or 1), 2) if total_park_self > 0 else None
        },
        'elevators': {
            'passenger': total_elev_pass,
            'emergency': total_elev_emerg,
            'householdsPerElevator': round(total_households / total_elev_pass, 1) if total_elev_pass > 0 else None
        }
    }
    
    return {
        'searchCode': str(cpx['code']),
        'name': cpx['name'],
        'lawAddr': cpx['addr'],
        'center': {'lat': float(cpx['y']), 'lng': float(cpx['x'])},
        'specs': specs,
        'buildings': buildings,
        'neighbors': neighbors,
        'floorBands': [5, 10, 15, 20, 25, 30],
        'coverage': {
            'primaryCount': len(buildings),
            'residentialCount': res_built_count,
            'steppedCount': sum(1 for b in buildings if len(b['lines']) > 1)
        },
        'source': source_label
    }

def process_sido(sido_code, limit=None, overwrite=False, pre_ledgers=None, failed_list=None):
    """Process all complexes in a given Sido."""
    sido_name = SIDO_MAP.get(sido_code, sido_code)
    print(f"\n==========================================")
    print(f"[*] Processing Sido: {sido_code} ({sido_name})")
    print(f"==========================================")
    
    # 1. Load target complexes for this sido
    complexes = load_all_target_complexes(filter_sido=sido_code)
    cpx_list = list(complexes.values())
    if limit:
        cpx_list = cpx_list[:limit]
    print(f"Found {len(cpx_list)} complexes in {sido_name}")
    if not cpx_list:
        return 0, 0
        
    # 2. Find matching SHP files for this sido
    shp_pattern = os.path.join(GIS_DIR, f"AL_D010_{sido_code}_*\\*.shp")
    shp_files = glob.glob(shp_pattern)
    if not shp_files:
        # Check direct
        shp_pattern = os.path.join(GIS_DIR, f"AL_D010_{sido_code}_*.shp")
        shp_files = glob.glob(shp_pattern)
        
    if not shp_files:
        print(f"No SHP files found for Sido {sido_code} in {GIS_DIR}")
        if failed_list is not None:
            failed_list.extend(cpx_list)
        return 0, len(cpx_list)
        
    print(f"Loading {len(shp_files)} SHP files for {sido_name}...")
    t0 = time.time()
    gdfs = []
    for s in shp_files:
        try:
            # Load residential/apartment buildings
            gdf = gpd.read_file(s, encoding='cp949')
            # Ensure spatial index
            _ = gdf.sindex
            gdfs.append(gdf)
        except Exception as e:
            print(f"Error loading {s}: {e}")
            
    if not gdfs:
        if failed_list is not None:
            failed_list.extend(cpx_list)
        return 0, len(cpx_list)
        
    import pandas as pd
    combined_gdf = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs=gdfs[0].crs)
    print(f"Combined {len(combined_gdf):,} features in {time.time()-t0:.2f}s")
    
    # 3. Scan Pyoje & Jeonyu (reuse nationwide pre-scanned dict if provided)
    if pre_ledgers is not None:
        pyoje_data, jeonyu_data = pre_ledgers
    else:
        pyoje_data, jeonyu_data = scan_ledgers_for_complexes(cpx_list)
    
    # 4. Generate JSON for each complex
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    root_dir = os.path.join(REPO_ROOT, "data", "3d")
    os.makedirs(root_dir, exist_ok=True)
    success_cnt = 0
    skip_cnt = 0
    fail_cnt = 0
    
    t0 = time.time()
    for idx, cpx in enumerate(cpx_list):
        out_file = os.path.join(OUTPUT_DIR, f"{cpx['code']}.json")
        root_out = os.path.join(root_dir, f"{cpx['code']}.json")
        if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            if not overwrite:
                skip_cnt += 1
                continue
            # overwrite mode: skip ONLY official completed v2 data; never preserve legacy v1 or unofficial cx_ data
            try:
                with open(out_file, 'r', encoding='utf-8') as fp:
                    existing_txt = fp.read()
                if ('"korea_gis_ledger_fused_v2"' in existing_txt or
                    '"vworld_ledger_fused_v2"' in existing_txt or
                    '"vworld_ledger_pure_v2"' in existing_txt):
                    if not os.path.exists(root_out) or os.path.getsize(root_out) != os.path.getsize(out_file):
                        with open(root_out, 'wb') as wp:
                            wp.write(existing_txt.encode('utf-8'))
                    skip_cnt += 1
                    continue
            except Exception:
                pass
            
        try:
            data = build_complex_json(cpx, combined_gdf, pyoje_data, jeonyu_data)
        except Exception as e:
            data = None
        if data and len(data['buildings']) > 0:
            compact_txt = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
            with open(out_file, 'w', encoding='utf-8') as fp:
                fp.write(compact_txt)
            with open(root_out, 'w', encoding='utf-8') as fp:
                fp.write(compact_txt)
            success_cnt += 1
        else:
            fail_cnt += 1
            if failed_list is not None:
                failed_list.append(cpx)
            
        if (idx + 1) % 100 == 0 or (idx + 1) == len(cpx_list):
            print(f"Progress [{sido_name}]: {idx+1}/{len(cpx_list)} | Success: {success_cnt} | Skipped: {skip_cnt} | Failed: {fail_cnt}")
            
    print(f"Finished {sido_name} in {time.time()-t0:.2f}s: {success_cnt} created, {skip_cnt} skipped, {fail_cnt} failed")
    return success_cnt, fail_cnt

def main():
    parser = argparse.ArgumentParser(description="Build rich 3D complex data from nationwide GIS & ledgers")
    parser.add_argument('--sido', default='11', help="Sido code (e.g. 11 for Seoul, 41 for Gyeonggi, or 'all')")
    parser.add_argument('--limit', type=int, default=None, help="Limit number of complexes per Sido for testing")
    parser.add_argument('--overwrite', action='store_true', help="Overwrite existing 3D json files")
    parser.add_argument('--upload', action='store_true', help="Automatically upload to Cloudflare R2 after building")
    parser.add_argument('--include-apartment-neighbors', action='store_true', help="Add apartment complex references within 500m of each complex footprint")
    parser.add_argument('--apartment-neighbor-distance', type=float, default=500.0, help="Maximum footprint-to-footprint apartment distance in meters")
    parser.add_argument('--failed-out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vworld_fallback_targets.json'), help="Output JSON manifest for SHP-failed complexes needing VWorld fallback")
    args = parser.parse_args()
    
    print(f"=== Starting RealRankus Nationwide 3D Generator ===")
    print(f"Output Directory: {OUTPUT_DIR}")
    
    if args.sido == 'all':
        sido_list = ['11', '41', '28', '26', '27', '12', '30', '31', '36', '43', '44', '47', '48', '50', '51', '52']
    else:
        sido_list = [args.sido]

    # Pre-scan ledgers ONCE for all target complexes when processing multiple Sidos
    pre_ledgers = None
    if len(sido_list) > 1:
        all_targets = []
        for s in sido_list:
            c_map = load_all_target_complexes(filter_sido=s)
            c_vals = list(c_map.values())
            if args.limit:
                c_vals = c_vals[:args.limit]
            all_targets.extend(c_vals)
        print(f"[*] Pre-scanning Pyoje/Jeonyu ONCE across {len(all_targets):,} nationwide complexes...")
        pre_ledgers = scan_ledgers_for_complexes(all_targets)
        
    total_success = 0
    total_fail = 0
    failed_targets = []
    for s in sido_list:
        succ, fail = process_sido(s, limit=args.limit, overwrite=args.overwrite, pre_ledgers=pre_ledgers, failed_list=failed_targets)
        total_success += succ
        total_fail += fail
        
    print(f"\n==========================================")
    print(f"Total 3D generation complete: {total_success} generated, {total_fail} failed")
    if args.failed_out:
        with open(args.failed_out, 'w', encoding='utf-8') as fp:
            json.dump(failed_targets, fp, ensure_ascii=False)
        print(f"Saved {len(failed_targets)} fallback targets to: {args.failed_out}")
    print(f"==========================================")

    if args.include_apartment_neighbors:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if script_dir not in sys.path:
            sys.path.insert(0, script_dir)
        from enrich_apartment_neighbors import enrich_apartment_neighbors
        enrich_apartment_neighbors(
            OUTPUT_DIR,
            os.path.join(REPO_ROOT, 'data', '3d'),
            max_distance_m=args.apartment_neighbor_distance,
        )
    
    if args.upload:
        print("\n[*] Triggering Cloudflare R2 Synchronization...")
        sync_script = os.path.join(REPO_ROOT, "complex3d", "scripts", "sync_3d_to_r2.py")
        if os.path.exists(sync_script):
            os.system(f"{sys.executable} {sync_script}")
        else:
            print(f"Sync script not found: {sync_script}")

if __name__ == '__main__':
    main()
