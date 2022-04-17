import { ItemWithIndex } from "../miscellaneous/parallel";

const worker: Worker = self as any;

/**
 * Registers a function from a `*.worker.ts` file as a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).
 * Only useful in conjunction with the `runMultipleWorkers` function in the module `miscellaneous/parallel.ts`.
 *
 * The function is called within a WebWorker and probably multiple times.
 * The function should not access anything other than the APIs available in WebWorkers.
 * @param func the function to execute
 */
export function registerParallelWorkerFunction<T, S>(func: (input: T) => S): void {
    // note: the worker should post messages of type ItemWithIndex
    // this is a typed function for easier checking
    const postMessage = function (message: ItemWithIndex<S>): void {
        worker.postMessage(message);
    };

    worker.addEventListener('message', async (message) => {
        // note that there is no proper type checking!
        const input = message.data as ItemWithIndex<T>;

        // call the worker function and post the result as message
        const result = await func(input.item);

        postMessage({
            item: result,
            index: input.index,
        });
    });
}