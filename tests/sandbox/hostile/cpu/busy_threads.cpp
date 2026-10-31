// Hostile Fixture: Multi-threaded CPU burn
// Expected Verdict: TLE
#include <thread>
#include <vector>

void burn() {
    volatile int x = 0;
    while (1) { x++; }
}

int main() {
    std::vector<std::thread> threads;
    for (int i = 0; i < 8; i++) {
        threads.emplace_back(burn);
    }
    for (auto& t : threads) {
        t.join();
    }
    return 0;
}
