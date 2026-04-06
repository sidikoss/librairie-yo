import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Service Worker — cache offline pour visites ultra-rapides
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
