/**
 * Converts binary data and displays it with an HTML img element using `URL.createObjectURL`.
 *
 * If the blob is `undefined`, a placeholder image is used instead.
 * @param blob the binary data that must be valid image data
 * @returns a HTML img element
 */
export function blobToImageSrcWithDefault(blob: Blob | undefined): string {
    if (blob) {
        return blobToImageSrc(blob);
    } else {
        return new URL('../assets/default-image.png', import.meta.url).href;
    }
}


function blobToImageSrc(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    return url;
}