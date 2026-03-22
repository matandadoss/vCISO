import os
import glob

directory = 'c:/Users/matan/iCloudDrive/vCISO/frontend/src'
old_string = '$process.env.NEXT_PUBLIC_API_URL'
new_string = '${process.env.NEXT_PUBLIC_API_URL}'

count = 0
for root, _, files in os.walk(directory):
    for f in files:
        if f.endswith('.ts') or f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            if old_string in content:
                new_content = content.replace(old_string, new_string)
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Updated {path}")
                count += 1
print(f"Total files updated: {count}")
