import { LoudnessAndRange } from "../components/loudness-graph-canvas";
import { runSingleWorker } from "./concurrent";
import { do10log10, Frame, LoudnessOfAudioBufferWorkerInput, undo10log10 } from "./loudness-calculations";

/**
 * Analyzes the given audio data and calculates the loudness-range based on the algorithm presented in EBU Tech 3342.
 * Note: This function is not equal to the presented MatLab-Function "LoudnessRange". Instead it uses raw audio data.
 * @param audio the audioBuffer to analyze
 */
export async function getLoudnessRange(audio: AudioBuffer): Promise<number> {
    const shortLoudness = await shortTermLoudness(audio);

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
 * @param audio the audio buffer to analyze
 */
export async function getIntegratedLoudness(audio: AudioBuffer): Promise<number> {
    const frames = await framesOf100ms(audio);

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
async function shortTermLoudness(audio: AudioBuffer): Promise<number[]> {
    // equals a sampling rate of short term loudness of 10Hz as per EBU Tech 3342
    const FRAME_SIZE_S = 0.1;
    // the length of the window in seconds to be used for calculating the short term loudness
    const ANALYSIS_WINDOW_SIZE_S = 3;
    // use a weighting of 1 for each channel
    const weighting = () => 1;

    return loudnessOfAudioBuffer(audio, FRAME_SIZE_S, ANALYSIS_WINDOW_SIZE_S, weighting);
}

/**
 * Creates a list of short-term loudness values of the raw audio data.
 * The range per loudness value is the mean in the window against the peak loudness in this window.
 * The sub-sampling size is dynamic and changes with the duration of the audio buffer.
 * Note: No windows are discarded, which means even the first frame gets a value,
 * although the analysis window might include multiple frames.
 * @param audio the audio buffer to use as raw audio source
 * @param loudnessWindowSize the window-size in seconds of the loudness values
 */
export async function getShortTermLoudnessWithRange(audio: AudioBuffer, loudnessWindowSize: number): Promise<LoudnessAndRange[]> {
    /**
     * The dynamic analysis frame size is either the same as the window analysis size or smaller,
     * if the duration is relatively short.
     * Then it is tuned to roughly equal 1000 frames for analysis.
     */
    const dynamicFrameSizeS = audio.duration / 1000;
    const frameSizeS = Math.min(loudnessWindowSize / 10, dynamicFrameSizeS);

    /** the actual loudness analysis window size in number of frames */
    const loudnessWindowSizeNum = Math.ceil(loudnessWindowSize / frameSizeS);

    const frames = await loudnessOfAudioBuffer(audio, frameSizeS, frameSizeS, () => 1);

    let windows = [];

    for (let i = 0; i < frames.length; i++) {
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

/**
 * Creates a list with frames of 100ms width of the raw audio data. No overlap is used for the loudness values.
 * Suitable for further processing of integrated loudness; the returned values are not gated.
 * @param audio the audio buffer to use as raw audio source
 */
async function framesOf100ms(audio: AudioBuffer): Promise<number[]> {
    // create 100ms blocks with loudness values by using the same values
    const FRAME_SIZE_S = 0.1;
    const ANALYSIS_WINDOW_SIZE_S = FRAME_SIZE_S;
    // use a weighting of 1 for each channel
    const weighting = () => 1;

    return loudnessOfAudioBuffer(audio, FRAME_SIZE_S, ANALYSIS_WINDOW_SIZE_S, weighting);
}

/**
 * Calculates a list of loudness values with a specified frame size (each value in the returned list is
 * apart from the next value by this size) and analysis window (each value in a frame was calculated by
 * using the values of the analysis-window size before it)
 * @param audio the audio data to use
 * @param frameSizeS the size of the frames that are returned in seconds
 * @param analysisWindowSizeS the window size of the analyzed values in seconds
 * @param weighting the channel weighting used in the calculation
 */
async function loudnessOfAudioBuffer(audio: AudioBuffer, frameSizeS: number, analysisWindowSizeS: number, weighting: (channel: number) => number): Promise<number[]> {
    // first convert the audio buffer into frames, to calculate values for each frame
    const frames = audioBufferIntoFrames(audio, frameSizeS, weighting);

    const input: LoudnessOfAudioBufferWorkerInput = {
        frames,
        frameSizeS,
        analysisWindowSizeS,
    };
    const result = await runSingleWorker<LoudnessOfAudioBufferWorkerInput, number[]>(input, new URL("../workers/loudness.worker.ts", import.meta.url));
    return result;
}

/**
 * Convert an audio buffer into a list of frames by slicing the underlying audio data.
 * @param audioBuffer the audio buffer which holds the PCM data
 * @param frameSizeS the length of one frame in seconds (the last frame might be shorter)
 * @param weighting a function for generating weights per channel (cached for each frame)
 * @returns a list of frames
 */
function audioBufferIntoFrames(audioBuffer: AudioBuffer, frameSizeS: number, weighting: (channel: number) => number): Frame[] {
    /** the number of samples per frame */
    const frameSizeNumSamples = frameSizeS * audioBuffer.sampleRate;
    /** the weights per channel */
    let weights = [];
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        weights.push(weighting(channel));
    }

    // transform multiple audio data tracks (i.e. multiple channels) into frames
    let frames = [];
    let index = 0;
    const numberOfSamplesInTotal = audioBuffer.getChannelData(0).length;
    do {
        let data = [];
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const audioDataOfChannel = audioBuffer.getChannelData(channel);
            const frameSection = audioDataOfChannel.slice(index, index + frameSizeNumSamples);
            data.push(frameSection);
        }
        frames.push({
            data,
            weights,
        });

        index += frameSizeNumSamples;
    } while (index < numberOfSamplesInTotal)

    return frames;
}
