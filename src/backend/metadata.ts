import "music-metadata-browser";
import { IAudioMetadata, parseBuffer, selectCover } from "music-metadata-browser";

export type Metadata = {
    readonly title: string
    readonly album: string
    readonly year?: number
    readonly artist: string
    readonly albumArtist: string
    readonly composer: string
    readonly genre: string
    readonly disc: {
        readonly no: number
        readonly of: number
    }
    readonly track: {
        readonly no: number
        readonly of: number
    }
    readonly durationSeconds?: number
    readonly codec: string
}

/**
 * Returns the audio metadata of the given file that must contain audio data.
 * @param file the file to analyze
 * @returns the metadata of the file
 */
export async function getMetadata(file: Uint8Array, mime: string, fileName: string): Promise<Metadata> {
    // use the options to skip some parsing that is not required by convertToMetadata
    const metadataRaw = await parseBuffer(file, mime, {
        duration: true,
        skipCovers: true,
        skipPostHeaders: false,
        includeChapters: false,
    });
    return convertToMetadata(metadataRaw, fileName);
}

export async function getThumbnail(file: Uint8Array, mime: string): Promise<Blob | undefined> {
    // use the options to skip some parsing that is not required by convertToMetadata
    const metadataRaw = await parseBuffer(file, mime, {
        duration: false,
        skipCovers: false,
        skipPostHeaders: true,
        includeChapters: false,
    });
    const picture = selectCover(metadataRaw.common.picture);
    if (picture) {
        // convert IPicture into a Blob
        return new Blob([picture.data], {
            type: picture.format
        });
    } else {
        return undefined;
    }
}

/**
 * Converts the metadata from library specific format into an library agnostic format.
 * If the title is not set, the file name is used as a fallback.
 * @param metadataRaw the metadata in the format of the music-metadata-browser lib
 * @returns the converted unified metadata
 */
function convertToMetadata(metadataRaw: IAudioMetadata, fileName: string): Metadata {
    return {
        title: metadataRaw.common.title ?? fileName,
        album: metadataRaw.common.album ?? "",
        year: metadataRaw.common.year,
        artist: metadataRaw.common.artist ?? "",
        albumArtist: metadataRaw.common.albumartist ?? "",
        composer: metadataRaw.common.composer?.join(", ") ?? "",
        genre: metadataRaw.common.genre?.join(", ") ?? "",
        disc: {
            no: metadataRaw.common.disk.no ?? 0,
            of: metadataRaw.common.disk.of ?? 0,
        },
        track: {
            no: metadataRaw.common.track.no ?? 0,
            of: metadataRaw.common.track.of ?? 0,
        },
        durationSeconds: metadataRaw.format.duration,
        codec: metadataRaw.format.codec ?? "",
    };
}
