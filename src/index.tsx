/* @refresh reload */
import { render } from 'solid-js/web';

import 'pollen-css';
import './index.css';
import App from './components/App';

render(() => <App />, document.getElementById('root') as HTMLElement);
