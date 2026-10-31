// Hostile Fixture: Node.js V8 Heap exhaustion
// Expected Verdict: MLE / RE
const arrays = [];
while (true) {
  arrays.push(new Uint8Array(10 * 1024 * 1024));
}
