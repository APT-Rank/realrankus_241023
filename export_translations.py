#!/usr/bin/env python3
import os
import sys
from convert_i18n import export_json_to_csv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, 'i18n', 'translations.csv')
I18N_DIR = os.path.join(SCRIPT_DIR, 'i18n')

def main():
    print(f"JSON 번역 파일을 읽어서 CSV 파일({CSV_PATH})로 통합합니다...")
    success = export_json_to_csv(I18N_DIR, CSV_PATH)
    if success:
        print("CSV 통합이 성공적으로 완료되었습니다!")
        sys.exit(0)
    else:
        print("CSV 통합에 실패했습니다. 위의 오류 메세지를 확인해 주세요.")
        sys.exit(1)

if __name__ == '__main__':
    main()
