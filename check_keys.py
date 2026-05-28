import json
import re
import os

with open('i18n/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

ui_root = en_data.get('ui', {})

def get_nested_val(d, path_str):
    parts = path_str.split('.')
    if parts[0] == 'ui':
        parts = parts[1:]
    val = d
    for p in parts:
        if isinstance(val, dict) and p in val:
            val = val[p]
        else:
            return None
    return val

files_to_check = [
    'js/app_main_lang.js',
    'js/doubleSlider.js',
    'js/request_report.js',
    'js/share.js'
]

for filepath in files_to_check:
    print(f"=== Checking {filepath} ===")
    if not os.path.exists(filepath):
        print("File does not exist")
        continue
        
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    matches = sorted(list(set(re.findall(r"tSafe\((['\"])(ui\..*?)\1", content))))
    if not matches:
        print("No tSafe keys found matching 'ui.' pattern.")
        continue

    mismatches = 0
    warnings = 0
    
    for quote, full_key in matches:
        val = get_nested_val(ui_root, full_key)
        if val is None:
            # If not found, check if prepending 'report.' or 'menu.' makes it exist
            test_report_key = full_key.replace('ui.', 'ui.report.')
            val_report = get_nested_val(ui_root, test_report_key)
            
            test_menu_key = full_key.replace('ui.', 'ui.menu.')
            val_menu = get_nested_val(ui_root, test_menu_key)
            
            if val_report is not None:
                print(f"  MISMATCH: '{full_key}' -> should be '{test_report_key}'")
                mismatches += 1
            elif val_menu is not None:
                print(f"  MISMATCH: '{full_key}' -> should be '{test_menu_key}'")
                mismatches += 1
            else:
                print(f"  WARNING: '{full_key}' is NOT found in en.json at all!")
                warnings += 1
                
    print(f"File {filepath} summary: {mismatches} mismatches, {warnings} warnings.")
