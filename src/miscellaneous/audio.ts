import connectAudioEBUR128Prefilter from "../player/audio-ebur128-prefilter";
import { yieldBackToMainThread } from "./concurrent-processing";
import { PowerOfFrame } from "./loudness-calculations";

/**
 * Decode a binary file as audio data and apply the EBU R128 filter.
 * This means the resulting audio data is transformed via various filters and
 * is meant for analysis and not listening.
 * @param data the raw binary audio file
 * @returns a list of all 100ms loudness frames
 */
export async function* getLoudnessInformationOfFile(data: Blob): AsyncGenerator<PowerOfFrame, void, void> {
    // use decodeAudioCtx only for decoding the audio data
    const decodeAudioCtx = new OfflineAudioContext(1, 1024, 44100);
    const buffer = await decodeAudioCtx.decodeAudioData(await data.arrayBuffer());

    // create a new audio context with the correct values from the decoded audio data
    const offlineAudio = new OfflineAudioContext(
        buffer.numberOfChannels, buffer.length, buffer.sampleRate);

    // create input buffer
    const bufferSource = offlineAudio.createBufferSource();
    bufferSource.buffer = buffer;

    // create 100ms frame processor
    const processorPath = new URL("../workers/audio-worklets/ebu-r128-100ms.worker.ts", import.meta.url)
    await offlineAudio.audioWorklet.addModule(processorPath);
    const loudnessFrame100msProcessor = new AudioWorkletNode(offlineAudio, 'loudness-frame-100ms-processor');
    loudnessFrame100msProcessor.connect(offlineAudio.destination);

    // a notification promises for checking when loudness frames are available
    let notificationPromises: Promise<void>[] = [];

    // hook up a receiver function for the loudness frames
    let frames: PowerOfFrame[] = [];
    loudnessFrame100msProcessor.port.onmessage = (ev) => {
        notificationPromises.push(new Promise(resolve => {
            // parse the message as LoudnessMessage via lose coupling in the processor that emits the events
            let event: PowerOfFrame = (ev.data as any);
            frames.push(event);
            resolve();
        }));
    };

    // pre-filter the data
    connectAudioEBUR128Prefilter(offlineAudio, bufferSource, loudnessFrame100msProcessor);

    // let the filter run and use the result to calculate values
    bufferSource.start();
    // note that this is not awaited to continue execution beyond calling startRendering
    let finished = false;
    offlineAudio.startRendering().then(() => finished = true);

    while (!finished) {
        // yielding to main thread as not to block it while constantly waiting for promises
        await yieldBackToMainThread();

        // wait for all notification promises to resolve
        await Promise.all(notificationPromises);

        // yield all available frames
        let frame = frames.shift();
        while (frame !== undefined) {
            yield frame;
            frame = frames.shift();
        }
    }
}
