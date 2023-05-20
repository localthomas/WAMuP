import { delMany, get, keys, set } from 'idb-keyval';
import { Metadata } from "./metadata";

/**
 * Tries to get the `Metadata`, if it exists, from the cache.
 * @param hash the hash of the file for which the metadata should be searched for
 * @returns either the found `Metadata` or `undefined` if nothing was found
 */
export async function getMetadataFromCache(hash: string): Promise<Metadata | undefined> {
    const possibleMetadata = await get(hash);
    if (possibleMetadata) {
        return possibleMetadata as Metadata;
    } else {
        return undefined;
    }
}

/**
 * Store `Metadata` in the cache (IndexedDB) that survives page reloads.
 * @param hash the hash of the metadata file
 * @param metadata the metadata to store in the cache
 */
export async function setMetadataIntoCache(hash: string, metadata: Metadata) {
    await set(hash, metadata);
}

/**
 * Clear the cache of all entries, but keep the entries with the provided hashes.
 * @param hashes the list of hashes that should *not* be cleared
 */
export async function clearCacheExceptFor(hashes: string[]) {
    const keyList = await keys();
    // filter all current cache entries that are not in the `hashes` list
    const keysToDelete = keyList.filter((key) => !hashes.includes(key as string));

    await delMany(keysToDelete);
}