import { BackendStore } from "../backend/backend";
import AudioEBUR128 from "./audio-ebur128";

export default class AudioPlayer {
    private assetID: string = "";
    private thumbnailDataURL: string = "";
    private backend: BackendStore;
    private audioSrc: HTMLAudioElement;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    readonly ebur128analyser: AudioEBUR128;
    private onTimeUpdateListener: ((newTime: number) => void)[] = [];
    private onDurationUpdateListener: ((newDuration: number) => void)[] = [];
    private onEndedListener: (() => void)[] = [];

    constructor(backend: BackendStore) {
        this.backend = backend;
        this.audioContext = new window.AudioContext;
        this.audioSrc = new Audio();
        this.audioSrc.ontimeupdate = this.onTimeUpdate.bind(this);
        this.audioSrc.ondurationchange = this.onDurationChange.bind(this);
        this.audioSrc.onended = this.onEnded.bind(this);
        console.debug("initialized AudioPlayer");

        const track = this.audioContext.createMediaElementSource(this.audioSrc);
        this.analyser = this.audioContext.createAnalyser();
        this.ebur128analyser = new AudioEBUR128(this.audioContext, track);
        track.connect(this.analyser)
            .connect(this.audioContext.destination);

        //MediaSession API
        if ("mediaSession" in navigator) {
            // @ts-ignore
            navigator.mediaSession.setActionHandler("play", _event => { this.setPlaying(true) });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("pause", _event => { this.setPlaying(false) });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("seekbackward", _event => { this.seekRelative(-10) });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("seekforward", _event => { this.seekRelative(10) });
            // @ts-ignore
            //navigator.mediaSession.setActionHandler("previoustrack", event => { console.log("previoustrack", event) });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("nexttrack", _event => {
                this.onEndedListener.forEach(listener => {
                    listener();
                });
            });
        } else {
            console.warn("MediaSession API is not supported!");
        }
    }

    async changeSource(newAsset: string, playImmediately: boolean) {
        if (newAsset !== this.assetID) {
            this.assetID = newAsset;
            //reload audio src when the asset changed
            const audioData = this.backend.mustGet(newAsset).file;
            const audioDataSrcURL = URL.createObjectURL(audioData)
            this.audioSrc.onload = () => {
                URL.revokeObjectURL(audioDataSrcURL);
                console.log("TEST: AUDIO HAS FIRED onload!")
            };
            this.audioSrc.src = audioDataSrcURL;
            //set the audio context to resume, if it was suspended by the browser
            this.audioContext.resume();
            if (playImmediately) this.audioSrc.play();
            console.debug("reloaded player with", newAsset);

            const meta = this.backend.mustGet(newAsset).metadata;
            if (meta) {
                document.title = meta.title + " • " + meta.artist + " • BBAP";
            } else {
                document.title = "BBAP";
            }

            if ("mediaSession" in navigator) {
                // thumbnail data handling: revoke previous one and set a new one
                URL.revokeObjectURL(this.thumbnailDataURL);
                const thumbnailData = await this.backend.getThumbnail(newAsset);
                this.thumbnailDataURL = thumbnailData ? URL.createObjectURL(thumbnailData) : "";
                // @ts-ignore
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: meta.title,
                    artist: meta.artist,
                    album: meta.album,
                    artwork: [
                        // Note: chrome needs the fields sizes and type to be set, even if the values are wrong
                        { src: this.thumbnailDataURL, sizes: "128x128", type: "image/jpg" },
                    ]
                });
            }
        }
    }

    private onTimeUpdate() {
        const newTime = this.audioSrc.currentTime;
        this.onTimeUpdateListener.forEach(listener => {
            listener(newTime);
        });
    }

    private onDurationChange() {
        const newDuration = this.audioSrc.duration;
        this.onDurationUpdateListener.forEach(listener => {
            listener(newDuration);
        });
    }

    private onEnded() {
        this.onEndedListener.forEach(listener => {
            listener();
        });
    }

    getCurrentAsset(): string {
        return this.assetID;
    }

    getCurrentTime(): number {
        return this.audioSrc.currentTime;
    }

    getDuration(): number {
        return this.audioSrc.duration;
    }

    getAnalyserNode(): AnalyserNode {
        return this.analyser;
    }

    getSampleRate(): number {
        return this.audioContext.sampleRate;
    }

    isPaused(): boolean {
        return this.audioSrc.paused;
    }

    setPlaying(play: boolean) {
        play ? this.audioSrc.play() : this.audioSrc.pause();
    }

    seek(time: number) {
        this.audioSrc.currentTime = time;
    }

    seekRelative(offset: number) {
        this.seek(this.audioSrc.currentTime + offset);
    }

    stop() {
        this.audioSrc.pause();
        this.audioSrc.currentTime = 0;
    }

    addTimeUpdateListener(listener: (newTime: number) => void) {
        this.onTimeUpdateListener.push(listener);
    }

    removeTimeUpdateListener(listener: (newTime: number) => void) {
        this.onTimeUpdateListener = this.onTimeUpdateListener.filter(l => l !== listener);
    }

    addDurationUpdateListener(listener: (newDuration: number) => void) {
        this.onDurationUpdateListener.push(listener);
    }

    removeDurationUpdateListener(listener: (newDuration: number) => void) {
        this.onDurationUpdateListener = this.onDurationUpdateListener.filter(l => l !== listener);
    }

    addOnEndedListener(listener: () => void) {
        this.onEndedListener.push(listener);
    }
}
