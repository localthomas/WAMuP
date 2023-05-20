import CRC32C from "crc-32";

/**
 * Converts an untyped array of binary data (i.e. variable length hash results) into a string with hexadecimal representation.
 * @param value an untyped hash result
 * @returns the hash as string
 */
function hashAsString(value: ArrayBuffer): string {
    let string = "";
    for (const valueUint8 of new Uint8Array(value)) {
        // note: convert byte into two hexadecimal characters
        string = string + valueUint8.toString(16).padStart(2, "0");
    }
    return string;
}

/**
 * A simple hashing function that does not use the whole data ArrayBuffer, but instead samples chunks of the buffer and uses these instead.
 * These chunks are combined with the length value into one hash value.
 * Note that this is a constant-time hashing function where the size of the data does not change the amount of hashed bytes.
 *
 * A fixed number of chunks is used (currently 3) where all chunks are evenly distributed across the data boundaries.
 *
 * Internally it uses CRC32 as its "hashing" function of the chunks.
 *
 * Inspired by [imohash](https://github.com/kalafut/imohash) with the same limitations (not suitable for):
 * * file verification or integrity monitoring
 * * cases where fixed-size files are manipulated
 * * anything cryptographic
 * @param data the data to hash against
 * @returns the hash as binary data
 */
async function hash(data: Blob): Promise<ArrayBuffer> {
    // sampleSize denotes the size of the chunks that are hashed in bytes
    const sampleSize = 4096;
    // the number of chunks from one data block (min. 2)
    const numberOfSamples = 3;

    let offsets = [0];
    // add offsets in the middle
    // leftMostChunkRaw is the first chunk that is not at the very beginning (might be negative)
    const leftMostChunkRaw = Math.round((data.size / numberOfSamples - 1) - (sampleSize / 2));
    const leftMostChunk = Math.max(0, leftMostChunkRaw);
    for (let i = 1; i <= numberOfSamples - 2; i++) {
        offsets.push(i * leftMostChunk);
    }
    // add offset for the end
    offsets.push(Math.max(0, data.size - sampleSize));


    // the hashing value
    let hash = 0;

    for (const offset of offsets) {
        const chunk = data.slice(offset, offset + sampleSize);
        const intermediateHash32 = CRC32C.buf(new Uint8Array(await chunk.arrayBuffer()));
        hash = hash ^ intermediateHash32;
    }

    // XOR with the length of the data buffer at the end
    // (this should mean that buffers with different sizes have a very high probability of a different hash value)
    hash = hash ^ data.size;

    const result = new DataView(new ArrayBuffer(4));
    result.setInt32(0, hash);
    return result.buffer;
}

/**
 * Returns a hash (currently 32-bit Murmur3) for the given file as number.
 *
 * Note: this changes the contents of the buffer!
 * @param file the file content to hash
 * @returns the hash of the file
 */
export async function getFileHash(file: File): Promise<string> {
    return hashAsString(await hash(file));
}
