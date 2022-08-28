/** Defines an array of powers per audio channel. The first index is the channel. */
export type PowersOfWindow = number[][];

export class ProcessingBuffer {
    private frameSamples: number;
    private numFrames: number;
    private rawBuffer: Float32RingBuffer[] = [];
    /** the calculated power values for each frame and each channel */
    private powerResults: PowersOfWindow = [];
    private onPowerCallback: (powers: PowersOfWindow) => void;
    private initCalled = false;
    /** power data for a callback invocation in the future */
    private powerResultsForCallback: PowersOfWindow[] = [];

    /**
     * Creates a new ProcessingBuffer.
     * @param sampleRate the sample rate of the audio data in Hz
     * @param frameSizeS the frame size to use in seconds
     * @param numFrames the number of frames inside one window of analysis
     * @param onPowerCallback the callback is called as soon as sufficient power data is available for all channels; see `PowersOfWindow` as a reference
     */
    constructor(sampleRate: number, frameSizeS: number, numFrames: number, onPowerCallback: (powers: PowersOfWindow) => void) {
        this.frameSamples = sampleRate * frameSizeS;
        this.numFrames = numFrames;
        this.onPowerCallback = onPowerCallback;
    }

    /**
     * As the number of channels can only be determined when the first audio data arrives,
     * this functions is meant to be called once when the first audio data was appended.
     * @param numberOfChannels the number of channels of the first audio data
     */
    private init(numberOfChannels: number) {
        if (!this.initCalled) {
            // init the internal state of power results and number of channels
            for (let channelId = 0; channelId < numberOfChannels; channelId++) {
                this.powerResults[channelId] = [];
            }
        }
        this.initCalled = true;
    }

    /**
     * Processed a given set of audio data by appending it to the internal ring buffers.
     * @param inputs the raw audio data as PCM float arrays
     */
    appendData(inputs: Float32Array[]) {
        this.init(inputs.length);
        inputs.forEach((inputData, channelInd) => {
            if (!this.rawBuffer[channelInd]) {
                this.rawBuffer[channelInd] = new Float32RingBuffer(this.frameSamples, data => {
                    this.appendPower(channelInd, powerOfFrame(data));
                });
            }
            this.rawBuffer[channelInd].push(inputData);
        })
    }

    private appendPower(channel: number, power: number) {
        this.powerResults[channel].unshift(power);

        if (this.powerResults[channel].length >= this.numFrames) {
            this.powerResults[channel] = this.powerResults[channel].slice(0, this.numFrames);
        }

        // add the new power values to the callback data buffer
        // to do this, either find the first slot which does not already contain data for this channel
        // or create a new slot with this data
        const indexToAddTo = this.powerResultsForCallback.findIndex((powersOfWindow) => powersOfWindow[channel] === undefined);
        if (indexToAddTo < 0) {
            // there is no slot available where no data for this channel is set
            // create a new slot for this channel
            let slot: PowersOfWindow = [];
            // note: a copy of the array is required, so that is not changed in-place afterwards
            slot[channel] = [...this.powerResults[channel]];
            this.powerResultsForCallback.push(slot);
        } else {
            this.powerResultsForCallback[indexToAddTo][channel] = this.powerResults[channel];
        }

        // Note: only trigger the callback, if there is at least one slot with data for all channels available
        while (this.powerResultsForCallback.length > 0 &&
            this.powerResultsForCallback[0].length == this.powerResults.length &&
            !this.powerResultsForCallback[0].includes(undefined as any)) {
            const callbackData = this.powerResultsForCallback.shift();
            if (callbackData) {
                this.onPowerCallback(callbackData);
            } else {
                throw "unreachable statement";
            }
        }
    }
}

class Float32RingBuffer {
    private buffer: Float32Array;
    private workingIndex: number = 0;
    private callback: (data: Float32Array) => void;

    constructor(length: number, onFull: (data: Float32Array) => void) {
        this.buffer = new Float32Array(length);
        this.callback = onFull;
    }

    push(pushData: Float32Array) {
        for (const value of pushData) {
            if (this.workingIndex >= this.buffer.length) {
                this.callback(this.buffer.slice());
                this.workingIndex = 0;
            }
            this.buffer[this.workingIndex] = value;
            this.workingIndex++;
        }
    }
}

function powerOfFrame(data: Float32Array): number {
    let sum = 0;
    for (const value of data) {
        sum += value * value;
    }
    return sum / data.length;
}

export function momentaryLoudness(powers: number[][], frameSizeS: number, weighting: (channel: number) => number): number {
    return loudnessOverTime(powers, frameSizeS, weighting, 0.4); //0.4 is 400ms momentary loudness
}

export function shortTermLoudness(powers: number[][], frameSizeS: number, weighting: (channel: number) => number): number {
    return loudnessOverTime(powers, frameSizeS, weighting, 3); //3 is 3s short term loudness
}

function loudnessOverTime(powers: number[][], frameSizeS: number, weighting: (channel: number) => number, timeS: number): number {
    const numFrames = Math.round(timeS / frameSizeS); //0.4 is 400ms momentary loudness
    let sum = 0;
    for (const [channel, powersSet] of powers.entries()) {
        const weight = weighting(channel);
        let usedFrames = 0;
        let tmpSum = 0;
        for (const [frame, power] of powersSet.entries()) {
            if (frame < numFrames) {
                usedFrames++;
                tmpSum += power;
            }
        }
        sum += weight * (tmpSum / usedFrames);
    }
    return -0.691 + (10 * Math.log10(sum));
}
