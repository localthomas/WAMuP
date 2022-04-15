/**
 * Progress stores the values of a current process, i.e. how much items were processed and how many items there are in total.
 */
export interface Progress {
    finished: number;
    total: number;
};

export interface ItemWithIndex<T> {
    item: T;
    index: number;
};

/**
 * Runs a list of items on multiple WebWorkers in parallel and returns the result after all workers have finished.
 * The returned list is the same length as `items` and each worker only works on one item.
 * The indices of both lists **do not** correspond to each other, e.g. items[1] might become result[10].
 * The worker should work on one item of type `T` and output another of type `S`.
 *
 * Items need to able to be cloned to be send to the workers.
 *
 * Note that no type-checking is taking place, so the type parameters `T` and `S` are only for readability.
 * @param items the payload is a list of items
 * @param scriptURL the URL for loading the WebWorker script
 * @returns the results of all workers
 */
export async function runMultipleWorkers<T, S>(items: T[], scriptURL: URL, progressCallback: (progress: Progress) => void): Promise<S[]> {
    const numberOfWorkers = window.navigator.hardwareConcurrency;

    // create the workers
    const workers = new Array<Worker>(numberOfWorkers);
    for (let i = 0; i < workers.length; i++) {
        workers[i] = new Worker(
            scriptURL,
            // Note: do not use type: "module", as it removes the variable "global"
            // that is required by some dependencies that only run on nodejs
            // see https://github.com/parcel-bundler/parcel/issues/6790
            //{ type: "module" }
        );
    }

    /**
     * Terminates all created workers. Note: disrupts any current work.
     */
    function terminateWorkers() {
        for (const worker of workers) {
            worker.terminate();
        }
    }

    // create a result array
    const results = new ResultsArray<S>(items.length);

    // transform the initial items list into a working queue
    const workingQueue = new ItemQueue(items);
    /**
     * Pushes an item to a worker from the `workingQueue`.
     * If there are no further items in the queue, nothing happens.
     * @param worker the worker to push the next item to
     */
    function postItemToWorker(worker: Worker) {
        const item = workingQueue.pop();
        if (item) {
            worker.postMessage(item);
        }
    }


    // create a new Promise that resolves until all workers have finished their jobs and
    // their results were set to the result array
    const promise: Promise<S[]> = new Promise((resolve) => {
        // register a listener on all workers
        for (const worker of workers) {
            worker.onmessage = (message) => {
                // note that there is no proper type checking!
                const data = message.data as ItemWithIndex<S>;
                // a worker has finished and provided a result
                // store the result in the results array
                results.setItem(data.index, data.item);
                // update the progress callback
                const progress = {
                    finished: results.getNumberOfSetItems(),
                    total: workingQueue.getInitialSize(),
                };
                progressCallback(progress);

                // check if this "onmessage" is the last of all items and the work is finished
                // or provide new items for work
                if (progress.finished === progress.total) {
                    // all items have been processed
                    // this is the last call to onmessage, so the promise can be resolved
                    terminateWorkers();
                    // all results have been written to the results array
                    resolve(results.getAsList());
                } else {
                    // there is still work to do, so push new work to the worker
                    postItemToWorker(worker);
                }
            }
        };
    });

    // start work by posting to all workers one item
    for (const worker of workers) {
        postItemToWorker(worker);
    }

    return promise;
}

/**
 * Implements a simple list that is initialized with a length and keeps track about the number of items that are set.
 * Note that T can not include the type `undefined`!
 */
class ResultsArray<T> {
    private list: Array<T>;
    private numberOfItemsSet: number = 0;

    constructor(length: number) {
        this.list = new Array<T>(length);
    }

    /**
     * Sets the item to the position of the array.
     * @param index the index of the array to use
     * @param item the item to set
     */
    setItem(index: number, item: T) {
        // if the element at the index was not previously set, increment the counter
        if (this.list.at(index) === undefined) {
            this.numberOfItemsSet++;
        }
        this.list[index] = item;
    }

    /**
     * Get the number of slots in the array that have values added to them.
     * @returns the number of items
     */
    getNumberOfSetItems(): number {
        return this.numberOfItemsSet;
    }

    /**
     * Get the underlying data as normal list.
     * Note that this function throws an exception, if not all slots in the array have been set before via `setItem`!
     * @returns the list
     */
    getAsList(): T[] {
        if (this.numberOfItemsSet !== this.list.length) {
            throw "not all elements of the list were set";
        }
        return this.list;
    }
}

/**
 * Implements a simple queue that is initialized with a list and only allows to pop items.
 * The last item (index length-1) in the list is the first to be popped.
 */
class ItemQueue<T> {
    private list: T[];
    private initialSize: number;

    constructor(list: T[]) {
        // Note: make a shallow copy of the list,
        // otherwise the list of the caller is changed by methods of this class
        this.list = [...list];
        this.initialSize = list.length;
    }

    /**
     * Get an element of the list and remove it from the queue.
     * @returns either an item and its index - if available - or `undefined` otherwise
     */
    pop(): ItemWithIndex<T> | undefined {
        const index = this.list.length - 1;
        const item = this.list.pop();
        if (item) {
            return { item, index };
        } else {
            return undefined;
        }
    }

    /**
     * Get the initial size that the queue had before any items were popped.
     * @returns the initial size
     */
    getInitialSize(): number {
        return this.initialSize;
    }

    /**
     * Get the current size of the queue, i.e. how many items are remaining.
     * @returns the number of items
     */
    getSize(): number {
        return this.list.length;
    }
}
