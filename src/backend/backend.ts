import { Progress } from "../miscellaneous/parallel";
import { createPerFileData } from "./file-handling";
import { getThumbnail, Metadata, MetadataWithID } from "./metadata";

export type BackendState = None | Loading | Backend;
export interface Backend {
    tag: "Backend"
    store: BackendStore
}
export interface None {
    tag: "None"
};
export interface Loading extends Progress {
    tag: "Loading"
    directory: string
};

/**
 * A Backend stores the result of scanning a directory of audio files.
 */
export class BackendStore {
    private assets: Map<string, Asset>;
    /**
     * The name of the directory that was used to create this backend.
     */
    readonly directory: string;

    constructor(directory: string, assets: Map<string, Asset>) {
        this.directory = directory;
        this.assets = assets;
    }

    /**
     * Iterates over all assets stored in this backend and calls the iteration function on each.
     * @param func the iteration function
     */
    public forEach(func: (id: string, asset: Asset) => void): void {
        this.assets.forEach((asset: Asset, assetID: string) => {
            func(assetID, asset);
        });
    }

    /**
     * Creates a list with merged assets and their IDs. The result is not sorted.
     * @returns the list of assets
     */
    public asAssetList(): AssetWithID[] {
        let list: AssetWithID[] = [];
        this.assets.forEach((asset: Asset, id: string) => {
            list.push({
                id,
                asset
            });
        });
        return list;
    }

    /**
     * Creates a list with merged metadata and their asset IDs. The result is not sorted.
     * @returns the list of assets
     */
    public asMetadataList(): MetadataWithID[] {
        let list: MetadataWithID[] = [];
        this.assets.forEach((asset: Asset, id: string) => {
            list.push({
                id,
                meta: asset.metadata
            });
        });
        return list;
    }

    /**
     * Searches for a given asset in the store and returns it, if found
     * @param assetID the asset's ID
     * @returns the asset
     */
    public get(assetID: string): Asset | undefined {
        return this.assets.get(assetID);
    }

    /**
     * Similar to `get`, but either throws an exception if the asset does not exist or returns the asset on success.
     * @param assetID the asset's ID
     * @returns the asset
     */
    public mustGet(assetID: string): Asset {
        const asset = this.get(assetID);
        if (!asset) {
            throw "unknown asset ID: " + assetID;
        }
        return asset;
    }

    /**
     * Get the thumbnail/picture of an asset.
     * If the asset does not exist, an exception is thrown, otherwise the picture (if available) is returned.
     * @param assetID the asset's ID
     * @returns either a Blob with the image data or undefined, if the asset has no thumbnail
     */
    public async getThumbnail(assetID: string): Promise<Blob | undefined> {
        const asset = this.mustGet(assetID);
        const data = new Uint8Array(await asset.file.arrayBuffer());
        return getThumbnail(data, asset.file.type);
    }

    /**
     * Computes some general statistics about all assets in the backend.
     * @returns general statistics about all assets
     */
    public getStatistics(): Statistics {
        let numAssets = 0;
        let artists = new Set<string>();
        let albums = new Set<string>();
        let oldest = 0;
        let newest = 0;
        this.assets.forEach((asset: Asset) => {
            numAssets++;
            artists.add(asset.metadata.artist);
            albums.add(asset.metadata.album);
            const metadataYear = asset.metadata.year;
            if (metadataYear) {
                // set the oldest year to the first available year
                if (oldest === 0) {
                    oldest = metadataYear;
                }
                // the unset value for years is 0
                if (metadataYear < oldest && metadataYear !== 0) {
                    oldest = metadataYear;
                }
                if (metadataYear > newest) {
                    newest = metadataYear;
                }
            }
        });
        return {
            numArtists: artists.size,
            numAlbums: albums.size,
            newestYear: newest,
            oldestYear: oldest,
            numAssets: numAssets,
        };
    }
}

/**
 * General statistics about a backend.
 */
export type Statistics = {
    readonly numArtists: number;
    readonly numAlbums: number;
    readonly numAssets: number;
    readonly oldestYear: number;
    readonly newestYear: number;
}

/**
 * Combines an asset with its unique ID.
 */
export type AssetWithID = {
    readonly id: string;
    readonly asset: Asset;
}

/**
 * The Asset class stores all required data for one asset, that represents an audio file on disc.
 */
export class Asset {
    readonly metadata: Metadata;
    readonly file: File;

    constructor(file: File, metadata: Metadata) {
        this.file = file;
        this.metadata = metadata;
    }
}

/**
 * Creates a new backend using the files in the given directory.
 * It is expected that the defined directory contains audio files,
 * because only audio files are used when creating the backend.
 * @param directoryHandle the directory where audio files reside
 * @returns the generated Backend with data
 */
export async function createBackend(directoryHandle: FileSystemDirectoryHandle, progressCallback: (progress: Progress) => void): Promise<BackendState> {
    // only use audio files in further processing
    const allFiles = await (
        await getAllFiles(directoryHandle)
    ).filter(isAudioFile);

    // create a hash mapping, i.e. address files via hashes
    let assets = new Map<string, Asset>();

    const perFileData = await createPerFileData(allFiles, progressCallback);

    for (const [i, file] of allFiles.entries()) {
        const hash = perFileData[i].hash;

        // there might be duplicate files with same hashes
        const mappedFile = assets.get(hash)
        if (mappedFile !== undefined) {
            console.warn("found two files with same hash", { a: file.name, b: mappedFile.file.name });
            continue;
        }

        const asset = new Asset(file, perFileData[i].metadata);
        assets.set(hash, asset);
    }

    return { tag: "Backend", store: new BackendStore(directoryHandle.name, assets) };
}

/**
 * Tests if the file might be an audio file with audio content.
 * @param file the file to test
 * @returns true if the file is a potential audio file
 */
function isAudioFile(file: File): boolean {
    const regex = /audio\/.*/;
    const mime = file.type;
    return regex.test(mime);
}

/**
 * Recursively scans the given directory for files and only returns files in a flattened list.
 * @param directoryHandle the directory handle to use
 * @returns a list with all files in the directory
 */
async function getAllFiles(directoryHandle: FileSystemDirectoryHandle): Promise<File[]> {
    let list = [];
    for await (const fileHandle of getFilesRecursively(directoryHandle)) {
        list.push(fileHandle)
    }
    return list;
}

async function* getFilesRecursively(entry: FileSystemDirectoryHandle | FileSystemFileHandle): AsyncGenerator<File, any, void> {
    if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file !== null) {
            yield file;
        }
    } else if (entry.kind === 'directory') {
        for await (const handle of entry.values()) {
            yield* getFilesRecursively(handle);
        }
    }
}
