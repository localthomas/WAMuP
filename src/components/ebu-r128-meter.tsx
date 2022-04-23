import { createSignal } from "solid-js";
import { ReactiveAudioSession } from "../player/reactive-audio-session";
import DbScale from "./db-scale";

export default function EBUR128Meter(props: {
    audioSession: ReactiveAudioSession;
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
            <DbScale
                label={{
                    left: <>Momentary <small>(400ms)</small></>,
                    right: <>LUFS</>,
                }}
                minDb={-50}
                maxDb={0}
                value={momentary()}
            />
            <DbScale
                label={{
                    left: <>Short Term <small>(3s)</small></>,
                    right: <>LUFS</>,
                }}
                minDb={-50}
                maxDb={0}
                value={shortTerm()}
            />
        </div>
    );
}
