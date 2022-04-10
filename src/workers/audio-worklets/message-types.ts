/**
 * LoudnessType is used to signal the type of a loudness value.
 */
export enum LoudnessType {
    Momentary = "momentary",
    ShortTerm = "shortTerm",
};

/**
 * LoudnessMessage is used as the message between an AudioWorklet and the main Thread.
 */
export type LoudnessMessage = {
    type: LoudnessType;
    loudness: number;
};
