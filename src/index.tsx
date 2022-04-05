/* @refresh reload */
import { render } from 'solid-js/web';
import { Router } from "solid-app-router";

import 'pollen-css';
import './index.css';
import App from './components/App';

render(() => (
    <Router>
        <App />
    </Router>
), document.getElementById('root') as HTMLElement);
