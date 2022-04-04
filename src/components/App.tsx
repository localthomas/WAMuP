import { Component, createSignal } from 'solid-js';
import { BackendState } from '../backend/backend';
import Overview from './overview';
import SourceDirectoryPicker from './source-dir-picker';

const App: Component = () => {
  const [backend, setBackend] = createSignal<BackendState>({ tag: "None" });

  return (
    <div>
      <SourceDirectoryPicker backendStateSignal={[backend, setBackend]} />
      <Overview backend={backend}></Overview>
    </div>
  );
};

export default App;
