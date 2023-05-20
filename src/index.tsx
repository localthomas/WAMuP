/* @refresh reload */
import { render } from 'solid-js/web';
import { hashIntegration, Router } from "@solidjs/router";

import './index.css';
import App from './components/App';

render(() => (
    <Router source={hashIntegration()}>
        <App />
    </Router>
), document.getElementById('root') as HTMLElement);
