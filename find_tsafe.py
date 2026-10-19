import os
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.gemini' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    if 'const tSafe' in line or 'let tSafe' in line or 'function tSafe' in line or 'var tSafe' in line:
                        print(f"{path}:{i}: {line.strip()}")
