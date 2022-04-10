import connectAudioEBUR128Prefilter from "./audio-ebur128-prefilter";
import { LoudnessMessage, LoudnessType } from "../workers/audio-worklets/message-types";

export default class AudioEBUR128 {
    private echo?: AudioWorkletNode;
    public onMomentaryLoudnessChange?: (loudness: number) => void;
    public onShortTermLoudnessChange?: (loudness: number) => void;

    constructor(context: AudioContext, input: AudioNode) {

        const setupWorker = async () => {
            const processorPath = new URL("../workers/audio-worklets/ebu-r128.worker.ts", import.meta.url)
            await context.audioWorklet.addModule(processorPath);
            this.echo = new AudioWorkletNode(context, 'echo-processor');
            this.echo.port.onmessage = (ev) => {
                // parse the message as LoudnessMessage via lose coupling in the processor that emits the events
                let event: LoudnessMessage = (ev.data as any);
                if (event.type === LoudnessType.Momentary) {
                    if (this.onMomentaryLoudnessChange) {
                        this.onMomentaryLoudnessChange!(event.loudness);
                    }
                } else if (event.type === LoudnessType.ShortTerm) {
                    if (this.onShortTermLoudnessChange) {
                        this.onShortTermLoudnessChange!(event.loudness);
                    }
                } else {
                    console.warn("received unknown loudness-type '" + event.type + "' from audio ebu-r128-processor");
                }
            };

            connectAudioEBUR128Prefilter(context, input, this.echo);
        };
        setupWorker();
    }
}
