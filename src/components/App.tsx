import { Component, createSignal } from 'solid-js';
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

const App: Component = () => {
  const [backend, setBackend] = createSignal<BackendState>({ tag: "None" });

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/assets/:id" element={<Asset />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/albums/:id" element={<Album />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:id" element={<Artist />} />
        <Route path="/" element={<Default backendSignal={[backend, setBackend]} />} />
        <Route path="/*all" element={<Navigate href={"/"} />} />
      </Routes>
    </>
  );
};

export default App;
