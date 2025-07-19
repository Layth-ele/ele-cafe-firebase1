import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || process.env.REACT_APP_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID || ""
}

// Validate Firebase configuration
const isValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId
if (!isValidConfig) {
  console.warn('⚠️ Firebase configuration is incomplete. Please add your Firebase credentials to environment variables.')
  console.warn('Required environment variables:')
  console.warn('- VITE_FIREBASE_API_KEY (for Vite) or REACT_APP_FIREBASE_API_KEY (for Create React App)')
  console.warn('- VITE_FIREBASE_PROJECT_ID (for Vite) or REACT_APP_FIREBASE_PROJECT_ID (for Create React App)')
  console.warn('- And other Firebase configuration values...')
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const database = getDatabase(app)
export const storage = getStorage(app)

// Admin configuration
export const ADMIN_EMAILS = [
  'info@elecafe.ca'
]

// Check if user is admin
export const isAdmin = (userEmail) => {
  return ADMIN_EMAILS.includes(userEmail?.toLowerCase())
}

export default app

