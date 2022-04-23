import { createEffect, createSignal, onCleanup } from "solid-js";
import { ReactiveAudioSession } from "../player/reactive-audio-session";
import { MinusBtn, PlusBtn } from "./icon-btns";

const MAX_FREQ = 18000;
const DEFAULT_SMOOTHING = 0.75;
const MAX_FFT_SIZE = 32768;
const MIN_FFT_SIZE = 32;

export default function Spectrum(props: {
    audioSession: ReactiveAudioSession;
}) {
    let canvasRef: HTMLCanvasElement | undefined = undefined;
    const [smoothing, setSmoothing] = createSignal(DEFAULT_SMOOTHING);
    const [fftSize, setFftSize] = createSignal(1024);

    createEffect(() => {
        let activeLoop = true;
        const analyser = props.audioSession.getAnalyserNode();
        analyser.minDecibels = -140;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = smoothing();
        analyser.fftSize = fftSize();

        let freqs = new Uint8Array(analyser.frequencyBinCount);
        function draw() {
            //break, if the canvas is no longer in the DOM
            if (!canvasRef) {
                return;
            }

            analyser.getByteFrequencyData(freqs);

            const canvas = canvasRef;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const width = canvas.width;
            const height = canvas.height;
            const drawCtx = canvas.getContext("2d");
            if (!drawCtx) {
                throw "draw context is null: unexpected state";
            }

            const sampleRate = props.audioSession.getSampleRate();
            //*2 is used, because the analyser only outputs the frequencies from 0 to sampleRate/2
            const shownLength = analyser.frequencyBinCount * 2 * (MAX_FREQ / sampleRate);
            const barWidth = width / shownLength;

            drawCtx.clearRect(0, 0, canvas.width, canvas.height);
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
            drawCtx.fillStyle = primaryColor;
            for (let i = 0; i < shownLength; i++) {
                const value = freqs[i];
                const percent = value / 256;
                const heightPx = height * percent;
                const offset = height - heightPx - 1;
                drawCtx.fillRect(i * barWidth, offset, barWidth + 1, heightPx);
            }

            if (activeLoop) {
                window.requestAnimationFrame(draw);
            }
        };
        window.requestAnimationFrame(draw);
        onCleanup(() => {
            activeLoop = false;
        });
    });
    return (
        <>
            <canvas class="spectrum-canvas" ref={canvasRef}></canvas>
            <p class="spectrum-canvas-label">
                {"Max. displayed frequency: " + MAX_FREQ / 1000 + "kHz. Scale is linear."}
            </p>
            <div class="spectrum-settings">
                <fieldset>
                    <legend>Smoothing (averaging constant with the last frame)</legend>
                    <input type="range" min="0" max="0.99" step="0.01" value={smoothing()}
                        onChange={event => {
                            setSmoothing(parseFloat(event.currentTarget.value));
                        }}
                        onDblClick={() => {
                            setSmoothing(DEFAULT_SMOOTHING);
                        }} />
                </fieldset>
                <fieldset>
                    <legend>Sampling size (resolution of spectrum): {
                        /* calculate num of shown bars, which is the fftSize/2 * MAX_FREQ/nyquist */
                        fftSize() * (MAX_FREQ / props.audioSession.getSampleRate())
                    }</legend>
                    <PlusBtn
                        small
                        onClick={() => {
                            if (fftSize() < MAX_FFT_SIZE) {
                                setFftSize(fftSize() * 2);
                            }
                        }} disabled={fftSize() >= MAX_FFT_SIZE} />
                    <MinusBtn
                        small
                        onClick={() => {
                            if (fftSize() > MIN_FFT_SIZE) {
                                setFftSize(fftSize() / 2);
                            }
                        }} disabled={fftSize() <= MIN_FFT_SIZE} />
                </fieldset>
            </div>
        </>
    );
}
