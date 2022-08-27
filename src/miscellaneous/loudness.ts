import { LoudnessAndRange } from "../components/loudness-graph-canvas";
import { combineValuesIntoAnalysisWindows, do10log10, loudnessOfAnalysisWindow, PowerOfFrame, undo10log10 } from "./loudness-calculations";

/**
 * Analyzes the given audio data and calculates the loudness-range based on the algorithm presented in EBU Tech 3342.
 * Note: This function is not equal to the presented MatLab-Function "LoudnessRange". Instead it uses raw audio data.
 * @param frames100ms a list of all 100ms loudness frames
 */
export async function getLoudnessRange(frames100ms: PowerOfFrame[]): Promise<number> {
    const shortLoudness = await shortTermLoudness(frames100ms);

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
 * @param frames100ms a list of all 100ms loudness frames
 */
export async function getIntegratedLoudness(frames100ms: PowerOfFrame[]): Promise<number> {
    const frames = frames100msToLoudness(frames100ms, 0.1);

    // filter the blocks as per ITU-R BS.1770-4 with 75% overlap (3 frames with 100ms frames)
    const numFramesOfOneGatingBlock = 4;
    const step = 1; // step is 1: 75% overlap with 100ms blocks and a target of 400ms gating block size
    let loudness = [];
    for (let i = 0; i < frames.length - numFramesOfOneGatingBlock; i += step) {
        let sum = 0;
        for (let j = 0; j < numFramesOfOneGatingBlock; j++) {
            sum += frames[i + j];
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
 * @param audio the audio buffer to use as raw audio source
 */
async function shortTermLoudness(frames100ms: PowerOfFrame[]): Promise<number[]> {
    // the length of the window in seconds to be used for calculating the short term loudness
    const ANALYSIS_WINDOW_SIZE_S = 3;

    return frames100msToLoudness(frames100ms, ANALYSIS_WINDOW_SIZE_S);
}

/**
 * Creates a list of short-term loudness values of the raw audio data.
 * The range per loudness value is the mean in the window against the peak loudness in this window.
 * Note: No windows are discarded, which means even the first frame gets a value,
 * although the analysis window might include multiple frames.
 * @param frames100ms a list of all 100ms loudness frames
 * @param loudnessWindowSize the window-size in seconds of the loudness values
 */
export async function getShortTermLoudnessWithRange(frames100ms: PowerOfFrame[], loudnessWindowSize: number): Promise<LoudnessAndRange[]> {
    // note that 0.1 is the frame size in seconds, which is always 100ms (see parameter `frames100ms`)
    const loudnessWindowSizeNum = Math.ceil(loudnessWindowSize / 0.1);
    const frames = frames100msToLoudness(frames100ms, loudnessWindowSize);

    // optimization: try to only analyze ~1000 windows (i.e. do not create a loudness range value for each frame that is available, but for around 1000 frames)
    const NUMBER_OF_ANALYSIS_WINDOWS = 1000;
    const iterationSteps = Math.max(1, Math.round(frames.length / NUMBER_OF_ANALYSIS_WINDOWS));

    let windows = [];

    for (let i = 0; i < frames.length; i += iterationSteps) {
        // use a start and end index that are before i
        const start = Math.max(0, i - loudnessWindowSizeNum);
        const frameSlice = frames.slice(start, i);

        const range = loudnessRangeOfWindow(frameSlice);

        const loudness = loudnessOfWindow(frameSlice);
        windows.push({
            loudness,
            range
        });
    }

    return windows;
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

function frames100msToLoudness(frames100ms: PowerOfFrame[], analysisWindowSizeS: number): number[] {
    /**
     * The list with all combined frame data per window.
     * The first index is the window and the second the index of the frame within the window.
     */
    const analysisWindows = combineValuesIntoAnalysisWindows(frames100ms, 0.1, analysisWindowSizeS);

    /** a list of loudness values per analysis window */
    return analysisWindows.map(loudnessOfAnalysisWindow);
}
