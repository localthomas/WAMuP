import { Link } from "@solidjs/router";
import { BackendStore } from "../backend/backend";
import { AssetDetailed } from "../components/asset-detailed";
import { CrossBtn } from "../components/icon-btns";

export default function Queue(props: {
    backend: BackendStore;
    playlist: string[];
    onRemoveFromPlaylist: (index: number) => void;
    onReplacePlaylist: (newList: string[]) => void;
}) {
    //if the queue is empty show a hint
    if (props.playlist.length <= 0) {
        return (
            <div class="container">
                <div class="columns is-centered">
                    <h1 class="title">
                        Queue is empty!
                    </h1>
                </div>
            </div>
        );
    }

    const id: string = props.playlist[0];
    return (
        <div class="container">
            <AssetDetailed backend={props.backend} assetID={id}>
                <button class="is-outlined"
                    disabled={props.playlist.length <= 1}
                    onClick={() => {
                        props.onReplacePlaylist([props.playlist[0]])
                    }} >
                    Clear Queue
                </button>
            </AssetDetailed>
            <table class="is-striped">
                <thead>
                    <tr>
                        <th></th>
                        <th>Title</th>
                        <th>Artist</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {props.playlist.slice(1).map((assetID, index) => {
                        const assetData = props.backend.get(assetID);
                        if (!assetData) {
                            throw "unreachable";
                        }
                        const asset = {
                            id: assetID,
                            meta: assetData.metadata,
                        }
                        return (
                            <tr>
                                <td>{index + 1}</td>
                                <td>
                                    <Link href={"/assets/" + encodeURIComponent(asset.id)}>
                                        {asset.meta.title}
                                    </Link>
                                </td>
                                <td>
                                    <Link href={"/artists/" + encodeURIComponent(asset.meta.artist)}>
                                        {asset.meta.artist}
                                    </Link>
                                </td>
                                <td class="fixed-width">
                                    <div>
                                        <CrossBtn
                                            small
                                            onClick={() => {
                                                props.onRemoveFromPlaylist(index + 1);
                                            }} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}