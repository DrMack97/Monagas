import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Si tienes un archivo CSS global (por ejemplo, Tailwind), impórtalo aquí abajo:
// import './styles/index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)