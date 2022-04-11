import { BackendStore } from "../backend/backend";
import AudioEBUR128 from "./audio-ebur128";
import { setMediaSessionMetadata } from "./media-session";

export type AudioPlayerState = {
    assetID: string;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
}

/**
 * `AudioPlayer` wraps multiple audio objects and provides unified access to the full audio setup.
 */
export default class AudioPlayer {
    private backend: BackendStore;
    private audioSrc: HTMLAudioElement;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    readonly ebur128analyser: AudioEBUR128;
    private onEndedListener: (() => void)[] = [];
    private onStateChangeListener: ((newState: AudioPlayerState) => void)[] = [];
    private state: AudioPlayerState;

    constructor(backend: BackendStore) {
        this.backend = backend;
        this.state = {
            assetID: "",
            currentTime: 0,
            duration: 0,
            isPlaying: false,
        };
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
    }

    async changeSource(newAsset: string, playImmediately: boolean) {
        if (newAsset !== this.state.assetID) {
            this.changeState({
                ...this.state,
                assetID: newAsset,
            })
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

            const thumbnailData = await this.backend.getThumbnail(newAsset);
            setMediaSessionMetadata(meta, thumbnailData);
        }
    }

    /**
     * Set the audio player state with new values.
     * @param newState the new state values
     */
    public setNewPlayerState(newState: {
        isPlaying?: boolean;
        currentTime?: number;
    }) {
        if (newState.isPlaying) {
            this.setPlaying(newState.isPlaying);
        }
        if (newState.currentTime) {
            this.seek(newState.currentTime);
        }
    }

    /**
     * Sets a new state and calls the callbacks for changes in the state.
     * @param newState the new state
     */
    private changeState(newState: AudioPlayerState) {
        this.state = newState;
        this.onStateChangeListener.forEach(listener => {
            listener(newState);
        });
    }

    private onTimeUpdate() {
        const newTime = this.audioSrc.currentTime;
        this.changeState({
            ...this.state,
            currentTime: newTime,
        })
    }

    private onDurationChange() {
        const newDuration = this.audioSrc.duration;
        this.changeState({
            ...this.state,
            duration: newDuration,
        })
    }

    private onEnded() {
        this.onEndedListener.forEach(listener => {
            listener();
        });
    }

    // TODO remove unused functions below


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

    removeStateChangeListener(listener: (newState: AudioPlayerState) => void) {
        this.onStateChangeListener = this.onStateChangeListener.filter(l => l !== listener);
    }

    addOnStateChangeListener(listener: (newState: AudioPlayerState) => void) {
        this.onStateChangeListener.push(listener);
    }

    removeEndedListener(listener: () => void) {
        this.onEndedListener = this.onEndedListener.filter(l => l !== listener);
    }

    addOnEndedListener(listener: () => void) {
        this.onEndedListener.push(listener);
    }
}
