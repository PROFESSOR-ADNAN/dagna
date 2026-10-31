# Hostile Fixture: Sensitive filesystem read attempts
# Expected Verdict: RE (PermissionError or FileNotFoundError)
import sys

sensitive_paths = [
    '/etc/shadow',
    '/root/.ssh/id_rsa',
    '/proc/kcore',
    '/sys/kernel/debug'
]

for p in sensitive_paths:
    try:
        with open(p, 'rb') as f:
            data = f.read(100)
            if data:
                print(f"SECURITY BREACH: Read {p}")
                sys.exit(0)
    except Exception:
        pass

# If no file could be read, exit cleanly with 1 to indicate denial
sys.exit(1)
