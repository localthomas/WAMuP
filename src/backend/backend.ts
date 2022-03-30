import { createPerFileData } from "./file-handling";

export class Backend {

}

/**
 * Creates a new backend using the files in the given directory.
 * It is expected that the defined directory contains audio files,
 * because only audio files are used when creating the backend.
 * @param directoryHandle the directory where audio files reside
 * @returns the generated Backend with data
 */
export async function createBackend(directoryHandle: FileSystemDirectoryHandle): Promise<Backend> {
    // only use audio files in further processing
    const allFiles = await (
        await getAllFiles(directoryHandle)
    ).filter(isAudioFile);

    // create a hash mapping, i.e. address files via hashes
    let hashMapping = new Map<string, File>();
    const perFileData = await createPerFileData(allFiles);

    for (const [i, file] of allFiles.entries()) {
        const hash = perFileData[i].hash;
        // there might be duplicate files with same hashes
        const mappedFile = hashMapping.get(hash)
        if (mappedFile !== undefined) {
            console.warn("found two files with same hash", { a: file.name, b: mappedFile.name });
        } else {
            hashMapping.set(hash, file);
        }
    }
    console.log(hashMapping);

    return new Backend();
}

/**
 * Tests if the file might be an audio file with audio content.
 * @param file the file to test
 * @returns true if the file is a potential audio file
 */
function isAudioFile(file: File): boolean {
    const regex = /audio\/.*/;
    const mime = file.type;
    return regex.test(mime);
}

/**
 * Recursively scans the given directory for files and only returns files in a flattened list.
 * @param directoryHandle the directory handle to use
 * @returns a list with all files in the directory
 */
async function getAllFiles(directoryHandle: FileSystemDirectoryHandle): Promise<File[]> {
    let list = [];
    for await (const fileHandle of getFilesRecursively(directoryHandle)) {
        list.push(fileHandle)
    }
    return list;
}

async function* getFilesRecursively(entry: FileSystemDirectoryHandle | FileSystemFileHandle): AsyncGenerator<File, any, void> {
    if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file !== null) {
            yield file;
        }
    } else if (entry.kind === 'directory') {
        for await (const handle of entry.values()) {
            yield* getFilesRecursively(handle);
        }
    }
}
