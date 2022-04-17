import connectAudioEBUR128Prefilter from "../player/audio-ebur128-prefilter";

/**
 * Decode a binary file as audio data and apply the EBU R128 filter.
 * This means the resulting audio data is transformed via various filters and
 * is meant for analysis and not listening.
 * @param data the raw binary audio file
 * @returns the audio buffer filled with audio PCM data
 */
export async function getAudioBufferFromBlobWithEBUR128Filter(data: Blob): Promise<AudioBuffer> {
    // use decodeAudioCtx only for decoding the audio data
    const decodeAudioCtx = new OfflineAudioContext(1, 1024, 44100);
    const buffer = await decodeAudioCtx.decodeAudioData(await data.arrayBuffer());

    // create a new audio context with the correct values from the decoded audio data
    const offlineAudio = new OfflineAudioContext(
        buffer.numberOfChannels, buffer.length, buffer.sampleRate);

    // create input buffer
    const bufferSource = offlineAudio.createBufferSource();
    bufferSource.buffer = buffer;

    // pre-filter the data
    connectAudioEBUR128Prefilter(offlineAudio, bufferSource, offlineAudio.destination);

    // let the filter run and use the result to calculate values
    bufferSource.start();
    const resultBuffer = await offlineAudio.startRendering();

    return resultBuffer;
}