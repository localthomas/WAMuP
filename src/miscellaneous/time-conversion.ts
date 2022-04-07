/**
 * Convert a raw seconds value into a human readable string in the format
 * `m:ss` (if the hour value is 0; note the leading zeros on seconds but not minute) or
 * `h:mm:ss` (note: hour does not have leading zeros, but minute and seconds do).
 * @param timeS the time value in seconds
 * @returns a string representing the time in seconds
 */
export function secondsToString(timeS: number): string {
    const pad2 = (val: number) => (val + "").padStart(2, "0");
    let str = "";
    let hours = Math.floor(timeS / 60 / 60);
    let minutes = Math.floor((timeS - hours * 60 * 60) / 60);
    let seconds = Math.floor((timeS - hours * 60 * 60) - minutes * 60);
    const hourShown = hours > 0;
    str += hourShown ? hours + ":" : ""; // only show hours when more than 0
    str += (hourShown ? pad2(minutes) : minutes) + ":"; // only pad the minutes to two characters if there is an hour
    str += pad2(seconds); // pad with leading zeroes
    return str;
}