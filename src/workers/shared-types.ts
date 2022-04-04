import { PerFileData } from "../backend/file-handling";

export interface Progress {
    finished: number;
    total: number;
};
/**
 * Checks whether or not a given value is of type Progress.
 * @param value the value to check
 * @returns true if the value is of type Progress
 */
export function isProgress(value: any): value is Progress {
    const valueTyped = (value as Progress);
    return valueTyped.finished !== undefined && valueTyped.total !== undefined;
}

export type FileHandlingMessageType = PerFileData[] | Progress;
