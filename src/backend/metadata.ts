import "music-metadata-browser";
import { IAudioMetadata, parseBuffer } from "music-metadata-browser";

export type Metadata = {
    title: string
    album: string
    year?: number
    artist: string
    albumArtist: string
    disk: {
        no: number
        of: number
    }
    track: {
        no: number
        of: number
    }
    durationSeconds?: number
    codec: string
}

/**
 * Returns the audio metadata of the given file that must contain audio data.
 * @param file the file to analyze
 * @returns the metadata of the file
 */
export async function getMetadata(file: Uint8Array, mime: string): Promise<Metadata> {
    // use the options to skip some parsing that is not required by convertToMetadata
    const metadataRaw = await parseBuffer(file, mime, {
        duration: true,
        skipCovers: true,
        skipPostHeaders: false,
        includeChapters: false,
    });
    return convertToMetadata(metadataRaw);
}

/**
 * Converts the metadata from library specific format into an library agnostic format.
 * @param metadataRaw the metadata in the format of the music-metadata-browser lib
 * @returns the converted unified metadata
 */
function convertToMetadata(metadataRaw: IAudioMetadata): Metadata {
    return {
        title: metadataRaw.common.title ?? "",
        album: metadataRaw.common.album ?? "",
        year: metadataRaw.common.year,
        artist: metadataRaw.common.artist ?? "",
        albumArtist: metadataRaw.common.albumartist ?? "",
        disk: {
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
