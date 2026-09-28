import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Kisan PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[SW] ServiceWorker registered with scope:', registration.scope);
        registration.update().catch(() => {});
      },
      (err) => {
        console.warn('[SW] ServiceWorker registration failed:', err);
      }
    );
  });
}

