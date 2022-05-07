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
import ReactiveAudioSession from '../player/reactive-audio-session';
import { AudioSessionConnectors } from '../player/audio-session-connectors';
import Licenses from '../views/licenses';

const App: Component = () => {
    const [backendState, setBackendState] = createSignal<BackendState>({ tag: "None" });

    const defaultRoute = <Route path="/" element={<Default backendSignal={[backendState, setBackendState]} />} />;
    const licensesRoute = <Route path="/licenses" element={<Licenses />} />;
    const fallbackRoute = <Route path="/*all" element={<Navigate href={"/"} />} />;
    const alwaysPresentRoutes = [defaultRoute, licensesRoute, fallbackRoute];

    // Switch the current page from a simple default view to a proper view with navigation,
    // if the backend was loaded.
    const page = createMemo(() => {
        const backend = backendState();
        if (backend.tag === "Backend") {
            const audioSession = ReactiveAudioSession.getInstance(backend.store);
            AudioSessionConnectors.mediaSessionConnect(backend.store, audioSession);
            AudioSessionConnectors.tabTitleConnect(backend.store, audioSession);
            AudioSessionConnectors.keyboardConnect(audioSession);
            return layoutWithLoadedBackend(
                backend.store,
                audioSession,
                alwaysPresentRoutes,
            );
        } else {
            return (
                <main>
                    {createRoutes(alwaysPresentRoutes)}
                </main>
            );
        }
    });

    return page;
};

export default App;

/**
 * Creates a new layout with all views that should be available as soon as a backend was loaded.
 * @param backendStore the backend store that must be initialized
 * @param audioSession the audio session to use
 * @param additionalRoutes routes that should be enabled in addition to the newly created ones
 * @returns a finished page layout (i.e. for the root element)
 */
function layoutWithLoadedBackend(backendStore: BackendStore, audioSession: ReactiveAudioSession, additionalRoutes: JSX.Element[]): JSX.Element {
    // page setup, if a fully loaded backend is available

    const routes = [
        <Route path="/assets/:id" element={
            <Asset
                backend={backendStore}
                onPlayNow={audioSession.playNow.bind(audioSession)}
                onAppendToPlaylist={audioSession.appendToPlaylist.bind(audioSession)}
            />}
        />,
        <Route path="/queue" element={
            <Queue
                backend={backendStore}
                playlist={audioSession.getQueue()()}
                onRemoveFromPlaylist={audioSession.removeFromPlaylist.bind(audioSession)}
                onReplacePlaylist={audioSession.setNewPlaylist.bind(audioSession)}
            />}
        />,
        <Route path="/visualizer" element={
            <Visualizer
                backend={backendStore}
                audioSession={audioSession}
            />}
        />,
        <Route path="/albums" element={
            <Albums
                backend={backendStore}
                onReplacePlaylist={audioSession.setNewPlaylist.bind(audioSession)}
            />}
        />,
        <Route path="/albums/:id" element={
            <Album
                backend={backendStore}
                onReplacePlaylist={audioSession.setNewPlaylist.bind(audioSession)}
                currentAsset={audioSession.getAudioState()().assetID}
                onPlayNow={audioSession.playNow.bind(audioSession)}
                onAppendToPlaylist={audioSession.appendToPlaylist.bind(audioSession)}
            />}
        />,
        <Route path="/artists" element={
            <Artists
                backend={backendStore}
            />}
        />,
        <Route path="/artists/:id" element={
            <Artist
                backend={backendStore}
                currentAsset={audioSession.getAudioState()().assetID}
                onPlayNow={audioSession.playNow.bind(audioSession)}
                onAppendToPlaylist={audioSession.appendToPlaylist.bind(audioSession)}
            />}
        />,
        additionalRoutes,
    ];

    // Note: if adding methods of `audioSession` as callbacks, use `.bind(audioSession)` so that `this` is well defined
    return (
        <>
            <Navigation />
            <main>
                {createRoutes(routes)}
            </main>
            <PlayerBar
                audioSession={audioSession}
                backend={backendStore}
            />
        </>
    );
}

/**
 * Use a list of `Route` elements to create a router. Note that the order of the elements matters.
 * @param routes the list of `Route` elements
 * @returns the finished `Routes` setup
 */
function createRoutes(routes: JSX.Element[]): JSX.Element {
    // Note: use flat, as `Routes` only supports `Route` elements when they are *direct* children
    return (
        <Routes>
            {routes.flat(9999)}
        </Routes>
    );
}