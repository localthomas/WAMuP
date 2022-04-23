import { BackendStore } from "../backend/backend";
import { AssetDetailed } from "../components/asset-detailed";
import EBUR128Meter from "../components/ebu-r128-meter";
import LoudnessGraph from "../components/loudness-graph";
import Spectrum from "../components/spectrum";
import ReactiveAudioSession from "../player/reactive-audio-session";

export default function Visualizer(props: {
    backend: BackendStore;
    audioSession: ReactiveAudioSession;
}) {
    return (
        <div class="container">
            {props.audioSession.getAudioState()().assetID ?
                <div>
                    <AssetDetailed backend={props.backend} assetID={props.audioSession.getAudioState()().assetID} />
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
                audioState={props.audioSession.getAudioState()}
                onWantsToSeek={(newTime) => {
                    props.audioSession.setNewPlayerState(() => { return { currentTime: newTime } });
                }} />
        </div>
    );
}
