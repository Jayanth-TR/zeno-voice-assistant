import os

def scan_files(root_dir):
    for root, dirs, files in os.walk(root_dir):
        if any(ignored in root for ignored in ['.venv', 'node_modules', '__pycache__', '.git', 'dist']):
            continue
        for f in files:
            p = os.path.join(root, f)
            print(p)

print("=== BACKEND FILES ===")
scan_files("backend")
print("=== ROOT & DATA FILES ===")
scan_files(".")
