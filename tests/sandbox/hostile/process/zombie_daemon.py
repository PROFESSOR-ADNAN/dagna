# Hostile Fixture: Daemonizing double-fork to leave zombie background process
# Expected Verdict: Contained, zero leaked PIDs after hygiene check
import os
import sys
import time

try:
    pid = os.fork()
    if pid > 0:
        # Parent exits immediately
        sys.exit(0)
    
    # Decouple from parent
    os.setsid()
    
    # Background child tries to linger
    time.sleep(60)
except Exception:
    sys.exit(1)
