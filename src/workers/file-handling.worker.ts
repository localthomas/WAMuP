import { PerFileData } from "../backend/file-handling";
import { getFileHash } from "../backend/file-hashing";

const worker: Worker = self as any;

worker.addEventListener('message', async (message) => {
    const files = message.data as File[];
    let perFileData: PerFileData[] = [];
    for (const file of files) {
        const hash = await getFileHash(file);
        perFileData.push({
            hash
        });
    }
    postMessage(perFileData);
});

// suppress TS1208
export default null;
