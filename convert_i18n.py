#!/usr/bin/env python3
import os
import json
import csv
import argparse
import sys

def flatten_dict(d, parent_key='', sep='.'):
    """Recursively flattens a nested dictionary into dot-notation keys."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            for i, elem in enumerate(v):
                items.append((f"{new_key}.{i}", elem))
        else:
            items.append((new_key, v))
    return dict(items)

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

def export_json_to_csv(i18n_dir, csv_path):
    """Reads all JSON files in i18n_dir, flattens them, and merges them into one CSV."""
    if not os.path.isdir(i18n_dir):
        print(f"Error: Directory not found: {i18n_dir}")
        return False

    # Find all JSON files in the i18n directory
    json_files = [f for f in os.listdir(i18n_dir) if f.endswith('.json')]
    if not json_files:
        print(f"No JSON files found in {i18n_dir}")
        return False

    # Keep ko.json or the first file's key order
    if 'ko.json' in json_files:
        json_files.remove('ko.json')
        json_files.insert(0, 'ko.json')
    elif 'en.json' in json_files:
        json_files.remove('en.json')
        json_files.insert(0, 'en.json')

    print(f"Scanning JSON files in {i18n_dir}: {json_files}")

    lang_data = {}
    ordered_keys = []
    seen_keys = set()

    for filename in json_files:
        lang = os.path.splitext(filename)[0]
        file_path = os.path.join(i18n_dir, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            flat = flatten_dict(data)
            lang_data[lang] = flat
            
            # Maintain insertion order of keys
            for k in flat.keys():
                if k not in seen_keys:
                    seen_keys.add(k)
                    ordered_keys.append(k)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            return False

    languages = list(lang_data.keys())
    headers = ['key'] + languages

    try:
        with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            
            for key in ordered_keys:
                row = [key]
                for lang in languages:
                    val = lang_data[lang].get(key, None)
                    if val is None:
                        row.append("")  # Blank cell for missing key
                    elif val == "":
                        row.append('""')  # Literal double quotes for explicit empty string
                    else:
                        row.append(val)
                writer.writerow(row)
        print(f"Successfully exported all translations to: {csv_path}")
        return True
    except Exception as e:
        print(f"Error writing CSV file: {e}")
        return False

def import_csv_to_json(csv_path, i18n_dir):
    """Reads a CSV file and reconstructs/updates the JSON files in i18n_dir."""
    if not os.path.isfile(csv_path):
        print(f"Error: CSV file not found: {csv_path}")
        return False

    os.makedirs(i18n_dir, exist_ok=True)

    lang_dicts = {}
    
    try:
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers or len(headers) < 2:
                print("Error: Invalid CSV format or empty file.")
                return False
            
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
                    val = row[i + 1] if (i + 1) < len(row) else ""
                    if val == '""':
                        lang_dicts[lang][key] = ""  # Explicit empty string
                    elif val == "":
                        # Leave it out of this language's dictionary (omitted)
                        pass
                    else:
                        lang_dicts[lang][key] = val
                        
    except Exception as e:
        print(f"Error reading CSV file at row {row_idx}: {e}")
        return False

    # Unflatten and write JSON files
    for lang, flat_dict in lang_dicts.items():
        unflat = unflatten_dict(flat_dict)
        output_file = os.path.join(i18n_dir, f"{lang}.json")
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(unflat, f, indent=2, ensure_ascii=False)
                f.write('\n')
            print(f"Successfully imported and saved: {output_file}")
        except Exception as e:
            print(f"Error writing to JSON file {output_file}: {e}")
            return False

    return True

def main():
    parser = argparse.ArgumentParser(description="Manage i18n JSON translation files using CSV.")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Export parser
    export_parser = subparsers.add_parser("export", help="Export JSON files to a combined CSV file.")
    export_parser.add_argument("--dir", default="i18n", help="Directory containing JSON files (default: i18n)")
    export_parser.add_argument("--output", default=os.path.join("i18n", "translations.csv"), help="Output CSV file path")

    # Import parser
    import_parser = subparsers.add_parser("import", help="Import a CSV file back to individual JSON files.")
    import_parser.add_argument("--csv", default=os.path.join("i18n", "translations.csv"), help="Source CSV file path")
    import_parser.add_argument("--dir", default="i18n", help="Directory to save JSON files (default: i18n)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "export":
        success = export_json_to_csv(args.dir, args.output)
        sys.exit(0 if success else 1)
    elif args.command == "import":
        success = import_csv_to_json(args.csv, args.dir)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
