import { PerFileData } from "../backend/file-handling";
import { getFileHash } from "../backend/file-hashing";
import { getMetadata } from "../backend/metadata";
import { FileHandlingMessageType } from "./shared-types";

const worker: Worker = self as any;

worker.addEventListener('message', async (message) => {
    // typed postMessage function
    const postMessage = function (message: FileHandlingMessageType, options?: WindowPostMessageOptions | undefined): void {
        worker.postMessage(message, options);
    };

    const files = message.data as File[];
    let perFileData: PerFileData[] = [];
    for (const [index, file] of files.entries()) {
        const hash = await getFileHash(file);
        let metadata = {
            title: "",
            album: "",
            artist: "",
            albumArtist: "",
            codec: "",
            disk: { of: 0, no: 0 },
            track: { of: 0, no: 0 }
        };
        try {
            metadata = await getMetadata(file);
        } catch (error) {
            console.error(`could not read metadata from ${file.name}: `, error);
        }

        perFileData.push({
            hash,
            metadata
        });

        // do not post so many messages: only each 10th index is send
        if (index % 10 === 0) {
            postMessage({
                finished: index + 1,
                total: files.length
            })
        }
    }
    postMessage(perFileData);
});

// suppress TS1208
export default null;
