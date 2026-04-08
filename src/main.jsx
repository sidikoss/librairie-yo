import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Simple in-memory storage fallback (replaces window.storage from Claude artifacts)
if (!window.storage) {
  const store = {}
  window.storage = {
    get: async (key) => store[key] ? { key, value: store[key] } : null,
    set: async (key, value) => { store[key] = value; return { key, value } },
    delete: async (key) => { delete store[key]; return { key, deleted: true } },
    list: async (prefix) => ({ keys: Object.keys(store).filter(k => !prefix || k.startsWith(prefix)) })
  }

  // Persist to localStorage
  const LS_KEY = 'librairie-yo-storage'
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    Object.assign(store, saved)
  } catch {}

  const orig = window.storage.set
  window.storage.set = async (key, value) => {
    store[key] = value
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)) } catch {}
    return { key, value }
  }
  const origDel = window.storage.delete
  window.storage.delete = async (key) => {
    delete store[key]
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)) } catch {}
    return { key, deleted: true }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
