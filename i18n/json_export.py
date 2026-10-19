#!/usr/bin/env python3
import os
import json
import csv

def unflatten_dict(d, sep='.'):
    """Unflattens a flat dictionary with dot-notation keys back into a nested structure."""
    result = {}
    for key, value in d.items():
        parts = key.split(sep)
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            elif not isinstance(current[part], dict):
                current[part] = {}
            current = current[part]
        
        last_part = parts[-1]
        current[last_part] = value
    
    # Recursively convert dictionary objects with consecutive numeric keys into lists
    def dict_to_lists(item):
        if not isinstance(item, dict):
            return item
        
        # Recursively process children
        for k, v in item.items():
            item[k] = dict_to_lists(v)
            
        # Check if keys are all numeric digits and represent a consecutive range 0..N-1
        keys = list(item.keys())
        if keys and all(k.isdigit() for k in keys):
            int_keys = [int(k) for k in keys]
            if sorted(int_keys) == list(range(len(int_keys))):
                sorted_items = sorted(item.items(), key=lambda x: int(x[0]))
                return [val for _, val in sorted_items]
                
        return item

    return dict_to_lists(result)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'translations.csv')
    
    if not os.path.isfile(csv_path):
        print(f"Error: CSV file not found: {csv_path}")
        return
        
    lang_dicts = {}
    
    print(f"Reading {csv_path}...")
    row_idx = 1
    try:
        # Use utf-8-sig to read UTF-8 with BOM
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers or len(headers) < 2:
                print("Error: Invalid CSV format or empty file.")
                return
            
            languages = headers[1:]
            for lang in languages:
                lang_dicts[lang] = {}
                
            for row_idx, row in enumerate(reader, start=2):
                if not row or len(row) < 1:
                    continue
                
                key = row[0].strip()
                if not key:
                    continue
                
                for i, lang in enumerate(languages):
                    if (i + 1) < len(row):
                        val = row[i + 1]
                    else:
                        val = ""
                        
                    if val == '""':
                        lang_dicts[lang][key] = ""  # Explicit empty string
                    elif val == "":
                        # Leave it out of this language's dictionary (omitted)
                        pass
                    else:
                        lang_dicts[lang][key] = val
    except Exception as e:
        print(f"Error reading CSV file at row {row_idx}: {e}")
        return

    # Unflatten and write JSON files
    for lang, flat_dict in lang_dicts.items():
        unflat = unflatten_dict(flat_dict)
        output_file = os.path.join(script_dir, f"{lang}.json")
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(unflat, f, indent=2, ensure_ascii=False)
                f.write('\n')
            print(f"Successfully generated: {output_file}")
        except Exception as e:
            print(f"Error writing to JSON file {output_file}: {e}")

if __name__ == '__main__':
    main()
