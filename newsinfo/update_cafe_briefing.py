# -*- coding: utf-8 -*-
"""
네이버 카페(리얼랭커스 브리핑 메뉴: 271)의 최신 게시글 30개를 수집하여
ad/1000000000_Korea_ad.json 파일로 저장하는 스크립트.
"""

import os
import sys
import json
import re
import urllib.request

CAFE_ID = 30742774
MENU_ID = 271
PAGE_SIZE = 30

BASE_SCHEMA = {
    "fields": [
        {"name": "index", "type": "string"},
        {"name": "request_type", "type": "string"},
        {"name": "shop_name", "type": "string"},
        {"name": "owner", "type": "string"},
        {"name": "main_title", "type": "string"},
        {"name": "sub_title", "type": "string"},
        {"name": "cellphone", "type": "string"},
        {"name": "phone", "type": "string"},
        {"name": "start_date", "type": "string"},
        {"name": "end_date", "type": "string"},
        {"name": "duration", "type": "string"},
        {"name": "address", "type": "string"},
        {"name": "email", "type": "string"},
        {"name": "icon", "type": "string"},
        {"name": "comment", "type": "string"},
        {"name": "y", "type": "string"},
        {"name": "x", "type": "string"},
        {"name": "homepage", "type": "string"},
        {"name": "map_url", "type": "string"}
    ],
    "primaryKey": ["index"],
    "pandas_version": "1.4.0"
}


def parse_subject(subject_text):
    """
    게시글 제목에서 날짜(sub_title)와 본문 제목(main_title)을 분리합니다.
    예: "[2026년 10월 18일 브리핑] 다음 세계경제의 위기는..."
        "2026년 8월 10일 브리핑 - 돈은 막는다고..."
    """
    clean_subj = subject_text.strip()
    match = re.match(r"^\[?([^\]\-]+브리핑)\]?\s*[\-:]?\s*(.*)$", clean_subj)
    if match:
        sub_title = match.group(1).strip()
        main_title = match.group(2).strip()
        if not main_title:
            main_title = clean_subj
    else:
        sub_title = "리얼랭커스 브리핑"
        main_title = clean_subj

    return sub_title, main_title


def update_korea_ad():
    api_url = f"https://apis.naver.com/cafe-web/cafe-boardlist-api/v1/cafes/{CAFE_ID}/menus/{MENU_ID}/articles?page=1&pageSize={PAGE_SIZE}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": f"https://cafe.naver.com/f-e/cafes/{CAFE_ID}/menus/{MENU_ID}"
    }

    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"[Error] Failed to fetch cafe articles: {e}", file=sys.stderr)
        return False

    article_list = payload.get("result", {}).get("articleList", [])
    if not article_list:
        print("[Warning] No articles returned from cafe API.", file=sys.stderr)
        return False

    data_items = []
    idx = 1
    for entry in article_list:
        item = entry.get("item", {})
        article_id = item.get("articleId")
        raw_subject = item.get("subject", "").strip()

        if not article_id or not raw_subject:
            continue

        sub_title, main_title = parse_subject(raw_subject)
        homepage_url = f"https://cafe.naver.com/aptrankkr/{article_id}"

        ad_record = {
            "index": idx,
            "request_type": "Direct",
            "shop_name": "리얼랭커스",
            "owner": "리얼랭커스",
            "main_title": main_title,
            "sub_title": sub_title,
            "sub_comment": "리얼랭커스 브리핑",
            "cellphone": "1012345678",
            "phone": "1012345678",
            "start_date": "2023-02-05",
            "end_date": "2099-12-31",
            "duration": 365,
            "address": "",
            "email": "aptranking@gmail.com",
            "icon": "icon_apt_rank.png",
            "comment": "",
            "y": 127.0977807,
            "x": 37.8365406,
            "homepage": homepage_url,
            "map_url": ""
        }
        data_items.append(ad_record)
        idx += 1

    output_data = {
        "schema": BASE_SCHEMA,
        "data": data_items
    }

    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, ".."))
    target_path = os.path.join(repo_root, "ad", "1000000000_Korea_ad.json")

    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"[Success] Updated {len(data_items)} articles to {target_path}")
    return True


if __name__ == "__main__":
    update_korea_ad()

