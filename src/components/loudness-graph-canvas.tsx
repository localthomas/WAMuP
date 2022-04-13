import { Accessor, createEffect } from "solid-js";
import { AudioPlayerState } from "../player/audio-player";

export type LoudnessAndRange = {
    loudness: number; // LUFS (<= 0)
    range: number; // LU (>= 0)
}

export type LoudnessGraphCanvasProps = {
    loudnessFrames: LoudnessAndRange[];
    analysisWindowSizeS: Accessor<number>;
    audioState: Accessor<AudioPlayerState>;
    onWantsToSeek: (to: number) => void;
}

export const GRAPH_MINIMAL_LOUDNESS = -35; // LUFS
export const GRAPH_GREEN_LOUDNESS_RANGE = 6; // LU

/**
 * Plots the loudness [LUFS] (which means negative) values as y-axis with time on the x-axis.
 * The loudness range is used for coloring each data point with a different color.
 * Red means a low loudness range (approaching 0) while green is greater than GRAPH_GREEN_LOUDNESS_RANGE [LU].
 * @param props the properties to use for displaying on the canvas
 */
export default function LoudnessGraphCanvas(props: LoudnessGraphCanvasProps) {
    let canvasRef: HTMLCanvasElement | undefined;

    function getMousePositionRelative(event: MouseEvent & {
        currentTarget: HTMLCanvasElement;
        target: Element;
    }): number {
        const canvas = event.currentTarget;
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let xRelative = x / canvas.width;
        return xRelative;
    }

    function draw() {
        // break, if the canvas is no longer in the DOM
        if (!canvasRef) {
            console.warn("canvas could not be referenced in loudness-graph-canvas!");
            return;
        }
        const canvas = canvasRef;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const drawCtx = canvas.getContext("2d");
        if (!drawCtx) {
            throw "draw context is null: unexpected state";
        }
        drawCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / props.loudnessFrames.length;
        for (const [i, shortTerm] of props.loudnessFrames.entries()) {
            const percent = 1 - (shortTerm.loudness / GRAPH_MINIMAL_LOUDNESS);
            const heightPx = canvas.height * percent;
            const offset = canvas.height - heightPx - 1;

            // use a scale from 0 to GRAPH_GREEN_LOUDNESS_RANGE LU
            let lraRatio = shortTerm.range / GRAPH_GREEN_LOUDNESS_RANGE;
            if (lraRatio > 1) lraRatio = 1; // cap ratio at 1
            const color = blendColors("#b71c1c", "#89c402", lraRatio);
            drawCtx.fillStyle = color;

            drawCtx.fillRect(i * barWidth, offset, barWidth + 1, heightPx);
        }

        // draw the current position marker
        const relativeCurrentTime = props.audioState().currentTime / props.audioState().duration;
        const markerWidth = canvas.width * (props.analysisWindowSizeS() / props.audioState().duration);
        drawCtx.fillStyle = "rgba(1, 87, 155, 0.5)";
        // use the right edge of the marker rect as the current time value
        drawCtx.fillRect((relativeCurrentTime * canvas.width) - markerWidth, 0, markerWidth, canvas.height);
        // the white marker line for current playback position
        drawCtx.fillStyle = "rgba(255, 255, 255, 1)";
        drawCtx.fillRect((relativeCurrentTime * canvas.width), 0, 1, canvas.height);
    }

    createEffect(draw);

    return (
        <canvas class="loudness-graph-canvas is-clickable" ref={canvasRef}
            onClick={(e) => {
                const xRel = getMousePositionRelative(e);
                const newTime = xRel * props.audioState().duration;
                props.onWantsToSeek(newTime);
            }}></canvas>
    );
}

/**
 * Blend (linear) two colors to create the color that is at the percentage away from the first color
 * @param color1 the first color, hex (ie: #aabbcc)
 * @param color2 the second color, hex (ie: #001122)
 * @param percentage the distance from the first color, as a decimal between 0 and 1 (ie: 0.5)
 * @returns the third color, hex, representation of the blend between color1 and color2 at the given percentage
 */
function blendColors(color1: string, color2: string, percentage: number): string {
    // 1: validate input, make sure we have provided a valid hex
    if (color1.length != 7 && color2.length != 7)
        throw new Error("colors must be provided as hexes eg: '#aabbcc'");

    if (percentage > 1 || percentage < 0)
        throw new Error("percentage must be between 0 and 1");

    color1 = color1.substring(1);
    color2 = color2.substring(1);

    // convert colors to rgb
    let color1Arr = [parseInt(color1[0] + color1[1], 16), parseInt(color1[2] + color1[3], 16), parseInt(color1[4] + color1[5], 16)];
    let color2Arr = [parseInt(color2[0] + color2[1], 16), parseInt(color2[2] + color2[3], 16), parseInt(color2[4] + color2[5], 16)];

    // blend (linear)
    var color3 = [
        (1 - percentage) * color1Arr[0] + percentage * color2Arr[0],
        (1 - percentage) * color1Arr[1] + percentage * color2Arr[1],
        (1 - percentage) * color1Arr[2] + percentage * color2Arr[2]
    ];

    // convert to hex
    let color3Arr = '#' + int_to_hex(color3[0]) + int_to_hex(color3[1]) + int_to_hex(color3[2]);

    return color3Arr;
}

/**
 * convert a Number to a two character hex string
 * must round, or we will end up with more digits than expected (2)
 * note: can also result in single digit, which will need to be padded with a 0 to the left
 * returns: the hex representation of the provided number
 * @param num the number to conver to hex
 */
function int_to_hex(num: number): string {
    var hex = Math.round(num).toString(16);
    if (hex.length == 1)
        hex = '0' + hex;
    return hex;
}
