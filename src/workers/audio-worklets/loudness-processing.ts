export class ProcessingBuffer {
    private frameSamples: number;
    private numFrames: number;
    private rawBuffer: Float32RingBuffer[] = [];
    //the calculated power values for each frame and each channel
    private powerResults: number[][] = [];
    private onPowerCallback: (powers: number[][]) => void;

    constructor(sampleRate: number, frameSizeS: number, numFrames: number, onPowerCallback: (powers: number[][]) => void) {
        this.frameSamples = sampleRate * frameSizeS;
        this.numFrames = numFrames;
        this.onPowerCallback = onPowerCallback;
    }

    appendData(inputs: Float32Array[]) {
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
        if (!this.powerResults[channel]) {
            this.powerResults[channel] = [];
        }

        this.powerResults[channel].unshift(power);

        if (this.powerResults[channel].length >= this.numFrames) {
            this.powerResults[channel] = this.powerResults[channel].slice(0, this.numFrames);
        }

        this.onPowerCallback(this.powerResults);
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
