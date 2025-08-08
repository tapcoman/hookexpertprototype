import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force light theme for v0.dev design
if (typeof window !== 'undefined') {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
  localStorage.setItem('theme', 'light')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)