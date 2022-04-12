import { BackendStore } from "../backend/backend";
import AudioPlayer, { AudioPlayerState } from "./audio-player";
import { registerMediaSessionHandlers, setMediaSessionMetadata } from "./media-session";
import { ObservableQueue } from "./queue";

/**
 * An `AudioSession` combines an `AudioPlayer`, a queue (as playlist), and a `BackendStore` into a single session
 * that holds all states for audio playback and playlist management.
 * It also integrates with various browser APIs (if they are available), such as MediaSession, and sets the tab's title.
 */
export class AudioSession {
    private audioPlayer: AudioPlayer;
    private playlist: ObservableQueue<string>;
    private backend: BackendStore;
    private onPlaylistListener: ((newPlaylist: string[]) => void)[] = [];

    constructor(backend: BackendStore) {
        this.backend = backend;
        this.audioPlayer = new AudioPlayer(backend);
        this.audioPlayer.addOnEndedListener(() => {
            // when a track has ended, play the next asset in the list
            this.nextTrack();
        });
        this.playlist = new ObservableQueue(this.onPlaylistChange.bind(this));

        // keyboard shortcuts
        document.onkeydown = event => {
            //32 = Space
            if (event.keyCode === 32) {
                this.audioPlayer.setPlaying(this.audioPlayer.isPaused());
            }
        }

        // setup of MediaSession:
        registerMediaSessionHandlers({
            setPlaying: (playing) => {
                this.audioPlayer.setPlaying(playing);
            },
            seekRelative: (offset) => {
                this.audioPlayer.seekRelative(offset);
            },
            nextTrack: () => {
                this.nextTrack();
            }
        });

        console.debug("initialized AudioSession");
    }

    /**
     * This function should be called, if the playlist was changed (see constructor of this class).
     * @param list the new playlist
     */
    private async onPlaylistChange(playlist: string[]) {
        // if the playlist changed, set a new asset for the player
        const newAsset = playlist[0];
        if (newAsset) {
            this.audioPlayer.changeSource(newAsset, true);

            // when updating the player, also update the Media Session API
            const asset = this.backend.get(newAsset);
            const thumbnail = await this.backend.getThumbnail(newAsset);
            if (asset) {
                setMediaSessionMetadata(asset.metadata, thumbnail);
            }

            // when updating the player, also update the title of the web page
            const meta = this.backend.mustGet(newAsset).metadata;
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
        this.audioPlayer.setNewPlayerState(newState);
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