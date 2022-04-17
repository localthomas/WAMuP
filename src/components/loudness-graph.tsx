import { Accessor, createMemo, createResource, createSignal } from "solid-js";
import { BackendStore } from "../backend/backend";
import { getAudioBufferFromBlobWithEBUR128Filter } from "../miscellaneous/audio";
import { getIntegratedLoudness, getLoudnessRange, getShortTermLoudnessWithRange } from "../miscellaneous/loudness";
import { AudioPlayerState } from "../player/audio-player";
import LoadingSpinnerSmall from "./loading-spinner-small";
import LoudnessGraphCanvas, { GRAPH_GREEN_LOUDNESS_RANGE, GRAPH_MINIMAL_LOUDNESS } from "./loudness-graph-canvas";

export default function LoudnessGraph(props: {
    backend: BackendStore;
    audioState: Accessor<AudioPlayerState>;
    onWantsToSeek: (to: number) => void;
}) {
    const DEFAULT_LOUDNESS_WINDOW_SIZE_S = 1; // seconds
    const [shortTermLoudnessMapWindowSizeTarget, setShortTermLoudnessMapWindowSizeTarget] = createSignal(DEFAULT_LOUDNESS_WINDOW_SIZE_S);

    // cache the current asset, i.e. the signal only triggers, if the value actually changed
    const currentAsset = createMemo(() => props.audioState().assetID);

    // the audioBuffer for the current asset
    const [audioBufferForCurrentAsset] = createResource(currentAsset, async (newAsset: string) => {
        const asset = props.backend.get(newAsset);
        if (asset) {
            return await getAudioBufferFromBlobWithEBUR128Filter(asset.file);
        }
    });

    const loudnessRange = createMemo(() => {
        if (audioBufferForCurrentAsset.loading) {
            return "loading";
        }
        const audioBuffer = audioBufferForCurrentAsset();
        if (audioBuffer) {
            return getLoudnessRange(audioBuffer);
        } else {
            return NaN;
        }
    });

    const integratedLoudness = createMemo(() => {
        if (audioBufferForCurrentAsset.loading) {
            return "loading";
        }
        const audioBuffer = audioBufferForCurrentAsset();
        if (audioBuffer) {
            return getIntegratedLoudness(audioBuffer);
        } else {
            return NaN;
        }
    });

    const shortTermLoudnessMap = createMemo(() => {
        if (audioBufferForCurrentAsset.loading) {
            return "loading";
        }
        const audioBuffer = audioBufferForCurrentAsset();
        if (audioBuffer) {
            return getShortTermLoudnessWithRange(audioBuffer, shortTermLoudnessMapWindowSizeTarget());
        } else {
            return [];
        }
    });

    const integratedLoudnessBody = createMemo(() => {
        const integratedLoudnessValue = integratedLoudness();
        if (integratedLoudnessValue === "loading") {
            return <LoadingSpinnerSmall />;
        } else {
            return <>{integratedLoudnessValue.toFixed(1)}</>;
        }
    });

    const loudnessRangeBody = createMemo(() => {
        const loudnessRangeValue = loudnessRange();
        if (loudnessRangeValue === "loading") {
            return <LoadingSpinnerSmall />;
        } else {
            return <>{loudnessRangeValue.toFixed(1)}</>;
        }
    });

    return (
        <div class="mb-0 mt-2">
            <div class="level">
                <div class="level-left">
                    <table>
                        <tbody>
                            <tr>
                                <td>Integrated Loudness:&nbsp;</td>
                                <td>{integratedLoudnessBody} LUFS</td>
                            </tr>
                            <tr>
                                <td>Integrated Loudness Range:&nbsp;</td>
                                <td>{loudnessRangeBody} LU</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="level-right has-text-right" style={{
                    "flexShrink": "1"
                }}>
                    <div>
                        y-axis: loudness in {shortTermLoudnessMapWindowSizeTarget()}s window [{GRAPH_MINIMAL_LOUDNESS}; 0] [LUFS]
                        <br></br>
                        color: loudness range [LU] in 3s analysis window [0: red; {GRAPH_GREEN_LOUDNESS_RANGE}: green]
                    </div>
                </div>
            </div>
            <LoudnessGraphCanvas {...props}
                loudnessFrames={shortTermLoudnessMap()}
                analysisWindowSizeS={shortTermLoudnessMapWindowSizeTarget} />
            <div>
                <input type="range" min="0.1" max="3" step="0.1" value={shortTermLoudnessMapWindowSizeTarget()}
                    onChange={event => {
                        setShortTermLoudnessMapWindowSizeTarget(parseFloat(event.currentTarget.value));
                    }}
                    onDblClick={() => {
                        setShortTermLoudnessMapWindowSizeTarget(DEFAULT_LOUDNESS_WINDOW_SIZE_S);
                    }} />
                <label class="ml-2">loudness analysis window size ({shortTermLoudnessMapWindowSizeTarget()}s)</label>
            </div>
        </div>
    );
}
