import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1F2937',
          color: '#fff',
          borderRadius: '10px',
          padding: '12px 20px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif'
        },
        success: {
          iconTheme: {
            primary: '#22C55E',
            secondary: '#fff'
          }
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff'
          }
        }
      }}
    />
  </StrictMode>
)