import connectAudioEBUR128Prefilter from "../player/audio-ebur128-prefilter";
import { PowerOfFrame } from "./loudness-calculations";

/**
 * Decode a binary file as audio data and apply the EBU R128 filter.
 * This means the resulting audio data is transformed via various filters and
 * is meant for analysis and not listening.
 * @param data the raw binary audio file
 * @returns a list of all 100ms loudness frames
 */
export async function getLoudnessInformationOfFile(data: Blob): Promise<PowerOfFrame[]> {
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

    // hook up a receiver function for the loudness frames
    let frames: PowerOfFrame[] = [];
    loudnessFrame100msProcessor.port.onmessage = (ev) => {
        // parse the message as LoudnessMessage via lose coupling in the processor that emits the events
        let event: PowerOfFrame = (ev.data as any);
        frames.push(event);
    };

    // pre-filter the data
    connectAudioEBUR128Prefilter(offlineAudio, bufferSource, loudnessFrame100msProcessor);

    // let the filter run and use the result to calculate values
    bufferSource.start();
    await offlineAudio.startRendering();

    return frames;
}
