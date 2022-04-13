import { createSignal } from "solid-js";
import { AudioSession } from "../player/audio-session";
import DbScale from "./db-scale";

export default function EBUR128Meter(props: {
    audioSession: AudioSession;
}) {
    const [momentary, setMomentary] = createSignal(0);
    const [shortTerm, setShortTerm] = createSignal(0);

    const analyser = props.audioSession.getEBUR128AnalyserNode();
    analyser.onMomentaryLoudnessChange = loudness => {
        setMomentary(loudness);
    }
    analyser.onShortTermLoudnessChange = loudness => {
        setShortTerm(loudness);
    }

    return (
        <div>
            <div class="level mb-0">
                <div class="level-left">
                    Momentary
                    <span class="ml-2 has-text-weight-light is-size-7">(400ms)</span>
                </div>
                <div class="level-right">
                    LUFS
                </div>
            </div>
            <DbScale minDb={-50} maxDb={0} value={momentary()} />
            <div class="level mb-0 mt-2">
                <div class="level-left">
                    Short Term
                    <span class="ml-2 has-text-weight-light is-size-7">(3s)</span>
                </div>
                <div class="level-right">
                    LUFS
                </div>
            </div>
            <DbScale minDb={-50} maxDb={0} value={shortTerm()} />
        </div>
    );
}
