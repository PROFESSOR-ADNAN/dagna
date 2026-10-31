# Hostile Fixture: Attempt to contact AWS/Cloud metadata service or WireGuard tunnel
# Expected Verdict: RE (Connection failure / Network unreachable)
import socket
import sys

targets = [
    ('169.254.169.254', 80),   # Cloud metadata
    ('10.100.0.1', 4001),       # Core host private tunnel
]

for host, port in targets:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.1)
        s.connect((host, port))
        print(f"SECURITY BREACH: Connected to {host}:{port}")
        sys.exit(0)
    except Exception:
        pass

# Network calls failed as required
sys.exit(1)
