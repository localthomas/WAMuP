import { LoudnessAndRange } from "../components/loudness-graph-canvas";

/**
 * Analyzes the given audio data and calculates the loudness-range based on the algorithm presented in EBU Tech 3342.
 * Note: This function is not equal to the presented MatLab-Function "LoudnessRange". Instead it uses raw audio data.
 * @param audio the audioBuffer to analyze
 */
export function getLoudnessRange(audio: AudioBuffer): number {
    const shortLoudness = shortTermLoudness(audio);

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
export function getIntegratedLoudness(audio: AudioBuffer): number {
    const frames = framesOf100ms(audio);

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
function shortTermLoudness(audio: AudioBuffer): number[] {
    // equals a sampling rate of short term loudness of 10Hz as per EBU Tech 3342
    const FRAME_SIZE_S = 0.1;
    // the length of the window in seconds to be used for calculating the short term loudness
    const ANALYSIS_WINDOW_SIZE_S = 3;
    // use a weighting of 1 for each channel
    const weighting = () => 1;

    return loudnessOfAudioBuffer(audio, FRAME_SIZE_S, ANALYSIS_WINDOW_SIZE_S, weighting);
}

/**
 * Creates a list of short-term loudness values (3s window) of the raw audio data.
 * The range per loudness value is the mean in the 3s window against the peak loudness in this window.
 * The sub-sampling size is 100ms.
 * Note: No windows are discarded, which means even the first 100ms get a value,
 * although the analysis window was only 100ms.
 * Note: The range value always uses the last 3 seconds as the analyzing window.
 * @param audio the audio buffer to use as raw audio source
 * @param loudnessWindowSize the window-size in seconds of the loudness values
 */
export function getShortTermLoudnessWithRange(audio: AudioBuffer, loudnessWindowSize: number): LoudnessAndRange[] {
    // use 30 100ms frames to calculate short term loudness
    const ANALYSIS_WINDOW_SIZE = 30;

    const frames = framesOf100ms(audio);

    let windows = [];

    for (let i = 0; i < frames.length; i++) {
        // loudness range analysis with fixed window length
        const start = i - ANALYSIS_WINDOW_SIZE;
        const range = loudnessRangeOfWindow(frames.slice(start >= 0 ? start : 0, i));

        // the actual loudness analysis window size in number of frames
        const loudnessWindowSizeNum = loudnessWindowSize / 0.1;
        const start2 = i - loudnessWindowSizeNum;
        const loudness = loudnessOfWindow(frames.slice(start2 >= 0 ? start2 : 0, i));
        windows.push({
            loudness,
            range
        })
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
function framesOf100ms(audio: AudioBuffer): number[] {
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
 * @param analysisWindowSizeS the window size of the analysed values in seconds
 * @param weighting the channel weighting used in the calculation
 */
function loudnessOfAudioBuffer(audio: AudioBuffer, frameSizeS: number, analysisWindowSizeS: number, weighting: (channel: number) => number): number[] {
    // generate the powers (per channel, per frame)
    let powers = [];
    for (let channel = 0; channel < audio.numberOfChannels; channel++) {
        let powersOfChannel = [];
        const audioDataOfChannel = audio.getChannelData(channel);
        // the number of samples per frame
        const frameSizeNumSamples = frameSizeS * audio.sampleRate;
        let index = 0;
        do {
            powersOfChannel.push(powerOfFrame(audioDataOfChannel.slice(index, index + frameSizeNumSamples)));
            index += frameSizeNumSamples;
        } while (index < audioDataOfChannel.length)
        powers.push(powersOfChannel);
    }

    // generate a list of all loudness values
    let loudness = [];

    for (let i = 0; i < powers[0].length; i++) {
        const numFrames = Math.round(analysisWindowSizeS / frameSizeS);
        let tmpPowers = [];
        for (const [_channel, powersSet] of powers.entries()) {
            tmpPowers.push(powersSet.slice(i, i + numFrames));
        }
        loudness.push(loudnessOfPowers(tmpPowers, weighting));
    }

    return loudness;
}

function powerOfFrame(data: Float32Array): number {
    let sum = 0;
    for (const value of data) {
        sum += value * value;
    }
    return sum / data.length;
}

function loudnessOfPowers(powers: number[][], weighting: (channel: number) => number): number {
    let sum = 0;
    for (const [channel, powersSet] of powers.entries()) {
        const weight = weighting(channel);
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
