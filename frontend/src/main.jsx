import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import Web3AuthWrapper from './context/Web3AuthWrapper'
import './index.css'

const toasterConfig = {
  position: 'top-right',
  toastOptions: {
    duration: 4000,
    style: {
      background: '#fff',
      color: '#111',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      border: '1px solid #f0f0f0',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3AuthWrapper>
      <BrowserRouter>
        <App />
        <Toaster {...toasterConfig} />
      </BrowserRouter>
    </Web3AuthWrapper>
  </React.StrictMode>
)
