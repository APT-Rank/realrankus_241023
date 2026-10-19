import re

filepath = 'js/app_main_lang.js'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Apply the regex substitution
pattern = r"\btSafe\(\s*(['\"])ui\.(?!report\.)"
replacement = r"tSafe(\1ui.report."

new_content, count = re.subn(pattern, replacement, content)
print(f"Made {count} replacements in {filepath}.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
