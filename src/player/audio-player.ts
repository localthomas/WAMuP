import { AssetWithID } from "../backend/backend";
import AudioEBUR128 from "./audio-ebur128";

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
    /** the static instance of this class, as it is meant to be used as a singleton */
    private static instance?: AudioPlayer;

    private audioSrc: HTMLAudioElement;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    readonly ebur128analyser: AudioEBUR128;
    /** Listener that is fired when the current asset was played to its completion. */
    public onEndedListener?: () => void;
    /**
     * Listener that is fired as soon as the internal player state changed.
     * Includes the new state as the first parameter and the previous state (before the change) as the second parameter.
     */
    public onStateChangeListener?: (newState: AudioPlayerState, oldState: AudioPlayerState) => void;
    private state: AudioPlayerState;

    /**
     * Get the current audio player instance.
     * @returns the instance
     */
    public static getInstance(): AudioPlayer {
        if (!this.instance) {
            this.instance = new AudioPlayer();
        }
        return this.instance;
    }

    private constructor() {
        this.state = {
            assetID: "",
            currentTime: 0,
            duration: 0,
            isPlaying: false,
        };

        // start the audio context in suspended state
        this.audioContext = new window.AudioContext;
        this.audioContext.suspend();

        this.audioSrc = new Audio();
        this.audioSrc.onplay = this.onPlay.bind(this);
        this.audioSrc.onpause = this.onPause.bind(this);
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

    /**
     * Load a new asst displacing the currently loaded one immediately.
     * @param newAsset the new asset's ID
     */
    private async changeSource(newAsset: AssetWithID) {
        if (newAsset.id !== this.state.assetID) {
            // reload audio src when the asset changed
            const audioData = newAsset.asset.file;
            const audioDataSrcURL = URL.createObjectURL(audioData);
            // delete the previous audio data that might still be loaded, before setting a new source
            URL.revokeObjectURL(this.audioSrc.src);
            this.audioSrc.src = audioDataSrcURL;
            // set the audio context to resume, if it was suspended by the browser
            this.audioContext.resume();
            console.debug("reloaded player with", newAsset);
            this.changeState({
                ...this.state,
                assetID: newAsset.id,
            });
        }
    }

    /**
     * Set the audio player state with new values.
     * Note that changing the asset takes precedence, so all other values are applied afterwards.
     * @param newStateFunc a function that generates the new state values
     */
    public setNewPlayerState(newStateFunc: (currentState: AudioPlayerState) => {
        newAsset?: AssetWithID;
        isPlaying?: boolean;
        currentTime?: number;
    }) {
        const newState = newStateFunc(this.state);

        // Note: apply the playing state and seeking after loading a potentially new asset.
        if (newState.newAsset !== undefined) {
            this.changeSource(newState.newAsset);
        }
        if (newState.isPlaying !== undefined) {
            this.setPlaying(newState.isPlaying);
        }
        if (newState.currentTime !== undefined) {
            this.audioSrc.currentTime = newState.currentTime;
        }
    }

    /**
     * Get the current state of the audio player.
     * @returns the current state
     */
    public getPlayerState(): AudioPlayerState {
        return this.state;
    }

    /**
     * Get the analyser node of this audio player.
     * @returns the analyser
     */
    public getAnalyserNode(): AnalyserNode {
        return this.analyser;
    }

    /**
     * Get the EBU R128 analyser node of this audio player.
     * @returns the analyser
     */
    public getEBUR128AnalyserNode(): AudioEBUR128 {
        return this.ebur128analyser;
    }

    /**
     * Get the sample rate of the current audio player in Hz.
     * Note that this value might change with different assets.
     * @returns the sample rate in Hz
     */
    public getSampleRate(): number {
        return this.audioContext.sampleRate;
    }

    /**
     * Sets a new state and calls the callbacks for changes in the state.
     * @param newState the new state
     */
    private changeState(newState: AudioPlayerState) {
        const oldState = this.state;
        this.state = newState;
        if (this.onStateChangeListener) {
            this.onStateChangeListener(newState, oldState);
        }
    }

    private onPlay() {
        this.changeState({
            ...this.state,
            isPlaying: true,
        });
    }

    private onPause() {
        this.changeState({
            ...this.state,
            isPlaying: false,
        });
    }

    private onTimeUpdate() {
        const newTime = this.audioSrc.currentTime;
        this.changeState({
            ...this.state,
            currentTime: newTime,
        });
    }

    private onDurationChange() {
        const newDuration = this.audioSrc.duration;
        this.changeState({
            ...this.state,
            duration: newDuration,
        });
    }

    private onEnded() {
        if (this.onEndedListener) {
            this.onEndedListener();
        }
    }

    private setPlaying(play: boolean) {
        play ? this.audioSrc.play() : this.audioSrc.pause();
    }
}
