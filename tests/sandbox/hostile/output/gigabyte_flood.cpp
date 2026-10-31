// Hostile Fixture: Flood gigabytes of text to stdout
// Expected Verdict: OLE (Output Limit Exceeded)
#include <iostream>

int main() {
    // Generate endless stream
    for (int i = 0; i < 5000000; i++) {
        std::cout << "GIGABYTE_OUTPUT_FLOOD_ATTACK_STRING_BURST_0123456789ABCDEF\n";
    }
    return 0;
}
