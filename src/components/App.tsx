import { Component, createMemo, createSignal, JSX } from 'solid-js';
import { Navigate, Routes, Route } from "solid-app-router";
import { BackendState, BackendStore } from '../backend/backend';
import Default from '../views/default';
import Navigation from './navigation';
import Albums from '../views/albums';
import Album from '../views/album';
import Artists from '../views/artists';
import Artist from '../views/artist';
import Asset from '../views/asset';
import Queue from '../views/queue';
import Visualizer from '../views/visualizer';
import PlayerBar from './player-bar';
import { AudioPlayerState } from '../player/audio-player';
import { AudioSession } from '../player/audio-session';

const App: Component = () => {
    const [backendState, setBackendState] = createSignal<BackendState>({ tag: "None" });

    const defaultComponent = <Default backendSignal={[backendState, setBackendState]} />;

    // Switch the current page from a simple default view to a proper view with navigation,
    // if the backend was loaded.
    const page = createMemo(() => {
        const backend = backendState();
        if (backend.tag === "Backend") {
            return layoutWithLoadedBackend(
                defaultComponent,
                backend.store,
                new AudioSession(backend.store)
            );
        } else {
            return defaultComponent;
        }
    });

    return page;
};

export default App;


function layoutWithLoadedBackend(defaultComponent: JSX.Element, backendStore: BackendStore, audioSession: AudioSession): JSX.Element {
    const [queue, setQueue] = createSignal<string[]>([]);
    audioSession.addPlaylistListener((newQueue) => {
        setQueue(newQueue);
    });

    const [audioState, setAudioState] = createSignal<AudioPlayerState>({
        assetID: "",
        isPlaying: false,
        currentTime: 0,
        duration: 0,
    });
    audioSession.addOnStateChangeListener((newState) => setAudioState(newState));

    // page setup, if a fully loaded backend is available

    // Note: if adding methods of `audioSession` as callbacks, use `.bind(audioSession)` so that `this` is well defined
    return (
        <>
            <Navigation />
            <Routes>
                <Route path="/assets/:id" element={
                    <Asset
                        backend={backendStore}
                        onPlayNow={audioSession.playNow.bind(audioSession)}
                        onAppendToPlaylist={audioSession.appendToPlaylist.bind(audioSession)}
                    />}
                />
                <Route path="/queue" element={
                    <Queue
                        backend={backendStore}
                        playlist={queue()}
                        onRemoveFromPlaylist={audioSession.removeFromPlaylist.bind(audioSession)}
                        onReplacePlaylist={audioSession.setNewPlaylist.bind(audioSession)}
                    />}
                />
                <Route path="/visualizer" element={
                    <Visualizer />}
                />
                <Route path="/albums" element={
                    <Albums
                        backend={backendStore}
                        onReplacePlaylist={audioSession.setNewPlaylist.bind(audioSession)}
                    />}
                />
                <Route path="/albums/:id" element={
                    <Album
                        backend={backendStore}
                        onReplacePlaylist={audioSession.setNewPlaylist.bind(audioSession)}
                        currentAsset={audioState().assetID}
                        onPlayNow={audioSession.playNow.bind(audioSession)}
                        onAppendToPlaylist={audioSession.appendToPlaylist.bind(audioSession)}
                    />}
                />
                <Route path="/artists" element={
                    <Artists
                        backend={backendStore}
                    />}
                />
                <Route path="/artists/:id" element={
                    <Artist
                        backend={backendStore}
                        currentAsset={audioState().assetID}
                        onPlayNow={audioSession.playNow.bind(audioSession)}
                        onAppendToPlaylist={audioSession.appendToPlaylist.bind(audioSession)}
                    />}
                />
                <Route path="/" element={
                    defaultComponent}
                />
                <Route path="/*all" element={
                    <Navigate
                        href={"/"}
                    />}
                />
            </Routes>
            <PlayerBar
                audioSession={audioSession}
                backend={backendStore}
            />
        </>
    );
}
