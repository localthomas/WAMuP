import { PerFileData } from "../backend/file-handling";
import { getFileHash } from "../backend/file-hashing";
import { getMetadata } from "../backend/metadata";
import { registerParallelWorkerFunction } from "./parallel-worker-base";

registerParallelWorkerFunction(async function (file: File): Promise<PerFileData> {
    const hash = await getFileHash(file);

    let metadata = {
        title: "",
        album: "",
        artist: "",
        albumArtist: "",
        codec: "",
        composer: "",
        genre: "",
        disc: { of: 0, no: 0 },
        track: { of: 0, no: 0 }
    };
    try {
        metadata = await getMetadata(file, file.name);
    } catch (error) {
        console.error(`could not read metadata from ${file.name}: `, error);
    }

    return {
        hash,
        metadata,
    };
});
