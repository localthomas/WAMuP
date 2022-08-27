import { momentaryLoudness, ProcessingBuffer, shortTermLoudness } from "./loudness-processing";
import { LoudnessMessage, LoudnessType } from "./message-types";

/**
 * EchoProcessor sends short term and momentary loudness to the main thread via postMessage.
 */
class EchoProcessor extends AudioWorkletProcessor {

    private processor: ProcessingBuffer;

    constructor() {
        super();
        console.debug("EchoProcessor created");

        const FRAME_SIZE_S = 0.03;
        const FRAMES = 100;

        this.processor = new ProcessingBuffer(sampleRate, FRAME_SIZE_S, FRAMES, powers => {
            // use weight of 1 for each channel
            const weighting = () => 1;
            this.onMomentaryLoudnessChange(momentaryLoudness(powers, FRAME_SIZE_S, weighting));
            this.onShortTermLoudnessChange(shortTermLoudness(powers, FRAME_SIZE_S, weighting));
        });
    }

    process(
        inputs: Float32Array[][],
        _outputs: Float32Array[][],
        _parameters: Record<string, Float32Array>
    ): boolean {
        //only one input is provided, therefore only the audio channels of the first input are used
        this.processor.appendData(inputs[0]);
        return true;
    }

    onMomentaryLoudnessChange(loudness: number) {
        this.postMessage({
            type: LoudnessType.Momentary,
            loudness
        });
    }

    onShortTermLoudnessChange(loudness: number) {
        this.postMessage({
            type: LoudnessType.ShortTerm,
            loudness
        });
    }

    postMessage(msg: LoudnessMessage) {
        this.port.postMessage(msg);
    }
}

registerProcessor('echo-processor', EchoProcessor);
