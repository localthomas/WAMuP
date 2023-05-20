import { Accessor, createEffect, createMemo, createResource, createSignal } from "solid-js";
import { BackendStore } from "../backend/backend";
import { getLoudnessInformationOfFile } from "../miscellaneous/audio";
import { AsyncArray, asyncGeneratorToArray } from "../miscellaneous/concurrent-processing";
import { getIntegratedLoudness, getLoudnessRange, getShortTermLoudnessWithRange } from "../miscellaneous/loudness";
import { AudioPlayerState } from "../player/audio-player";
import LoadingSpinnerSmall from "./loading-spinner-small";
import LoudnessGraphCanvas, { GRAPH_GREEN_LOUDNESS_RANGE, GRAPH_MINIMAL_LOUDNESS, LoudnessAndRange } from "./loudness-graph-canvas";

export default function LoudnessGraph(props: {
    backend: BackendStore;
    audioState: Accessor<AudioPlayerState>;
    onWantsToSeek: (to: number) => void;
}) {
    const DEFAULT_LOUDNESS_WINDOW_SIZE_S = 2.5; // seconds
    const [shortTermLoudnessMapWindowSizeTarget, setShortTermLoudnessMapWindowSizeTarget] = createSignal(DEFAULT_LOUDNESS_WINDOW_SIZE_S);

    // cache the current asset, i.e. the signal only triggers, if the value actually changed
    const currentAsset = createMemo(() => props.audioState().assetID);

    // the audioBuffer for the current asset
    const [audioBufferForCurrentAsset] = createResource(currentAsset, async (newAsset: string) => {
        const asset = props.backend.get(newAsset);
        if (asset) {
            const generator = await getLoudnessInformationOfFile(asset.file);
            return new AsyncArray(generator);
        }
    });

    const [loudnessRange, setLoudnessRange] = createSignal<number | "loading">(NaN);
    createEffect(async () => {
        if (audioBufferForCurrentAsset.loading) {
            setLoudnessRange("loading");
        } else {
            const audioBuffer = audioBufferForCurrentAsset();
            if (audioBuffer) {
                setLoudnessRange("loading");
                setLoudnessRange(await getLoudnessRange(audioBuffer));
            } else {
                setLoudnessRange(NaN);
            }
        }
    });

    const [integratedLoudness, setIntegratedLoudness] = createSignal<number | "loading">(NaN);
    createEffect(async () => {
        if (audioBufferForCurrentAsset.loading) {
            setIntegratedLoudness("loading");
        } else {
            const audioBuffer = audioBufferForCurrentAsset();
            if (audioBuffer) {
                setIntegratedLoudness("loading");
                setIntegratedLoudness(await getIntegratedLoudness(audioBuffer));
            } else {
                setIntegratedLoudness(NaN);
            }
        }
    });

    const [shortTermLoudnessMap, setShortTermLoudnessMap] = createSignal<"loading" | LoudnessAndRange[]>([]);
    createEffect(async () => {
        if (audioBufferForCurrentAsset.loading) {
            setShortTermLoudnessMap("loading");
        } else {
            const audioBuffer = audioBufferForCurrentAsset();
            if (audioBuffer) {
                setShortTermLoudnessMap("loading");
                const generator = await getShortTermLoudnessWithRange(audioBuffer, shortTermLoudnessMapWindowSizeTarget());
                asyncGeneratorToArray(generator, { loudness: Number.NEGATIVE_INFINITY, range: 0 }, setShortTermLoudnessMap);
            } else {
                setShortTermLoudnessMap([]);
            }
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
        <div class="loudness-graph">
            <div class="loudness-graph-label">
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
                <table class="text-right">
                    <tbody>
                        <tr>
                            <td>y-axis: loudness in {shortTermLoudnessMapWindowSizeTarget()}s window [{GRAPH_MINIMAL_LOUDNESS}; 0] [LUFS]</td>
                        </tr>
                        <tr>
                            <td>color: loudness range [LU] in {shortTermLoudnessMapWindowSizeTarget()}s analysis window [0: red; {GRAPH_GREEN_LOUDNESS_RANGE}: green]</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <LoudnessGraphCanvas {...props}
                loudnessFrames={shortTermLoudnessMap()}
                analysisWindowSizeS={shortTermLoudnessMapWindowSizeTarget} />
            <fieldset>
                <legend>Loudness analysis window size ({shortTermLoudnessMapWindowSizeTarget()}s)</legend>
                <input type="range" min="0.1" max="5" step="0.1" value={shortTermLoudnessMapWindowSizeTarget()}
                    onChange={event => {
                        setShortTermLoudnessMapWindowSizeTarget(parseFloat(event.currentTarget.value));
                    }}
                    onDblClick={() => {
                        setShortTermLoudnessMapWindowSizeTarget(DEFAULT_LOUDNESS_WINDOW_SIZE_S);
                    }} />
            </fieldset>
        </div>
    );
}
