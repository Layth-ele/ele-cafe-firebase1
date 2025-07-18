import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  // Add your Firebase config here
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

