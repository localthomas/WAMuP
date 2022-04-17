import deepEqual from "deep-equal";
import { Accessor, createEffect, createMemo, createSignal } from "solid-js";
import { BackendStore } from "../backend/backend";
import { getAudioBufferFromBlobWithEBUR128Filter } from "../miscellaneous/audio";
import { integratedLoudness, loudnessRange, shortTermLoudnessWithRange } from "../miscellaneous/loudness";
import { AudioPlayerState } from "../player/audio-player";
import LoadingSpinnerSmall from "./loading-spinner-small";
import LoudnessGraphCanvas, { GRAPH_GREEN_LOUDNESS_RANGE, GRAPH_MINIMAL_LOUDNESS, LoudnessAndRange } from "./loudness-graph-canvas";

export default function LoudnessGraph(props: {
    backend: BackendStore;
    audioState: Accessor<AudioPlayerState>;
    onWantsToSeek: (to: number) => void;
}) {
    const DEFAULT_LOUDNESS_WINDOW_SIZE_S = 1; // seconds
    const [shortTermLoudnessMapWindowSizeTarget, setShortTermLoudnessMapWindowSizeTarget] = createSignal(DEFAULT_LOUDNESS_WINDOW_SIZE_S);

    // the loudnessState holds the calculation results for a specific asset
    const [loudnessState, setLoudnessState] = createSignal<{
        createdWith: {
            assetID: string;
            shortTermLoudnessMapWindowSize: number;
        },
        loudnessRange: number;
        integrated: number;
        shortTermLoudnessMap: LoudnessAndRange[];
    }>({
        createdWith: {
            assetID: "",
            shortTermLoudnessMapWindowSize: shortTermLoudnessMapWindowSizeTarget(),
        },
        loudnessRange: NaN,
        integrated: NaN,
        shortTermLoudnessMap: [],
    });
    function calculateLoudnessState(songBuffer: AudioBuffer, shortTermLoudnessMapWindowSize: number) {
        let lra = loudnessRange(songBuffer);
        setLoudnessState({
            ...loudnessState(),
            loudnessRange: lra,
        });

        let integrated = integratedLoudness(songBuffer);
        setLoudnessState({
            ...loudnessState(),
            integrated: integrated,
        });

        let stl = shortTermLoudnessWithRange(songBuffer, shortTermLoudnessMapWindowSize);
        setLoudnessState({
            ...loudnessState(),
            shortTermLoudnessMap: stl,
        });
    }

    // populate the songBuffer when the loaded asset changes
    createEffect(async () => {
        const creationParameters = {
            assetID: props.audioState().assetID,
            shortTermLoudnessMapWindowSize: shortTermLoudnessMapWindowSizeTarget(),
        };
        // only re-create if the buffer or shortTermLoudnessMapWindowSize changed
        if (!deepEqual(creationParameters, loudnessState().createdWith)) {
            const asset = props.backend.get(creationParameters.assetID);
            if (asset) {
                // reset values before analyzing the asset
                setLoudnessState({
                    createdWith: creationParameters,
                    loudnessRange: NaN,
                    integrated: NaN,
                    shortTermLoudnessMap: [],
                });

                const audioBuffer = await getAudioBufferFromBlobWithEBUR128Filter(asset.file);
                // re-calculate the loudnessState, if the songBuffer changes
                calculateLoudnessState(audioBuffer, creationParameters.shortTermLoudnessMapWindowSize);
            }
        }
    });

    const integratedLoudnessBody = createMemo(() =>
        Number.isNaN(loudnessState().integrated) ?
            <LoadingSpinnerSmall /> : loudnessState().integrated.toFixed(1)
    );

    const loudnessRangeBody = createMemo(() =>
        Number.isNaN(loudnessState().loudnessRange) ?
            <LoadingSpinnerSmall /> : loudnessState().loudnessRange.toFixed(1)
    );

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
                loudnessFrames={loudnessState().shortTermLoudnessMap}
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
