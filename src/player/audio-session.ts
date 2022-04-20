import { BackendStore } from "../backend/backend";
import AudioEBUR128 from "./audio-ebur128";
import AudioPlayer, { AudioPlayerState } from "./audio-player";
import { registerMediaSessionHandlers, setMediaSessionMetadata } from "./media-session";
import { ObservableQueue } from "./queue";

/**
 * An `AudioSession` combines an `AudioPlayer`, a queue (as playlist), and a `BackendStore` into a single session
 * that holds all states for audio playback and playlist management.
 * It also integrates with various browser APIs (if they are available), such as MediaSession, and sets the tab's title.
 */
export class AudioSession {
    /** the static instance of this class, as it is meant to be used as a singleton */
    private static instance?: AudioSession;

    private audioPlayer: AudioPlayer;
    private playlist: ObservableQueue<string>;
    private backend: BackendStore;
    private onPlaylistListener: ((newPlaylist: string[]) => void)[] = [];

    /**
     * Get the current instance of this audio session.
     * Creates a new one, if none was created so far.
     * @param backend the backend to use starting from now on
     * @returns the instance
     */
    public static getInstance(backend: BackendStore): AudioSession {
        if (!this.instance) {
            this.instance = new AudioSession(backend);
        }
        this.instance.backend = backend
        return this.instance;
    }

    private constructor(backend: BackendStore) {
        this.backend = backend;
        this.audioPlayer = AudioPlayer.getInstance();
        this.audioPlayer.addOnEndedListener(() => {
            // when a track has ended, play the next asset in the list
            this.nextTrack();
        });
        this.playlist = new ObservableQueue(this.onPlaylistChange.bind(this));

        // keyboard shortcuts
        document.onkeydown = event => {
            //32 = Space
            if (event.keyCode === 32) {
                this.audioPlayer.setNewPlayerState(oldState => {
                    return {
                        isPlaying: !oldState.isPlaying,
                    };
                });
            }
        }

        // setup of MediaSession:
        registerMediaSessionHandlers({
            setPlaying: (playing) => {
                this.audioPlayer.setNewPlayerState(() => {
                    return { isPlaying: playing };
                });
            },
            seekRelative: (offset) => {
                this.audioPlayer.setNewPlayerState((oldState) => {
                    return { currentTime: oldState.currentTime + offset };
                });
            },
            seekAbsolute: (time) => {
                this.audioPlayer.setNewPlayerState(() => {
                    return { currentTime: time };
                });
            },
            stop: () => {
                this.audioPlayer.setNewPlayerState(() => {
                    return {
                        isPlaying: false,
                        currentTime: 0,
                    }
                });
            },
            nextTrack: () => {
                this.nextTrack();
            }
        });

        // setup for listening to changes of the audio player
        this.audioPlayer.addOnStateChangeListener(this.onAudioPlayerStateChange.bind(this));

        console.debug("initialized AudioSession");
    }

    /**
     * This function should be called, if the playlist was changed (see constructor of this class).
     * @param list the new playlist
     */
    private onPlaylistChange(playlist: string[]) {
        // if the playlist changed, set a new asset for the player
        const newAssetID = playlist[0];
        const newAsset = this.backend.get(newAssetID);
        if (newAsset) {
            this.audioPlayer.setNewPlayerState(() => {
                return {
                    newAsset: {
                        id: newAssetID,
                        asset: newAsset,
                    },
                    isPlaying: true,
                };
            });
        }

        // notify all listeners of the changed queue
        this.onPlaylistListener.forEach(listener => listener(playlist));
    }

    /**
     * This function should be called when the AudioPlayerState was changed (see constructor of this class).
     * @param newState the new audio player state
     * @param oldState the audio player state before the change
     */
    private async onAudioPlayerStateChange(newState: AudioPlayerState, oldState: AudioPlayerState) {
        // only react to changes in the current asset
        if (oldState.assetID !== newState.assetID) {
            // when updating the player, also update the Media Session API
            const asset = this.backend.get(newState.assetID);
            const thumbnail = await this.backend.getThumbnail(newState.assetID);
            if (asset) {
                setMediaSessionMetadata(asset.metadata, thumbnail);
            }

            // when updating the player, also update the title of the web page
            const meta = this.backend.mustGet(newState.assetID).metadata;
            if (meta) {
                document.title = meta.title + " • " + meta.artist + " • BBAP";
            } else {
                document.title = "BBAP";
            }
        }
    }

    /**
     * Append an asset to the playlist.
     * @param assetID the asset to append
     */
    public appendToPlaylist(assetID: string) {
        this.playlist.appendToQueue(assetID);
    }

    /**
     * Play an asset right now, replacing any currently loaded assets.
     * @param assetID the asset to play
     */
    public playNow(assetID: string) {
        this.playlist.pushFrontToQueue(assetID);
    }

    /**
     * Sets a new playlist immediately.
     * @param playlist the new playlist
     */
    public setNewPlaylist(playlist: string[]) {
        this.playlist.setQueue(playlist);
    }

    /**
     * Removes a specific item from the playlist, but only if the playlist is bigger than 1.
     * @param index the item to remove
     */
    public removeFromPlaylist(index: number) {
        //if the queue only contains one element, keep it
        if (this.playlist.size() > 1) {
            this.playlist.removeFromQueue(index);
        }
    }

    /**
     * Set the playlist to the next track.
     */
    public nextTrack() {
        this.removeFromPlaylist(0);
    }

    /**
     * Set the audio player state with new values.
     * @param newState the new state values
     */
    public setNewPlayerState(newState: {
        isPlaying?: boolean;
        currentTime?: number;
    }) {
        this.audioPlayer.setNewPlayerState(() => newState);
    }

    /**
     * Get the current state of the audio player.
     * @returns the current state
     */
    public getPlayerState(): AudioPlayerState {
        return this.audioPlayer.getPlayerState();
    }

    /**
     * Get the analyser node of the underlying audio player.
     * @returns the analyser
     */
    public getAnalyserNode(): AnalyserNode {
        return this.audioPlayer.getAnalyserNode();
    }

    /**
     * Get the EBU R128 analyser node of the underlying audio player.
     * @returns the analyser
     */
    public getEBUR128AnalyserNode(): AudioEBUR128 {
        return this.audioPlayer.getEBUR128AnalyserNode();
    }

    /**
     * Get the sample rate of the underlying audio player in Hz.
     * Note that this value might change with different assets.
     * @returns the sample rate in Hz
     */
    public getSampleRate(): number {
        return this.audioPlayer.getSampleRate();
    }

    /**
     * Remove a state change listener.
     * @param listener the listener to remove
     */
    removeStateChangeListener(listener: (newState: AudioPlayerState) => void) {
        this.audioPlayer.removeStateChangeListener(listener);
    }

    /**
     * Add a listener that reacts to audio state changes.
     * @param listener the listener to add
     */
    addOnStateChangeListener(listener: (newState: AudioPlayerState) => void) {
        this.audioPlayer.addOnStateChangeListener(listener);
    }

    /**
     * Remove a listener that listens for playlist changes.
     * @param listener the listener to remove
     */
    removePlaylistListener(listener: (newPlaylist: string[]) => void) {
        this.onPlaylistListener = this.onPlaylistListener.filter(l => l !== listener);
    }

    /**
     * Add a listener that is called on changes to the playlist.
     * @param listener the listener to add
     */
    addPlaylistListener(listener: (newPlaylist: string[]) => void) {
        this.onPlaylistListener.push(listener);
    }
}