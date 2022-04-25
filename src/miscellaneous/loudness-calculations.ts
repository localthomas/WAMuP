// Note that this module does not import anything that might use import.meta.
// This means it is safe to import in WebWorkers.

/** A type as input for a worker calculating the loudness of an array of frames. */
export type LoudnessOfAudioBufferWorkerInput = {
    frames: Frame[];
    frameSizeS: number;
    analysisWindowSizeS: number;
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

export function do10log10(value: number): number {
    return -0.691 + (10 * Math.log10(value));
}

export function undo10log10(value: number): number {
    return Math.pow(10, ((value + 0.691) / 10))
}
