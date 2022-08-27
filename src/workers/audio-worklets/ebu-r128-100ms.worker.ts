import { PowerOfFrame } from "../../miscellaneous/loudness-calculations";
import { ProcessingBuffer } from "./loudness-processing";

/**
 * LoudnessFrame100msProcessor sends 100ms long loudness frames to the main thread via postMessage.
 */
class LoudnessFrame100msProcessor extends AudioWorkletProcessor {

    private processor: ProcessingBuffer;

    constructor() {
        super();
        console.debug("LoudnessFrame100msProcessor created");

        const FRAME_SIZE_S = 0.1;
        const FRAMES = 1;

        this.processor = new ProcessingBuffer(sampleRate, FRAME_SIZE_S, FRAMES, powers => {
            // Note that in this specific case power is of number[][1], as FRAMES is 1
            const powersConverted = powers.map(justOnePower => justOnePower[0]);
            const weights = powers.map(_ => 1);
            this.postMessage({
                powers: powersConverted,
                weights,
            });
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

    postMessage(msg: PowerOfFrame) {
        this.port.postMessage(msg);
    }
}

registerProcessor('loudness-frame-100ms-processor', LoudnessFrame100msProcessor);
