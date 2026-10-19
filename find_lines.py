import re

korean_re = re.compile('[가-힣]')
tsafe_re = re.compile(r'tSafe\([^)]*\)')

with open('js/board.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        trimmed = line.strip()
        if trimmed.startswith('//') or trimmed.startswith('/*') or trimmed.endswith('*/'):
            continue
        # Strip comments at the end of line
        code_part = line.split('//')[0].strip()
        if not korean_re.search(code_part):
            continue
            
        # Check if Korean is outside tSafe
        # We can find all occurrences of Korean, and check if they are part of a tSafe(...) call
        # A simple check: if we remove all tSafe(...) calls, is there still Korean?
        cleaned = tsafe_re.sub('', code_part)
        if korean_re.search(cleaned):
            print(f"{i}: {trimmed}")
