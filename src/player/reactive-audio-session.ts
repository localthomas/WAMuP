import { Accessor, createSignal, Signal } from "solid-js";
import { BackendStore } from "../backend/backend";
import AudioEBUR128 from "./audio-ebur128";
import { AudioPlayerState } from "./audio-player";
import { AudioSession, PlayerStateUpdate } from "./audio-session";

/**
 * Wraps a normal `AudioSession` and provides reactive access to certain state of the session via
 * solidjs' `Accessor`s.
 */
export default class ReactiveAudioSession {
    /** the static instance of this class, as it is meant to be used as a singleton */
    private static instance?: ReactiveAudioSession;

    private audioSession: AudioSession;
    private queue: Signal<string[]>;
    private audioState: Signal<AudioPlayerState>;

    /**
     * Get the current global instance of the reactive audio session.
     * @param backend the backend store
     * @returns the instance
     */
    public static getInstance(backend: BackendStore): ReactiveAudioSession {
        if (!this.instance) {
            this.instance = new ReactiveAudioSession(AudioSession.getInstance(backend));
        }
        this.instance.setAudioSession(AudioSession.getInstance(backend));
        return this.instance;
    }

    private constructor(audioSession: AudioSession) {
        // Note: the following lines are just to make TypeScript happy about uninitialized fields
        this.audioSession = audioSession;
        this.queue = createSignal<string[]>([]);
        this.audioState = createSignal<AudioPlayerState>(audioSession.getPlayerState());

        this.setAudioSession(audioSession);
    }

    /**
     * Set a new audio session to the instance of this class and wires the event handlers.
     * @param audioSession the audio session to use
     */
    private setAudioSession(audioSession: AudioSession) {
        this.audioSession = audioSession;

        // setup state for playlist
        this.queue = createSignal<string[]>([]);
        this.audioSession.onPlaylistListener = this.queue[1];

        // setup for audio state
        this.audioState = createSignal<AudioPlayerState>(audioSession.getPlayerState());
        this.audioSession.onStateChangeListener = this.audioState[1];
    }

    /**
     * Get the queue of the playlist as a reactive accessor.
     * @returns the accessor to the playlist queue
     */
    public getQueue(): Accessor<string[]> {
        return this.queue[0];
    }

    /**
     * Get the audio state of the audio player as a reactive accessor.
     * @returns the accessor to the audio state
     */
    public getAudioState(): Accessor<AudioPlayerState> {
        return this.audioState[0];
    }

    /**
     * Append an asset to the playlist.
     * @param assetID the asset to append
     */
    public appendToPlaylist(assetID: string) {
        this.audioSession.appendToPlaylist(assetID);
    }

    /**
     * Play an asset right now, replacing any currently loaded assets.
     * @param assetID the asset to play
     */
    public playNow(assetID: string) {
        this.audioSession.playNow(assetID);
    }

    /**
     * Sets a new playlist immediately.
     * @param playlist the new playlist
     */
    public setNewPlaylist(playlist: string[]) {
        this.audioSession.setNewPlaylist(playlist);
    }

    /**
     * Removes a specific item from the playlist, but only if the playlist is bigger than 1.
     * @param index the item to remove
     */
    public removeFromPlaylist(index: number) {
        this.audioSession.removeFromPlaylist(index);
    }


    /**
     * Set the playlist to the next track.
     */
    public nextTrack() {
        this.audioSession.nextTrack();
    }

    /**
     * Set the audio player state with new values.
     * @param newState the new state values
     */
    public setNewPlayerState(newState: (oldState: AudioPlayerState) => PlayerStateUpdate) {
        this.audioSession.setNewPlayerState(newState);
    }

    /**
     * Get the current state of the audio player.
     * @returns the current state
     */
    public getPlayerState(): AudioPlayerState {
        return this.audioSession.getPlayerState();
    }

    /**
     * Get the analyser node of the underlying audio player.
     * @returns the analyser
     */
    public getAnalyserNode(): AnalyserNode {
        return this.audioSession.getAnalyserNode();
    }

    /**
     * Get the EBU R128 analyser node of the underlying audio player.
     * @returns the analyser
     */
    public getEBUR128AnalyserNode(): AudioEBUR128 {
        return this.audioSession.getEBUR128AnalyserNode();
    }

    /**
     * Get the sample rate of the underlying audio player in Hz.
     * Note that this value might change with different assets.
     * @returns the sample rate in Hz
     */
    public getSampleRate(): number {
        return this.audioSession.getSampleRate();
    }
}