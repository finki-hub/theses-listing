import { render } from '@solidjs/web';
import '@fontsource-variable/inter';

import './app.css';
import { initAnalytics } from '@/lib/analytics.ts';

import App from './App';

void initAnalytics();

const root = document.querySelector('#root');

if (root === null) {
  throw new Error('Root element not found');
}

render(() => <App />, root);
