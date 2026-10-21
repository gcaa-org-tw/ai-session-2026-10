import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('root element missing');

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  void import('./e2eHooks');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
