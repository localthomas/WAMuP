import murmur32 from "murmur-32";

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
 * Returns a hash (currently 32-bit Murmur3) for the given file as number.
 * @param file the file content to hash
 * @returns the hash of the file
 */
export async function getFileHash(file: File): Promise<string> {
    return hashAsString(murmur32(await file.arrayBuffer()));
}
