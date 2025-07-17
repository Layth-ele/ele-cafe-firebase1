import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeNotificationServices } from './services/notifications'

// Initialize notification services
initializeNotificationServices().then((result) => {
  if (result.success) {
    console.log('✅ Notification services initialized successfully')
  } else {
    console.warn('⚠️ Failed to initialize notification services:', result.error)
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

