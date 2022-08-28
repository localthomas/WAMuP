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

        let powers = Array(inputs.length);

        inputs.forEach((inputData, channelInd) => {
            if (!this.rawBuffer[channelInd]) {
                this.rawBuffer[channelInd] = new Float32RingBuffer(this.frameSamples);
            }
            const evictedData = this.rawBuffer[channelInd].push(inputData);
            const powersOfChannel = evictedData.map(data => powerOfFrame(data));
            powers[channelInd] = powersOfChannel;
        })

        // assume that each channel has the same amount of power values
        for (const powersOfChannel of powers) {
            console.assert(powersOfChannel.length === powers[0].length);
        }

        // a frame is a value of power (i.e. one number) per channel
        for (let frame = 0; frame < powers[0].length; frame++) {
            for (let channel = 0; channel < powers.length; channel++) {
                const power = powers[channel][frame];
                this.powerResults[channel].unshift(power);

                if (this.powerResults[channel].length >= this.numFrames) {
                    this.powerResults[channel] = this.powerResults[channel].slice(0, this.numFrames);
                }
            }
            // the callback is invoked on each frame
            this.onPowerCallback(this.powerResults);
        }
    }
}

class Float32RingBuffer {
    private buffer: Float32Array;
    private workingIndex: number = 0;

    constructor(length: number) {
        this.buffer = new Float32Array(length);
    }

    /**
     * Push data into the ring buffer and return potentially evicted data.
     * @param pushData the data to push into the ring buffer
     * @returns a list with the evicted values; the `Float32Array` has always the length of the ring buffer; the list might be empty, if no values were evicted
     */
    push(pushData: Float32Array): Float32Array[] {
        let finishedBuffers = [];
        for (const value of pushData) {
            if (this.workingIndex >= this.buffer.length) {
                finishedBuffers.push(this.buffer.slice());
                this.workingIndex = 0;
            }
            this.buffer[this.workingIndex] = value;
            this.workingIndex++;
        }
        return finishedBuffers;
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
