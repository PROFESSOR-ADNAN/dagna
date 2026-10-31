# Hostile Fixture: Sleep to stall wall-clock time
# Expected Verdict: TLE (enforced by supervisor monotonic wall clock)
import time

time.sleep(30)
print("Finished sleeping")
