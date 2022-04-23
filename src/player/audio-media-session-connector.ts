import { createEffect, createMemo } from "solid-js";
import { BackendStore } from "../backend/backend";
import { registerMediaSessionHandlers, setMediaSessionMetadata } from "./media-session";
import ReactiveAudioSession from "./reactive-audio-session";

export default class AudioMediaSessionConnector {
    /**
     * Connect an AudioSession to the MediaSession API.
     * Propagates any updates of the AudioSession to the MediaSession.
     * @param backend the backend to use for data fetching
     * @param audioSession the audio session for the connection
     */
    public static connect(backend: BackendStore, audioSession: ReactiveAudioSession) {
        const playbackQueueLength = createMemo(() => audioSession.getQueue()().length);
        const currentAsset = createMemo(() => audioSession.getAudioState()().assetID);

        // a next track function can either be set or undefined
        const nextTrack = createMemo(() => {
            if (playbackQueueLength() > 1) {
                return () => {
                    audioSession.nextTrack();
                };
            } else {
                return undefined;
            }
        });

        // register handlers
        createEffect(() => {
            registerMediaSessionHandlers({
                setPlaying: (playing) => {
                    audioSession.setNewPlayerState({ isPlaying: playing });
                },
                seekRelative: (offset) => {
                    audioSession.setNewPlayerStateFromOld((oldState) => {
                        return { currentTime: oldState.currentTime + offset };
                    });
                },
                seekAbsolute: (time) => {
                    audioSession.setNewPlayerState({ currentTime: time });
                },
                stop: () => {
                    audioSession.setNewPlayerState({
                        isPlaying: false,
                        currentTime: 0,
                    });
                },
                nextTrack: nextTrack(),
            });
        });

        // register metadata updates
        createEffect(async () => {
            const assetID = currentAsset();
            // when updating the player, also update the Media Session API
            const asset = backend.get(assetID);
            if (asset) {
                const thumbnail = await backend.getThumbnail(assetID);
                setMediaSessionMetadata(asset.metadata, thumbnail);
            }
        });
    }
}