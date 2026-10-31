// Hostile Fixture: CPU Infinite Loop
// Expected Verdict: TLE
int main() {
    volatile int x = 0;
    while (1) {
        x++;
    }
    return 0;
}
