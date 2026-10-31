// Hostile Fixture: Single massive memory allocation
// Expected Verdict: MLE or RE (std::bad_alloc)
#include <iostream>
#include <vector>

int main() {
    try {
        // Attempt to allocate 2 GB in a 256 MB sandbox
        std::vector<char> buffer(2ULL * 1024 * 1024 * 1024, 1);
        std::cout << buffer.size() << std::endl;
    } catch (...) {
        return 1; // Maps to RE if unhandled, or terminated by cgroup OOM as MLE
    }
    return 0;
}
