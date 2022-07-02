import { createEffect, createMemo } from "solid-js";
import { BackendStore } from "../backend/backend";
import { registerMediaSessionHandlers, setMediaSessionMetadata } from "./media-session";
import ReactiveAudioSession from "./reactive-audio-session";

export namespace AudioSessionConnectors {
    /**
     * Connect an AudioSession to the MediaSession API.
     * Propagates any updates of the AudioSession to the MediaSession.
     * @param backend the backend to use for data fetching
     * @param audioSession the audio session for the connection
     */
    export function mediaSessionConnect(backend: BackendStore, audioSession: ReactiveAudioSession) {
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
                    audioSession.setNewPlayerState(() => { return { isPlaying: playing } });
                },
                seekRelative: (offset) => {
                    audioSession.setNewPlayerState((oldState) => {
                        return { currentTime: oldState.currentTime + offset };
                    });
                },
                seekAbsolute: (time) => {
                    audioSession.setNewPlayerState(() => { return { currentTime: time } });
                },
                stop: () => {
                    audioSession.setNewPlayerState(() => {
                        return {
                            isPlaying: false,
                            currentTime: 0,
                        }
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

    /**
     * Connect an audio session to the current tab title.
     * @param backend the backend to use for metadata
     * @param audioSession the audio session for connecting
     */
    export function tabTitleConnect(backend: BackendStore, audioSession: ReactiveAudioSession) {
        const currentAsset = createMemo(() => audioSession.getAudioState()().assetID);

        // only react to changes in the current asset
        createEffect(() => {
            const asset = backend.get(currentAsset());
            if (asset) {
                // when updating the player, also update the title of the web page
                const meta = asset.metadata;
                if (meta) {
                    document.title = meta.title + " • " + meta.artist + " • WAMuP";
                } else {
                    document.title = "WAMuP";
                }
            }
        });
    }

    /**
     * Use keyboard shortcuts for controlling the audio session.
     * @param audioSession the audio session for controlling via keyboard
     */
    export function keyboardConnect(audioSession: ReactiveAudioSession) {
        // keyboard shortcuts
        document.onkeydown = event => {
            //32 = Space
            if (event.key === " ") {
                audioSession.setNewPlayerState(oldState => {
                    return {
                        isPlaying: !oldState.isPlaying,
                    };
                });
            }
        }
    }
}