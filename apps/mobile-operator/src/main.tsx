// src/main.tsx
//
// Punto de entrada Vite — index.html carga este archivo directamente
// vía <script type="module" src="/src/main.tsx">. Sin este archivo
// la app no arranca (pantalla en blanco).

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
