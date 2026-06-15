# backend/wiping-engine/test_wiper.py
import os
import tempfile
from pathlib import Path

# Create test files
test_dir = Path("test_files")
test_dir.mkdir(exist_ok=True)

# Create some test files
for i in range(3):
    test_file = test_dir / f"test_file_{i}.txt"
    with open(test_file, 'w') as f:
        f.write(f"This is test file {i}\n" * 100)

print("Created test files:")
for file in test_dir.glob("*.txt"):
    print(f"  - {file} ({file.stat().st_size} bytes)")

print("\nTo test wiping, run:")
print(f"python secure_wiper.py --files {' '.join(str(f) for f in test_dir.glob('*.txt'))} --security-level standard")