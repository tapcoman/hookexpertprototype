import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enable dark theme by default for the premium cosmic experience
if (typeof window !== 'undefined' && !localStorage.getItem('theme')) {
  document.documentElement.classList.add('dark')
  localStorage.setItem('theme', 'dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)