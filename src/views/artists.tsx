import { Link } from "solid-app-router";
import { createMemo, For } from "solid-js";
import { Asset, BackendStore } from "../backend/backend";

export default function Artists(props: {
    backend: BackendStore
}) {
    const list = createMemo(() => {
        const artists = processArtists(props.backend);
        let list: Artist[] = [];
        for (const [artist, info] of artists) {
            list.push({
                name: artist,
                info: info
            });
        }
        list.sort((a: Artist, b: Artist): number => a.name.localeCompare(b.name));
        return list;
    });
    return (
        <div class="container">
            <table>
                <thead>
                    <tr>
                        <th>Artist</th>
                        <th>Songs</th>
                    </tr>
                </thead>
                <tbody>
                    <For each={list()} fallback={<></>}>
                        {(artist) => (
                            <tr>
                                <th><Link href={"/artists/" + encodeURIComponent(artist.name)}>{artist.name}</Link></th>
                                <td>{artist.info.numTitles}</td>
                            </tr>
                        )}
                    </For>
                </tbody>
            </table>
        </div >
    );
}

type Artist = {
    name: string;
    info: ArtistInfo;
}

type ArtistInfo = {
    numTitles: number;
};

function processArtists(data: BackendStore): Map<string, ArtistInfo> {
    let map = new Map<string, ArtistInfo>();
    data.forEach((_: string, asset: Asset) => {
        //get a artistInfo if available, otherwise create
        let info = map.get(asset.metadata.artist);
        if (!info) {
            info = {
                numTitles: 0
            };
        }
        info.numTitles++;
        map.set(asset.metadata.artist, info);
    });
    return map;
}
