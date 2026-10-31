// Hostile Fixture: Stack overflow segmentation fault
// Expected Verdict: RE
#include <stdio.h>

void bar(int depth);

void foo(int depth) {
    volatile char buf[4096];
    buf[0] = (char)depth;
    bar(depth + 1);
    printf("%c", buf[0]);
}

void bar(int depth) {
    volatile char buf[4096];
    buf[0] = (char)depth;
    foo(depth + 1);
    printf("%c", buf[0]);
}

int main() {
    foo(1);
    return 0;
}
