import { isProgress, Progress } from "../workers/shared-types";
import { Metadata } from "./metadata";

export type PerFileData = {
    hash: string
    metadata: Metadata
}

/**
 * Analyzes each file and returns lists with data about these files.
 * Each list that is returned has the same size as the files list and the indices are corresponding to each other.
 * @param files the files to analyze
 * @returns a tuple with (hashes)
 */
export async function createPerFileData(files: File[], progressCallback: (progress: Progress) => void): Promise<PerFileData[]> {
    // spawn a parallel working pool for retrieving the data
    const numberWorkerThreads = window.navigator.hardwareConcurrency;
    const partitionedFiles = partitionListBy(files, numberWorkerThreads);

    console.time("file-handling.worker.ts");
    const resultsPartitioned = await runMultipleWorkers<PerFileData[]>(partitionedFiles, new URL("../workers/file-handling.worker.ts", import.meta.url), progressCallback);
    console.timeEnd("file-handling.worker.ts");

    const results = mergePartitionedList(resultsPartitioned);

    console.assert(files.length === results.length);
    return results;
}

/**
 * Runs a list of payloads on multiple WebWorkers and returns the result after all workers have finished.
 * The length of the partitionedPayload parameter defines how many workers are created.
 * Ideally this corresponds to window.navigator.hardwareConcurrency.
 *
 * Note that no type-checking is taking place, so the type parameter T is only for readability.
 * @param partitionedPayload the payload in partitioned form
 * @param scriptURL the URL for loading the WebWorker script
 * @returns the results of all workers in partitioned form
 */
async function runMultipleWorkers<T>(partitionedPayload: any[], scriptURL: URL, progressCallback: (progress: Progress) => void): Promise<T[]> {
    const numberOfWorkers = partitionedPayload.length;
    // create the workers
    const workers = new Array<Worker>(numberOfWorkers);
    for (let i = 0; i < numberOfWorkers; i++) {
        workers[i] = new Worker(
            scriptURL,
            // Note: do not use type: "module", as it removes the variable "global"
            // that is required by some dependencies that only run on nodejs
            // see https://github.com/parcel-bundler/parcel/issues/6790
            //{ type: "module" }
        );
    }
    // create a result array
    const results = new Array<T>(numberOfWorkers);

    // create a progress array, i.e. how many items each worker already processed
    const progress = new Array<Progress>(numberOfWorkers);
    /**
     * Handle a progress change message for a worker.
     * @param progress the progress of the worker
     * @param index the worker index (must be smaller than numberOfWorkers)
     */
    const handleProgress = function (progressUpdate: Progress, index: number) {
        // update the progress array
        progress[index] = progressUpdate;
        // and produce a total progress by accumulating
        const totalProgress = progress.reduce((previous, current): Progress => {
            return {
                finished: previous.finished + current.finished,
                total: previous.total + current.total
            };
        });
        // and send it to the callback
        progressCallback(totalProgress);
    }

    // create a new Promise that resolves until all workers have finished their jobs and
    // their results were set to the result array
    const promise: Promise<T[]> = new Promise((resolve) => {
        let workersStillWorking = numberOfWorkers;
        // register on all workers
        for (let i = 0; i < numberOfWorkers; i++) {
            workers[i].onmessage = (message) => {
                const data = message.data as T | Progress;
                // type switch the message data
                if (isProgress(data)) {
                    handleProgress(data, i);
                } else {
                    // a worker has finished and provided a result
                    // store the result in the results array
                    results[i] = data;
                    // decrement the running counter
                    workersStillWorking--;
                    // check if this "onmessage" is the last of all workers
                    if (workersStillWorking === 0) {
                        // this is the last call to onmessage, so the promise can be resolved
                        // all results have been written to the results array
                        resolve(results);
                    }
                }
            };
        }
    });

    // start work by posting all the necessary messages
    for (let i = 0; i < numberOfWorkers; i++) {
        workers[i].postMessage(partitionedPayload[i]);
    }

    return promise;
}

/**
 * Partitions a list into roughly equally sized partitions.
 * @param list the list to partition
 * @param numberOfPartitions the number of partitions
 * @returns a list of partitions
 */
function partitionListBy<T>(list: T[], numberOfPartitions: number): T[][] {
    const partitionSizeRounded = Math.floor(list.length / numberOfPartitions);
    const partitionSizeRest = list.length % numberOfPartitions;

    const result = new Array<T[]>(numberOfPartitions);
    let offset = 0;
    for (let i = 0; i < numberOfPartitions; i++) {
        const offsetEnd = offset + partitionSizeRounded
        const end = i < partitionSizeRest ?
            // if there is a rest, add one to each partition for the amount of rest
            // this works, because rest is guaranteed to be lower than numberOfPartitions
            offsetEnd + 1
            : offsetEnd;
        result[i] = list.slice(offset, end);
        // proper offset for the next round
        offset = end;
    }
    return result;
}

/**
 * Merges a list of lists into just a list. Preserves the order of the lists.
 * @param partitionedList a list of lists that were partitioned
 * @returns the merged list
 */
function mergePartitionedList<T>(partitionedList: T[][]): T[] {
    let list: T[] = []
    for (const partition of partitionedList) {
        list = list.concat(partition);
    }
    return list;
}
