import { NavLink } from "solid-app-router";
import { BackendStore } from "../../backend/backend";
import { QueueState } from "../../player/queue";
import { CrossBtn } from "../icon-btns";

export default function Queue(props: {
    backend: BackendStore;
    queue: QueueState;
    onRemoveFromPlaylist: (index: number) => void;
    onReplacePlaylist: (newList: string[]) => void;
}) {
    //if the queue is empty show a hint
    if (props.queue.playlist.length <= 0) {
        return (
            <div className="container">
                <div className="columns is-centered">
                    <h1 className="title">
                        Queue is empty!
                    </h1>
                </div>
            </div>
        );
    }

    const id: string = props.queue.playlist[0];
    return (
        <>
            <table class="table is-striped is-fullwidth is-hoverable">
                <thead>
                    <tr>
                        <th></th>
                        <th>Title</th>
                        <th>Artist</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {props.queue.playlist.slice(1).map((assetID, index) => {
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
                                    <NavLink href={"/assets/" + encodeURIComponent(asset.id)}>
                                        {asset.meta.title}
                                    </NavLink>
                                </td>
                                <td>
                                    <NavLink href={"/artists/" + encodeURIComponent(asset.meta.artist)}>
                                        {asset.meta.artist}
                                    </NavLink>
                                </td>
                                <td class="action-column has-text-right">
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
        </>
    );
}