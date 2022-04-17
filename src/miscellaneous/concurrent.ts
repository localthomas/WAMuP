/**
 * Runs a single WebWorker and wraps this in an async function.
 *
 * The item needs to able to be a [transferable object](https://developer.mozilla.org/en-US/docs/Glossary/Transferable_objects),
 * as it is transferred to the worker and transferred back to the main thread after completion.
 *
 * Note that no type-checking is taking place, so the type parameters `T` and `S` are only for readability.
 * @param item the payload
 * @param scriptURL the URL for loading the WebWorker script
 * @returns the results of all workers
 */
export async function runSingleWorker<T, S>(item: T, scriptURL: URL): Promise<S> {
    const worker = new Worker(
        scriptURL,
        // Note: do not use type: "module", as it removes the variable "global"
        // that is required by some dependencies that only run on nodejs
        // see https://github.com/parcel-bundler/parcel/issues/6790
        //{ type: "module" }
    );

    let result: S;

    // create a new Promise that resolves until the worker has finished its job and
    // its result were set to the result variable
    const promise: Promise<S> = new Promise((resolve) => {
        // register a listener on all workers
        worker.onmessage = (message) => {
            // note that there is no proper type checking!
            const data = message.data as S;
            result = data;

            worker.terminate();
            resolve(result);
        }
    });

    // start work by posting the item to the worker
    worker.postMessage(item, [(item as unknown) as Transferable]);

    return promise;
}
