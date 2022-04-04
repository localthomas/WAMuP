import "music-metadata-browser";
import { IAudioMetadata, parseBlob } from "music-metadata-browser";

export type Metadata = {
    title?: string
    year?: number
    artist?: string
    albumArtist?: string
    disk: {
        no?: number
        of?: number
    }
    track: {
        no?: number
        of?: number
    }
    durationSeconds?: number
    codec?: string
}

/**
 * Returns the audio metadata of the given file that must contain audio data.
 * @param file the file to analyze
 * @returns the metadata of the file
 */
export async function getMetadata(file: File): Promise<Metadata> {
    const metadataRaw = await parseBlob(file);
    return convertToMetadata(metadataRaw);
}

/**
 * Converts the metadata from library specific format into an library agnostic format.
 * @param metadataRaw the metadata in the format of the music-metadata-browser lib
 * @returns the converted unified metadata
 */
function convertToMetadata(metadataRaw: IAudioMetadata): Metadata {
    return {
        title: metadataRaw.common.title,
        year: metadataRaw.common.year,
        artist: metadataRaw.common.artist,
        albumArtist: metadataRaw.common.albumartist,
        disk: {
            no: metadataRaw.common.disk.no === null ? undefined : metadataRaw.common.disk.no,
            of: metadataRaw.common.disk.of === null ? undefined : metadataRaw.common.disk.of
        },
        track: {
            no: metadataRaw.common.track.no === null ? undefined : metadataRaw.common.track.no,
            of: metadataRaw.common.track.of === null ? undefined : metadataRaw.common.track.of
        },
        durationSeconds: metadataRaw.format.duration,
        codec: metadataRaw.format.codec
    };
}
