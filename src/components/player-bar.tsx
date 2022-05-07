import { Link } from "solid-app-router";
import { createMemo } from "solid-js";
import { BackendStore } from "../backend/backend";
import { Metadata } from "../backend/metadata";
import ReactiveAudioSession from "../player/reactive-audio-session";
import { AudioControls } from "./audio-controls";
import { CrossBtn } from "./icon-btns";

export default function PlayerBar(props: {
    backend: BackendStore;
    audioSession: ReactiveAudioSession;
}) {
    type MetadataWithPlaylistIndex = {
        metadata: Metadata;
        index: number;
    };

    /** The maximum amount of items of the future playlist including the current playing asset. */
    const maxDisplayedPlaylist = 3;
    const playlistSnippet = createMemo(() => {
        return props.audioSession.getQueue()()
            // get the first x elements of the playlist
            .slice(0, maxDisplayedPlaylist)
            // instead of plain asset IDs, map these to their corresponding metadata
            .map((assetID, index): MetadataWithPlaylistIndex => {
                const metadata = props.backend.mustGet(assetID).metadata;
                return {
                    index,
                    metadata,
                };
            })
            // reverse the list, as it is displayed "upside down" on the table below
            .reverse();
    });

    const playlistLength = createMemo(() => props.audioSession.getQueue()().length);

    return (
        <footer>
            <div class="container">
                {playlistLength() > maxDisplayedPlaylist ?
                    <p>
                        <Link href="/queue">
                            {playlistLength() - maxDisplayedPlaylist} more...
                        </Link>
                    </p>
                    :
                    ""}
                <table>
                    <tbody>
                        {playlistSnippet().map((info, index) =>
                            <tr class={index === playlistSnippet().length - 1 ? "active-row" : ""}>
                                <td>{info.metadata.title}</td>
                                <td>{info.metadata.artist}</td>
                                <td class="fixed-width">
                                    <CrossBtn
                                        hidden={index === playlistSnippet().length - 1}
                                        small
                                        onClick={() => {
                                            props.audioSession.removeFromPlaylist(info.index);
                                        }} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <AudioControls audioSession={props.audioSession} />
            </div>
        </footer>
    );
}
