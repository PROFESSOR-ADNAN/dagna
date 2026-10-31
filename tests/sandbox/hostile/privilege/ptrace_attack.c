// Hostile Fixture: Syscall privilege tampering attempt (ptrace / unshare)
// Expected Verdict: RE (Operation not permitted / EPERM)
#include <sys/ptrace.h>
#include <unistd.h>
#include <stdlib.h>

int main() {
    // Attempt to trace process or intercept syscalls
    if (ptrace(PTRACE_TRACEME, 0, NULL, NULL) == -1) {
        // Blocked as expected
        return 1;
    }
    return 0;
}
