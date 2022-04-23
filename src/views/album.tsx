import { useParams } from "solid-app-router";
import { createResource } from "solid-js";
import { Asset, BackendStore } from "../backend/backend";
import { getThumbnail, MetadataWithID, sortTracksFunction } from "../backend/metadata";
import { blobToImageWithDefault } from "../miscellaneous/images";
import TitleList, { TitleListEvents } from "../components/title-list";

export default function Album(props: {
    backend: BackendStore;
    onReplacePlaylist: (newList: string[]) => void;
    currentAsset: string | undefined;
} & TitleListEvents) {
    const params = useParams();
    const album = decodeURIComponent(params.id);

    const assets = props.backend.asAssetList().filter((asset) => {
        //filter for given album name
        return asset.asset.metadata.album === album;
    });

    let albumsArtists = new Set<string>();
    for (const asset of assets) {
        albumsArtists.add(asset.asset.metadata.artist);
    }
    let albumsArtistsList: string[] = [];
    albumsArtists.forEach(artist => { albumsArtistsList.push(artist) });
    albumsArtistsList.sort();

    let oldestYear = Number.MAX_VALUE;
    let newestYear = 0;
    assets.forEach((assetWithID) => {
        const asset = assetWithID.asset;
        // if the year is = 0, then the year is probably not set
        if (asset.metadata.year && asset.metadata.year !== 0) {
            if (oldestYear > asset.metadata.year) {
                oldestYear = asset.metadata.year;
            }
            if (newestYear < asset.metadata.year) {
                newestYear = asset.metadata.year;
            }
        }
    });

    const [thumbnail] = createResource(async () => {
        return await getFirstThumbnail(assets.map(asset => asset.asset));
    });

    return (
        <div class="container album">
            <div class="columns">
                <div class="column">
                    {blobToImageWithDefault(thumbnail())}
                </div>
                <div class="column details">
                    <h1>{album}</h1>
                    <h2>
                        {albumsArtistsList.join("; ")}
                    </h2>
                    {
                        // only display the year, if both year values are valid
                        newestYear !== 0 && oldestYear !== Number.MAX_VALUE ?
                            <p>
                                {
                                    newestYear === 0 ? " " :
                                        oldestYear === newestYear ?
                                            oldestYear
                                            :
                                            oldestYear + " - " + newestYear
                                }
                            </p>
                            :
                            <></>
                    }
                    <button class="is-outlined"
                        onClick={() => {
                            props.onReplacePlaylist(getAlbumList(props.backend, album));
                        }}>
                        Play All
                    </button>
                </div>
            </div>
            <TitleList
                titles={assets.map(
                    (assetWithID): MetadataWithID => {
                        return {
                            id: assetWithID.id,
                            meta: assetWithID.asset.metadata
                        }
                    })}
                sortFn={sortTracksFunction}
                ignoreList={new Set(["Album"])} {...props}
            />
        </div>
    );
}

/**
 * Search for a thumbnail in the given list of assets and return the first one.
 * @param list the list to scan through
 * @returns either the binary data of a thumbnail or nothing
 */
export async function getFirstThumbnail(list: Asset[]): Promise<Blob | undefined> {
    let thumbnail: Blob | undefined = undefined;
    // get the first thumbnail of all assets in the list
    for (const asset of list) {
        const data = new Uint8Array(await asset.file.arrayBuffer());
        thumbnail = await getThumbnail(data, asset.file.type);
        // skip any more thumbnails with breaking the loop
        if (thumbnail) break;
    }
    return thumbnail;
}

/**
 * Generates a list of all asset IDs that are in an album.
 * @param data the backend
 * @param albumName the album name
 * @returns a list with all asset IDs that are in the album
 */
export function getAlbumList(data: BackendStore, albumName: string): string[] {
    //get a list with all titles and the correct order of the album
    let tmpList: MetadataWithID[] = [];
    data.forEach((assetID: string, asset: Asset) => {
        //filter for given album name
        if (asset.metadata.album === albumName) {
            tmpList.push({
                id: assetID,
                meta: asset.metadata,
            })
        }
    })
    tmpList.sort(sortTracksFunction)
    let list: string[] = tmpList.map(asset => asset.id);
    return list;
}
