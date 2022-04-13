import { createSignal } from "solid-js";
import { BackendStore } from "../backend/backend";
import { AssetDetailed } from "../components/asset-detailed";
import EBUR128Meter from "../components/ebu-r128-meter";
import LoudnessGraph from "../components/loudness-graph";
import Spectrum from "../components/spectrum";
import { AudioPlayerState } from "../player/audio-player";
import { AudioSession } from "../player/audio-session";

export default function Visualizer(props: {
    backend: BackendStore;
    audioSession: AudioSession;
}) {
    const [audioState, setAudioState] = createSignal<AudioPlayerState>({
        assetID: "",
        isPlaying: false,
        currentTime: 0,
        duration: 0,
    });
    props.audioSession.addOnStateChangeListener((newState) => setAudioState(newState));


    return (
        <div class="container">
            {audioState().assetID ?
                <div>
                    <AssetDetailed backend={props.backend} assetID={audioState().assetID} />
                    <hr />
                </div>
                :
                ""}
            <h1 class="title">Spectrum</h1>
            <Spectrum audioSession={props.audioSession} />
            <hr />
            <h1 class="title">Loudness</h1>
            <EBUR128Meter audioSession={props.audioSession} />
            <LoudnessGraph
                backend={props.backend}
                audioState={audioState}
                onWantsToSeek={(newTime) => {
                    props.audioSession.setNewPlayerState({ currentTime: newTime });
                }} />
        </div>
    );
}
