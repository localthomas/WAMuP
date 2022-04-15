import { Progress, runMultipleWorkers } from "../miscellaneous/parallel";
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

    console.time("file-handling.worker.ts");
    const results = await runMultipleWorkers<File, PerFileData>(files, new URL("../workers/file-handling.worker.ts", import.meta.url), progressCallback);
    console.timeEnd("file-handling.worker.ts");

    console.assert(files.length === results.length, files, results);
    return results;
}
