import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, database, isAdmin } from './config'

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

// Register new user
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update user profile
    await updateProfile(user, {
      displayName: displayName
    })

    // Determine user role
    const userRole = isAdmin(email) ? 'admin' : 'customer'

    // Create user document in Realtime Database
    await set(ref(database, `users/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: userRole,
      isAdmin: isAdmin(email)
    })

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update last login and check admin status
    const userRef = ref(database, `users/${user.uid}`)
    const snapshot = await get(userRef)
    const userData = snapshot.val() || {}

    await set(userRef, {
      ...userData,
      lastLogin: new Date().toISOString(),
      isAdmin: isAdmin(email)
    })

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Determine user role
    const userRole = isAdmin(user.email) ? 'admin' : 'customer'

    // Check if user document exists, create if not
    const userRef = ref(database, `users/${user.uid}`)
    const snapshot = await get(userRef)
    
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        role: userRole,
        provider: 'google',
        isAdmin: isAdmin(user.email)
      })
    } else {
      // Update last login and admin status
      const userData = snapshot.val()
      await set(userRef, {
        ...userData,
        lastLogin: new Date().toISOString(),
        isAdmin: isAdmin(user.email)
      })
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Get user profile from Realtime Database
export const getUserProfile = async (uid) => {
  try {
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)
    
    if (snapshot.exists()) {
      return { profile: snapshot.val(), error: null }
    } else {
      return { profile: null, error: 'User profile not found' }
    }
  } catch (error) {
    return { profile: null, error: error.message }
  }
}

// Update user profile
export const updateUserProfile = async (uid, profileData) => {
  try {
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)
    const currentData = snapshot.val() || {}

    await set(userRef, {
      ...currentData,
      ...profileData,
      updatedAt: new Date().toISOString()
    })
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Check if current user is admin
export const checkAdminStatus = async (user) => {
  if (!user) return false
  
  try {
    const userRef = ref(database, `users/${user.uid}`)
    const snapshot = await get(userRef)
    
    if (snapshot.exists()) {
      const userData = snapshot.val()
      return userData.isAdmin || isAdmin(user.email)
    }
    return isAdmin(user.email)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return isAdmin(user.email)
  }
}

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const usersRef = ref(database, 'users')
    const snapshot = await get(usersRef)
    
    if (snapshot.exists()) {
      const usersData = snapshot.val()
      const users = Object.keys(usersData).map(uid => ({
        uid,
        ...usersData[uid]
      }))
      return { users, error: null }
    } else {
      return { users: [], error: null }
    }
  } catch (error) {
    return { users: [], error: error.message }
  }
}

// Update user role (admin only)
export const updateUserRole = async (uid, newRole) => {
  try {
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)
    const currentData = snapshot.val() || {}

    await set(userRef, {
      ...currentData,
      role: newRole,
      isAdmin: newRole === 'admin',
      updatedAt: new Date().toISOString()
    })
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

