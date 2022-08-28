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

/**
 * An extended async generator with an additional method for getting the number of elements the generator will produce.
 */
export type AsyncGeneratorFixedLength<T = unknown, TReturn = any, TNext = unknown> = {
    [Symbol.asyncIterator](): AsyncGenerator<T, TReturn, TNext>;
    getNumberOfTotalElements(): number;
};

/**
 * An async array stores data similar to a normal array, but each element in the array is handled with a `Promise`.
 * This allows the array to be used with async functions for retrieving elements.
 *
 * Note that this array is readonly, i.e. no elements can be changed, removed or added to the array after creation.
 */
export class AsyncArray<T> {
    private backingArray: Promise<T>[];
    private resolveArray: ((value: T) => void)[];

    /**
     * Converts an async generator into an asynchronous array.
     * Note that the generator is fully consumed and therefore can not be used afterwards.
     * @param input the generator to consume
     */
    constructor(input: AsyncGeneratorFixedLength<T>) {
        this.resolveArray = Array(input.getNumberOfTotalElements());
        this.backingArray = Array(input.getNumberOfTotalElements());

        // create promises for all elements in the array
        for (let i = 0; i < this.backingArray.length; i++) {
            this.backingArray[i] = new Promise(resolve => {
                this.resolveArray[i] = resolve;
            });
        }

        // start a concurrent function to fill the backing array
        setTimeout(async () => {
            let i = 0;
            for await (const value of input) {
                this.resolveArray[i](value);
                i++;

                // do not block main thread with a long lasting loop
                //await yieldBackToMainThread();
            }
        });
    }

    /**
     * Returns the length of the array in its final state.
     * This means the length will not change after creation and includes unfinished `Promise`s.
     * @returns the length of the array
     */
    public getLength(): number {
        return this.backingArray.length;
    }

    /**
     * Create an async iterator for a JavaScript for-await-of loop.
     * @returns an iterator for a `for await (const _ of _.iter())` loop
     */
    public iter(): AsyncIterable<T> {
        const backingArray = this.backingArray;
        return {
            [Symbol.asyncIterator]() {
                let i = 0;
                return {
                    async next() {
                        const done = i >= backingArray.length - 1 ? true : false;
                        const value = await backingArray[Math.min(i, backingArray.length - 1)];
                        i++;
                        return { value, done };
                    }
                };
            }
        };
    }
}

/**
 * Consume an async generator and provide the result as a normal array.
 * This array changes, so the "return value" is a callback instead.
 * @param generator the generator to consume; do not use afterwards
 * @param emptyValue the value used in the list for empty elements for which the generator has not yet generated values for
 * @param onChange called multiple times, when the array changed due to newly generated values
 */
export async function asyncGeneratorToArray<T>(generator: AsyncGeneratorFixedLength<T>, emptyValue: T, onChange: (newList: T[]) => void) {
    // note: the generator produces more values that need to be converted into a list asynchronously
    let tempList: T[] = Array(generator.getNumberOfTotalElements()).fill(emptyValue);
    let i = 0;
    for await (const value of generator) {
        tempList[i] = value;
        i++;
        onChange(tempList);
    }
}
