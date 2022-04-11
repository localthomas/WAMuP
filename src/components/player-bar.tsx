import { createMemo, createSignal } from "solid-js";
import { BackendStore } from "../backend/backend";
import { Metadata } from "../backend/metadata";
import { AudioSession } from "../player/audio-session";
import { AudioControls } from "./audio-controls";
import { CrossBtn } from "./icon-btns";

export default function PlayerBar(props: {
    backend: BackendStore;
    audioSession: AudioSession;
}) {
    const [queue, setQueue] = createSignal<string[]>([]);
    props.audioSession.addPlaylistListener((newQueue) => {
        setQueue(newQueue);
    });

    const maxDisplayedPlaylist = 2;
    const playlistSnippet = createMemo(() => {
        const playlist = queue();
        let playlistSnippet: Metadata[] = [];
        playlist.slice(0,
            playlist.length > maxDisplayedPlaylist ? maxDisplayedPlaylist + 1 : playlist.length)
            .forEach((assetID) => {
                const info = props.backend.mustGet(assetID).metadata;
                playlistSnippet.unshift(info);
            });
        return playlistSnippet;
    });

    const playlistLength = createMemo(() => queue().length);

    return (
        <div class="player has-text-centered mt-4">
            <div class="container">
                <div class="columns is-centered">
                    <div class="column has-text-justified">
                        {playlistLength() > maxDisplayedPlaylist + 1 ?
                            <p class="has-text-centered">
                                {/* TODO: NavLink */}
                                <a href="/#/queue">
                                    {playlistLength() - maxDisplayedPlaylist - 1} more...
                                </a>
                            </p>
                            :
                            ""}
                        <table class="table is-fullwidth">
                            <tbody>
                                {playlistSnippet().map((info, index) =>
                                    <tr class={index == playlistSnippet.length - 1 ? "active-row" : ""}>
                                        <td>{info.title}</td>
                                        <td>{info.artist}</td>
                                        <td class="has-text-right" style={{ padding: "0" }}>
                                            {index == playlistSnippet.length - 1 ? "" : <CrossBtn
                                                onClick={() => {
                                                    //recalculate the correct index of the playlist
                                                    //index is the index of the playlistSnippet
                                                    //the index to remove is "flipped": instead of 0,1,2... it is ...2,1,0
                                                    props.audioSession.removeFromPlaylist(playlistSnippet.length - 1 - index);
                                                }} />}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <AudioControls audioSession={props.audioSession} />
            </div>
        </div>
    );
}