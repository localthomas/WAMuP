/**
 * This function, when called via `await`, yields back to the main thread and unblocks it.
 *
 * Example:
 * ```
 * // take a break: yield back to the main thread via setTimeout
 * await new yieldBackToMainThread();
 * ```
 *
 * Note that this is a function using global state: it may or may not yield depending on outside factors.
 */
export async function yieldBackToMainThread() {
    // note: only yield, if the last yield was about 16ms in the past
    // 16ms is approximately 60 Hz
    const currentTimestamp = performance.now();
    if (currentTimestamp - lastTimestamp > 16) {
        await new Promise(resolve => setTimeout(resolve));
        lastTimestamp = currentTimestamp;
    }
}
let lastTimestamp = performance.now();
