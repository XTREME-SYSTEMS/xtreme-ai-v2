import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.DEV) {
      // Dev: never register a service worker, and clear any stale worker/caches
      // left from a previous production build so they don't serve old JS.
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      } catch {}
    } else {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)