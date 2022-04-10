export type AudioContextBiquad = {
    currentTime: number;
    createBiquadFilter(): BiquadFilterNode;
}

export default function connectAudioEBUR128Prefilter(context: AudioContextBiquad, input: AudioNode, output: AudioNode) {
    // values for the pre-filter (stage 1 and 2) from libebur128
    let stage1 = context.createBiquadFilter();
    stage1.type = "highshelf";
    stage1.frequency.setValueAtTime(1681.974450955533, context.currentTime);
    stage1.gain.setValueAtTime(3.999843853973347, context.currentTime);

    let stage2 = context.createBiquadFilter();
    stage2.type = "highpass";
    stage2.frequency.setValueAtTime(38.13547087602444, context.currentTime);
    stage2.Q.setValueAtTime(0.5003270373238773, context.currentTime);

    input.connect(stage1)
        .connect(stage2)
        .connect(output);
}
