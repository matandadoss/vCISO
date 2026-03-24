import sys

with open('backend/scripts/seed_demo_data.py', 'r') as f:
    lines = f.readlines()

for i in range(24, 154):
    lines[i] = "    " + lines[i]

with open('backend/scripts/seed_demo_data.py', 'w') as f:
    f.writelines(lines)
