// Hostile Fixture: Infinite fork bomb
// Expected Verdict: RE or TLE, contained by pids.max
#include <unistd.h>

int main() {
    while (1) {
        fork();
    }
    return 0;
}
