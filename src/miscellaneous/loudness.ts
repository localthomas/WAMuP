import { LoudnessAndRange } from "../components/loudness-graph-canvas";
import { runSingleWorker } from "./concurrent";
import { runMultipleWorkers } from "./parallel";

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

/** A type as input for a worker calculating the loudness of an array of frames. */
export type LoudnessOfAudioBufferWorkerInput = {
    frames: Frame[];
    frameSizeS: number;
    analysisWindowSizeS: number;
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
    const TIME_NAME = "loudnessOfAudioBuffer-" + Math.random().toString(36).substring(2, 10);
    console.time(TIME_NAME);
    // first convert the audio buffer into frames, to calculate values for each frame
    const frames = audioBufferIntoFrames(audio, frameSizeS, weighting);

    const input: LoudnessOfAudioBufferWorkerInput = {
        frames,
        frameSizeS,
        analysisWindowSizeS,
    };
    const result = await runSingleWorker<LoudnessOfAudioBufferWorkerInput, number[]>(input, new URL("../workers/loudness.worker.ts", import.meta.url));

    console.timeEnd(TIME_NAME);
    return result;
}

/** One frame holds PCM data for a specified amount of time. */
export type Frame = {
    /**
     * The raw PCM data per channel.
     */
    data: Float32Array[];
    /**
     * One weight value per channel.
     */
    weights: number[];
};

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

/** The power values of one frame. */
export type PowerOfFrame = {
    /**
     * The power values of each channel.
     */
    powers: number[];
    /**
     * One weight value per channel.
     */
    weights: number[];
};

/**
 * Calculates the power value per audio channel in this frame.
 * @param frame the frame with audio data
 * @returns the power value per channel
 */
export function powersPerChannelOfFrame(frame: Frame): PowerOfFrame {
    return {
        powers: frame.data.map(powerOfFrame),
        weights: frame.weights,
    };
}

/**
 * Creates a list of lists by combining multiple frames into one list, which is called an analysis window.
 * E.g. a list of 5 frames with each a length of 0.1s is combined into a list of 0.2s long analysis windows.
 * This results in a list of 5 windows, where each window has a 2 values in it.
 * Note that this means some values are stored in double
 * (e.g. in the first window there is one value which overlaps with the second window).
 *
 * From the example above: `[0, 1, 2, 3, 4]` becomes `[[0, 1], [1, 2], [2, 3], [3, 4], [4]]`.
 * @param frames the frames (values) which will be combined
 * @param frameSizeS how big one frame is in seconds
 * @param analysisWindowSizeS the size of one window in seconds (should be greater than frame size)
 * @returns a list of lists where the first index is the analysis window and the second is the index of the value within this window
 */
export function combineValuesIntoAnalysisWindows<T>(frames: T[], frameSizeS: number, analysisWindowSizeS: number): T[][] {
    console.assert(analysisWindowSizeS >= frameSizeS);
    /** the list of all windows; has the same length as the input parameter `frames` */
    let allWindows = [];
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
        /** the number of frames per window */
        const numFrames = Math.round(analysisWindowSizeS / frameSizeS);
        /** a list where all items for one window are stored */
        const windowItems = frames.slice(frameIndex, frameIndex + numFrames);
        allWindows.push(windowItems);
    }
    return allWindows;
}

/**
 * Calculate a loudness value for an analysis window with multiple frames and weighting.
 * @param window the window with frames
 * @returns the loudness value of all power values of the window
 */
export function loudnessOfAnalysisWindow(window: PowerOfFrame[]): number {
    const numberOfChannels = window[0].powers.length;
    /**
     * a list of power values,
     * where the first index is the channel and the second is the frame within the window
     */
    let powers: number[][] = [];
    for (let channel = 0; channel < numberOfChannels; channel++) {
        let powersPerChannel: number[] = [];
        for (const frame of window) {
            powersPerChannel = powersPerChannel.concat(frame.powers[channel]);
        }
        powers.push(powersPerChannel);
    }
    return loudnessOfPowers(powers, window[0].weights);
}

function powerOfFrame(data: Float32Array): number {
    let sum = 0;
    for (const value of data) {
        sum += value * value;
    }
    return sum / data.length;
}

/**
 * Convert a list of power values into an aggregated loudness value with weighting.
 * @param powers a list with the first index being the channel and the second the frame index
 * @param weights weights per channel
 * @returns the loudness value
 */
function loudnessOfPowers(powers: number[][], weights: number[]): number {
    console.assert(powers.length === weights.length);
    let sum = 0;
    for (const [channel, powersSet] of powers.entries()) {
        const weight = weights[channel];
        let usedFrames = 0;
        let tmpSum = 0;
        for (const [_, power] of powersSet.entries()) {
            usedFrames++;
            tmpSum += power;
        }
        sum += weight * (tmpSum / usedFrames);
    }
    return do10log10(sum);
}

function do10log10(value: number): number {
    return -0.691 + (10 * Math.log10(value));
}

function undo10log10(value: number): number {
    return Math.pow(10, ((value + 0.691) / 10))
}
