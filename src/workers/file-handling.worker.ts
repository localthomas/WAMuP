import { PerFileData } from "../backend/file-handling";
import { getFileHash } from "../backend/file-hashing";
import { getMetadata } from "../backend/metadata";
import { registerWorkerFunction } from "./worker-base";

registerWorkerFunction(async function (file: File): Promise<PerFileData> {
    // read the binary data of the file once, as it is needed for the metadata and hash
    const fileBlob = new Uint8Array(await file.arrayBuffer());

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
        metadata = await getMetadata(fileBlob, file.type, file.name);
    } catch (error) {
        console.error(`could not read metadata from ${file.name}: `, error);
    }

    // Note: get hash after metadata, as this function changes the content of the buffer!
    const hash = await getFileHash(fileBlob);

    return {
        hash,
        metadata,
    };
});
