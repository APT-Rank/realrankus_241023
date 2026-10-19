#!/usr/bin/env python3
import os
import sys
from convert_i18n import import_csv_to_json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, 'i18n', 'translations.csv')
I18N_DIR = os.path.join(SCRIPT_DIR, 'i18n')

def main():
    print(f"CSV 파일({CSV_PATH})을 읽어서 JSON 번역 파일로 변환합니다...")
    success = import_csv_to_json(CSV_PATH, I18N_DIR)
    if success:
        print("변환이 성공적으로 완료되었습니다!")
        sys.exit(0)
    else:
        print("변환에 실패했습니다. 위의 오류 메세지를 확인해 주세요.")
        sys.exit(1)

if __name__ == '__main__':
    main()
