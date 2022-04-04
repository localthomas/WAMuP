import { PerFileData } from "../backend/file-handling";
import { getFileHash } from "../backend/file-hashing";
import { getMetadata } from "../backend/metadata";

const worker: Worker = self as any;

worker.addEventListener('message', async (message) => {
    const files = message.data as File[];
    let perFileData: PerFileData[] = [];
    for (const file of files) {
        const hash = await getFileHash(file);
        let metadata = { disk: {}, track: {} };
        try {
            metadata = await getMetadata(file);
        } catch (error) {
            console.error(`could not read metadata from ${file.name}: `, error);
        }

        perFileData.push({
            hash,
            metadata
        });
    }
    postMessage(perFileData);
});

// suppress TS1208
export default null;
