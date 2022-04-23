import { useNavigate } from "solid-app-router";
import { createSignal } from "solid-js";
import { Asset, BackendStore } from "../backend/backend";
import AlbumCard from "../components/album-card";
import { getAlbumList, getFirstThumbnail } from "./album";

export default function AlbumsCards(props: {
    backend: BackendStore;
    onReplacePlaylist: (newList: string[]) => void;
}) {
    const navigate = useNavigate();

    const albums = processAlbums(props.backend);
    type Album = {
        name: string;
        info: AlbumInfo;
    }
    let list: Album[] = [];
    for (const [album, info] of albums) {
        list.push({
            name: album,
            info: info
        });
    }
    list.sort((a: Album, b: Album): number =>
        a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    );
    return (
        <div class="albums">
            {list.map(album => {
                const [thumbnailData, setThumbnailData] = createSignal<Blob | undefined>(undefined);
                getFirstThumbnail(props.backend, album.info.assets).then((thumbnailData) => {
                    setThumbnailData(thumbnailData);
                });

                return (
                    <AlbumCard
                        album={album.name}
                        thumbnailData={thumbnailData}
                        albumArtist={album.info.albumArtist}
                        onWantToPlay={() => {
                            props.onReplacePlaylist(getAlbumList(props.backend, album.name));
                        }}
                        onWantToSeeAlbum={() => {
                            navigate("/albums/" + encodeURIComponent(album.name));
                        }} />
                );
            })}
        </div>
    );
}

type AlbumInfo = {
    numTitles: number;
    assets: string[];
    albumArtist: string;
}

function processAlbums(data: BackendStore): Map<string, AlbumInfo> {
    let map = new Map<string, AlbumInfo>();
    data.forEach((_: string, asset: Asset) => {
        const currentAlbum = asset.metadata.album;
        //get a albumInfo if available, otherwise create
        let info = map.get(currentAlbum);
        if (!info) {
            // get all assets of this album
            const assetsOfAlbum = data.asAssetList()
                .filter(asset => asset.asset.metadata.album === currentAlbum)
                .map(assetWithID => assetWithID.id);

            info = {
                assets: assetsOfAlbum,
                albumArtist: asset.metadata.albumArtist,
                numTitles: 0,
            };
        }
        info.numTitles++;
        map.set(asset.metadata.album, info);
    });
    return map;
}