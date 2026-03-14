import os
import sys
import re

directory = r"c:\Users\matan\iCloudDrive\vCISO\frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if ('fetch(' in content and 'http://localhost:8000' in content) and 'fetchWithAuth' not in content:
        # Find where to insert the import
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('"use client"') or line.strip().startswith("'use client'"):
                insert_idx = i + 1
                break
        
        lines.insert(insert_idx, 'import { fetchWithAuth } from "@/lib/api";')
        content = '\n'.join(lines)
        
        # Replace fetch( with fetchWithAuth(
        # We only want to replace fetch that we are actually using. So we'll just replace \bfetch(
        content = re.sub(r'\bfetch\(', 'fetchWithAuth(', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Done.")
