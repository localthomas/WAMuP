/* @refresh reload */
import { render } from 'solid-js/web';
import { hashIntegration, Router } from "@solidjs/router";

import './index.css';
import App from './components/App';

// request persistent storage from the browser to keep the cache (IndexedDB) between restarts
async function persistData() {
    if (navigator.storage && navigator.storage.persist) {
        if (!await navigator.storage.persisted()) {
            const result = await navigator.storage.persist();
            console.log(`Data persisted: ${result}`);
        }
    }
}
persistData();

render(() => (
    <Router source={hashIntegration()}>
        <App />
    </Router>
), document.getElementById('root') as HTMLElement);
