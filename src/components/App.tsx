import { Component, createMemo, createSignal } from 'solid-js';
import { Navigate, Routes, Route } from "solid-app-router";
import { BackendState } from '../backend/backend';
import Default from './views/default';
import Navigation from './navigation';
import Albums from './views/albums';
import Album from './views/album';
import Artists from './views/artists';
import Artist from './views/artist';
import Asset from './views/asset';
import Queue from './views/queue';
import Visualizer from './views/visualizer';
import { appendToQueue, getCurrentAssetOfQueue, pushFrontToQueue, QueueState, removeFromQueue, setQueue } from '../player/queue';

const App: Component = () => {
  const [backendState, setBackendState] = createSignal<BackendState>({ tag: "None" });
  const [queueState, setQueueState] = createSignal<QueueState>({ playlist: [] });
  const appendToPlaylist = (assetID: string) => {
    setQueueState((queue) => appendToQueue(queue, assetID));
  };
  const playNow = (assetID: string) => {
    setQueueState((queue) => pushFrontToQueue(queue, assetID));
  };
  const setNewPlaylist = (assets: string[]) => {
    setQueueState((queue) => setQueue(queue, assets));
  };
  const removeFromPlaylist = (index: number) => {
    setQueueState((queue) => {
      //if the queue only contains one element, keep it
      if (queue.playlist.length > 1) {
        return removeFromQueue(queue, index)
      } else {
        return queue;
      }
    });
  };

  const defaultComponent = <Default backendSignal={[backendState, setBackendState]} />;

  // Switch the current page from a simple default view to a proper view with navigation,
  // if the backend was loaded.
  const page = createMemo(() => {
    const backend = backendState();
    if (backend.tag === "Backend") {
      // page setup, if a fully loaded backend is available
      return (
        <>
          <Navigation />
          <Routes>
            <Route path="/assets/:id" element={
              <Asset
                backend={backend.store}
                onPlayNow={playNow}
                onAppendToPlaylist={appendToPlaylist}
              />}
            />
            <Route path="/queue" element={
              <Queue
                backend={backend.store}
                queue={queueState()}
                onRemoveFromPlaylist={removeFromPlaylist}
                onReplacePlaylist={setNewPlaylist}
              />}
            />
            <Route path="/visualizer" element={
              <Visualizer />}
            />
            <Route path="/albums" element={
              <Albums
                backend={backend.store}
                onReplacePlaylist={setNewPlaylist}
              />}
            />
            <Route path="/albums/:id" element={
              <Album
                backend={backend.store}
                onReplacePlaylist={setNewPlaylist}
                currentAsset={queueState().playlist.at(0)}
                onPlayNow={playNow}
                onAppendToPlaylist={appendToPlaylist}
              />}
            />
            <Route path="/artists" element={
              <Artists
                backend={backend.store}
              />}
            />
            <Route path="/artists/:id" element={
              <Artist
                backend={backend.store}
                currentAsset={getCurrentAssetOfQueue(queueState())}
                onPlayNow={playNow}
                onAppendToPlaylist={appendToPlaylist}
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
        </>
      );
    } else {
      return defaultComponent;
    }
  });

  return page;
};

export default App;
