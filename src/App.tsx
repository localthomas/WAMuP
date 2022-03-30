import type { Component } from 'solid-js';
import { createBackend } from './backend/backend';

const App: Component = () => {
  const openDirectory = async () => {
    const handle = await window.showDirectoryPicker();

    console.log(await createBackend(handle));
  };
  return (
    <div>
      <p>Test123</p>
      <button onClick={openDirectory}>Open Directory</button>
    </div>
  );
};

export default App;
