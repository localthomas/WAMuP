import { PerFileData } from "../backend/file-handling";
import { getFileHash } from "../backend/file-hashing";
import { getMetadata } from "../backend/metadata";
import { FileHandlingMessageType } from "./shared-types";

const worker: Worker = self as any;

worker.addEventListener('message', async (message) => {
    // typed postMessage function
    const postMessage = function (message: FileHandlingMessageType): void {
        worker.postMessage(message);
    };

    const files = message.data as File[];
    let perFileData: PerFileData[] = [];
    for (const [index, file] of files.entries()) {
        // read the binary data of the file once, as it is needed for the metadata and hash
        const fileBlob = new Uint8Array(await file.arrayBuffer());

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
            metadata = await getMetadata(fileBlob, file.type);
        } catch (error) {
            console.error(`could not read metadata from ${file.name}: `, error);
        }

        // Note: get hash after metadata, as this function changes the content of the buffer!
        const hash = await getFileHash(fileBlob);

        perFileData.push({
            hash,
            metadata
        });

        // post update about which file was processed previously
        postMessage({
            finished: index + 1,
            total: files.length
        })
    }
    postMessage(perFileData);
});

// suppress TS1208
export default null;
