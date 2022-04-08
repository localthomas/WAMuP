/**
 * Converts binary data and displays it with an HTML img element using `URL.createObjectURL`.
 *
 * If the blob is `undefined`, a placeholder image is used instead.
 * @param blob the binary data that must be valid image data
 * @returns a HTML img element
 */
export function blobToImageWithDefault(blob: Blob | undefined): HTMLImageElement {
    if (blob) {
        return blobToImage(blob);
    } else {
        let img = document.createElement('img');
        img.src = new URL('../assets/default-image.png', import.meta.url).href;
        return img;
    }
}


function blobToImage(blob: Blob): HTMLImageElement {
    const url = URL.createObjectURL(blob);
    let img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(url);
    }
    img.src = url;
    return img;
}