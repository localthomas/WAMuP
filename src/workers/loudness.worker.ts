import { combineValuesIntoAnalysisWindows, loudnessOfAnalysisWindow, LoudnessOfAudioBufferWorkerInput, powersPerChannelOfFrame } from "../miscellaneous/loudness-calculations";
import { registerSingleWorkerFunction } from "./single-worker-base";

registerSingleWorkerFunction(function (input: LoudnessOfAudioBufferWorkerInput): number[] {
    /**
     * The power per channel per frame.
     * The first index selects the frame number, the second is the channel number.
     */
    const powers = input.frames.map(powersPerChannelOfFrame);

    /**
     * The list with all combined frame data per window.
     * The first index is the window and the second the index of the frame within the window.
     */
    const analysisWindows = combineValuesIntoAnalysisWindows(powers, input.frameSizeS, input.analysisWindowSizeS);

    /** a list of loudness values per analysis window */
    const result = analysisWindows.map(loudnessOfAnalysisWindow);
    return result;
});
