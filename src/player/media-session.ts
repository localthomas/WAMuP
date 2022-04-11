import { Metadata } from "../backend/metadata";

/**
 * Registers callbacks with the MediaSession API, if available.
 * @param callbacks the callbacks that are called by the MediaSession API
 */
export function registerMediaSessionHandlers(
    callbacks: {
        /**
         * callback when the playing state should be changed
         */
        setPlaying: (playing: boolean) => void,
        /**
         * callback when a relative seek to the current playing position should happen
         */
        seekRelative: (seconds: number) => void,
        /**
         * callback when the next track should be played
         */
        nextTrack: (() => void),
    }
) {
    if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", _event => { callbacks.setPlaying(true); });
        navigator.mediaSession.setActionHandler("pause", _event => { callbacks.setPlaying(false); });
        navigator.mediaSession.setActionHandler("seekbackward", _event => { callbacks.seekRelative(-10); });
        navigator.mediaSession.setActionHandler("seekforward", _event => { callbacks.seekRelative(10); });
        // TODO: implement previous track function?
        //navigator.mediaSession.setActionHandler("previoustrack", event => { console.log("previoustrack", event) });
        navigator.mediaSession.setActionHandler("nexttrack", _event => { callbacks.nextTrack(); });
    } else {
        console.warn("MediaSession API is not supported!");
    }
}

export function setMediaSessionMetadata(metadata: Metadata, thumbnail: Blob | undefined) {
    // Note: only ever set a single thumbnail (artwork)!
    // Not multiple, even if they have the same content, but are different sizes!
    if ("mediaSession" in navigator) {
        // thumbnail data handling: revoke previous one and set a new one
        const previousThumbnailURL = navigator.mediaSession.metadata?.artwork[0].src;
        if (previousThumbnailURL) {
            URL.revokeObjectURL(previousThumbnailURL);
        }
        const thumbnailDataURL = thumbnail ? URL.createObjectURL(thumbnail) : "";
        // @ts-ignore
        navigator.mediaSession.metadata = new MediaMetadata({
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            artwork: [
                { src: thumbnailDataURL },
            ]
        });
    }
}