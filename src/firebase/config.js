import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDELv7MD-vkyA9f-FRqYVepHEIT9i8gzTQ",
  authDomain: "ele-cafe-e-commerce-99617.firebaseapp.com",
  databaseURL: "https://ele-cafe-e-commerce-99617-default-rtdb.firebaseio.com",
  projectId: "ele-cafe-e-commerce-99617",
  storageBucket: "ele-cafe-e-commerce-99617.firebasestorage.app",
  messagingSenderId: "964255738580",
  appId: "1:964255738580:web:532a88faf7227cf6466941",
  measurementId: "G-CDV0CF6H6Y"
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

