import { LoudnessAndRange } from "../components/loudness-graph-canvas";
import { AsyncArray, AsyncGeneratorFixedLength, yieldBackToMainThread } from "./concurrent-processing";
import { combineValuesIntoAnalysisWindows, do10log10, loudnessOfAnalysisWindow, PowerOfFrame, undo10log10 } from "./loudness-calculations";
import { RingBuffer } from "./ring-buffer";

/**
 * Analyzes the given audio data and calculates the loudness-range based on the algorithm presented in EBU Tech 3342.
 * Note: This function is not equal to the presented MatLab-Function "LoudnessRange". Instead it uses raw audio data.
 * @param frames is a generator of all 100ms loudness frames
 */
export async function getLoudnessRange(frames: AsyncArray<PowerOfFrame>): Promise<number> {
    // shortLoudness converts an async generator into a normal list
    let shortLoudness = [];
    for await (const frame of await shortTermLoudness(frames)) {
        shortLoudness.push(frame);
    }

    const ABS_THRESHOLD = -70; // LUFS (= absolute measure)
    const REL_THRESHOLD = -20; // LU   (= relative measure)
    const PRC_LOW = 0.10; // lower percentile
    const PRC_HIGH = 0.95; // upper percentile

    // absolute-threshold gating
    const shortLoudnessAbsGated = shortLoudness.filter(loudness => loudness >= ABS_THRESHOLD);

    // relative-threshold gating
    let n = shortLoudnessAbsGated.length;
    // undo 10log10, and calculate mean
    // reduce is used for calculating a sum
    const stlPower = shortLoudnessAbsGated.reduce((acc, value) => acc + undo10log10(value), 0) / n;
    const stlIntegrated = do10log10(stlPower); // stlIntegrated: LUFS
    // only include loudness levels above relative threshold
    const shortLoudnessRelGated = shortLoudnessAbsGated.filter(loudness => loudness >= stlIntegrated + REL_THRESHOLD);

    // Compute the high and low percentiles of the distribution of values in filtered loudness values
    n = shortLoudnessRelGated.length;
    // sort ascending
    const shortLoudnessSorted = shortLoudnessRelGated.sort((a, b) => a - b);

    const stlPrcLow = shortLoudnessSorted[Math.round((n - 1) * PRC_LOW + 1)];
    const stlPrcHigh = shortLoudnessSorted[Math.round((n - 1) * PRC_HIGH + 1)];

    return stlPrcHigh - stlPrcLow;
}

/**
 * Analyzes the given audio data and calculates the integrated loudness as per ITU-R BS.1770-4.
 * @param frames is a generator of all 100ms loudness frames
 */
export async function getIntegratedLoudness(frames: AsyncArray<PowerOfFrame>): Promise<number> {
    // framesList converts the async generator into a normal list
    let framesList = [];
    for await (const frame of await frames100msToLoudness(frames, 0.1)) {
        framesList.push(frame);
    }

    // filter the blocks as per ITU-R BS.1770-4 with 75% overlap (3 frames with 100ms frames)
    const numFramesOfOneGatingBlock = 4;
    const step = 1; // step is 1: 75% overlap with 100ms blocks and a target of 400ms gating block size
    let loudness = [];
    for (let i = 0; i < framesList.length - numFramesOfOneGatingBlock; i += step) {
        let sum = 0;
        for (let j = 0; j < numFramesOfOneGatingBlock; j++) {
            sum += framesList[i + j];
        }
        const mean = sum / numFramesOfOneGatingBlock;
        loudness.push(mean);
    }

    const ABS_THRESHOLD = -70; // LUFS (= absolute measure)
    const REL_THRESHOLD = -10; // LU   (= relative measure)

    // absolute-threshold gating
    const loudnessAbsGated = loudness.filter(loudness => loudness >= ABS_THRESHOLD);

    // relative-threshold gating
    let n = loudnessAbsGated.length;
    // undo 10log10, and calculate mean
    // reduce is used for calculating a sum
    const power = loudnessAbsGated.reduce((acc, value) => acc + undo10log10(value), 0) / n;
    const relativeThreshold = do10log10(power) + REL_THRESHOLD; // LUFS
    // only include loudness levels above relative threshold
    const loudnessRelGated = loudnessAbsGated.filter(loudness => loudness >= relativeThreshold);

    // mean of gated loudness
    n = loudnessRelGated.length;
    const integratedLoudness = loudnessRelGated.reduce((acc, value) => acc + undo10log10(value), 0) / n;

    return do10log10(integratedLoudness);
}

/**
 * Creates a list of short-term loudness values (3s window) of the raw audio data.
 * @param frames is a generator of all 100ms loudness frames
 */
async function shortTermLoudness(frames: AsyncArray<PowerOfFrame>): Promise<AsyncGenerator<number, void, void>> {
    // the length of the window in seconds to be used for calculating the short term loudness
    const ANALYSIS_WINDOW_SIZE_S = 3;

    return frames100msToLoudness(frames, ANALYSIS_WINDOW_SIZE_S);
}

/**
 * An extended async generator with an additional method.
 */
export type AsyncLoudnessAndRangeGenerator = AsyncGeneratorFixedLength<LoudnessAndRange, void, unknown>;

/**
 * Creates a list of short-term loudness values of the raw audio data.
 * The range per loudness value is the mean in the window against the peak loudness in this window.
 * Note: No windows are discarded, which means even the first frame gets a value,
 * although the analysis window might include multiple frames.
 * @param frames is a generator of all 100ms loudness frames
 * @param loudnessWindowSize the window-size in seconds of the loudness values
 */
export async function getShortTermLoudnessWithRange(frames: AsyncArray<PowerOfFrame>, loudnessWindowSize: number): Promise<AsyncLoudnessAndRangeGenerator> {
    // note that 0.1 is the frame size in seconds, which is always 100ms (see parameter `frames100ms`)
    const loudnessWindowSizeNum = Math.ceil(loudnessWindowSize / 0.1);

    // optimization: try to only analyze ~1000 windows (i.e. do not create a loudness range value for each frame that is available, but for around 1000 frames)
    const NUMBER_OF_ANALYSIS_WINDOWS = 1000;
    const iterationSteps = Math.max(1, Math.round(frames.getLength() / NUMBER_OF_ANALYSIS_WINDOWS));

    // estimate the number of LoudnessAndRange items that are generated
    const numberOfLoudnessAndRangeItems = Math.floor(frames.getLength() / iterationSteps);

    return {
        async*[Symbol.asyncIterator]() {
            let i = 0;
            let ringBuffer = new RingBuffer<number>(loudnessWindowSizeNum);
            for await (const frame of await frames100msToLoudness(frames, loudnessWindowSize)) {
                ringBuffer.push(frame);
                // simulate an iteration step of more than 1
                if (i % iterationSteps === 0) {
                    const frameSlice = ringBuffer.getList();

                    const range = loudnessRangeOfWindow(frameSlice);

                    const loudness = loudnessOfWindow(frameSlice);
                    yield {
                        loudness,
                        range
                    };
                }
                i++;
            }
        },
        getNumberOfTotalElements() {
            return numberOfLoudnessAndRangeItems;
        }
    };
}

/**
 * Use the loudness values of the window to calculate a loudness range.
 * That is the difference in LU between the average and the peak loudness.
 * @param window the analysis window with loudness values in LUFS
 */
function loudnessRangeOfWindow(window: number[]): number {
    let tmpSum = 0;
    let peak = -Infinity;
    for (const value of window) {
        tmpSum += value;
        if (peak < value) {
            peak = value;
        }
    }
    const avgLoudness = tmpSum / window.length;
    return peak - avgLoudness; // since peak and loudness are LUFS, use the difference as range
}

/**
 * Calculate the loudness (the average) of the given window.
 * @param window the analysis window with loudness values in LUFS
 */
function loudnessOfWindow(window: number[]): number {
    let tmpSum = 0;
    for (const value of window) {
        tmpSum += value;
    }
    return tmpSum / window.length;
}

async function* frames100msToLoudness(frames: AsyncArray<PowerOfFrame>, analysisWindowSizeS: number): AsyncGenerator<number, void, void> {
    /**
     * The list with all combined frame data per window.
     * The first index is the window and the second the index of the frame within the window.
     */
    const analysisWindows = await combineValuesIntoAnalysisWindows(frames, 0.1, analysisWindowSizeS);

    for await (const window of analysisWindows) {
        yield await loudnessOfAnalysisWindow(window);
        // take a break: yield back to the main thread via setTimeout
        await yieldBackToMainThread();
    }
}
