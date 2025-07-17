// Updated Authentication System with Credit Integration
// src/firebase/auth.js

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { auth, database } from './config';
import { initializeUserCredits } from './credits';

// Create user account with credit initialization
export const createAccount = async (email, password, displayName, referralCode = null) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user profile in database
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || '',
      role: 'customer',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          orderUpdates: true,
          promotions: true
        },
        theme: 'light'
      }
    };

    // Save user profile
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, userProfile);

    // Initialize user credits with signup bonus and referral processing
    const creditResult = await initializeUserCredits(user.uid, referralCode);
    
    if (!creditResult.success) {
      console.warn('Failed to initialize user credits:', creditResult.error);
    }

    return {
      success: true,
      user: {
        ...user,
        ...userProfile
      },
      creditMessage: creditResult.message || 'Account created successfully!'
    };
  } catch (error) {
    console.error('Error creating account:', error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      await set(userRef, {
        ...userData,
        lastLoginAt: serverTimestamp()
      });
    }

    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Google Sign In with credit initialization
export const signInWithGoogle = async (referralCode = null) => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if this is a new user
    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    const isNewUser = !userSnapshot.exists();

    if (isNewUser) {
      // Create user profile for new Google user
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'customer',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        authProvider: 'google',
        preferences: {
          notifications: {
            email: true,
            sms: false,
            orderUpdates: true,
            promotions: true
          },
          theme: 'light'
        }
      };

      await set(userRef, userProfile);

      // Initialize credits for new Google user
      const creditResult = await initializeUserCredits(user.uid, referralCode);
      
      return {
        success: true,
        user: {
          ...user,
          ...userProfile
        },
        isNewUser: true,
        creditMessage: creditResult.message || 'Welcome! Account created with Google.'
      };
    } else {
      // Update last login for existing user
      const userData = userSnapshot.val();
      await set(userRef, {
        ...userData,
        lastLoginAt: serverTimestamp()
      });

      return {
        success: true,
        user: {
          ...user,
          ...userData
        },
        isNewUser: false
      };
    }
  } catch (error) {
    console.error('Error with Google sign in:', error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: 'Failed to sign out'
    };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent successfully'
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// Get user profile from database
export const getUserProfile = async (uid) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: 'Failed to get user profile'
    };
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const currentData = snapshot.val();
      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await set(userRef, updatedData);
      
      return {
        success: true,
        data: updatedData
      };
    } else {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update user profile'
    };
  }
};

// Check if user is admin
export const isAdmin = async (uid) => {
  try {
    const userProfile = await getUserProfile(uid);
    if (userProfile.success) {
      return userProfile.data.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Subscribe to auth state changes
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get additional user data from database
      const userProfile = await getUserProfile(user.uid);
      if (userProfile.success) {
        callback({
          ...user,
          ...userProfile.data
        });
      } else {
        callback(user);
      }
    } else {
      callback(null);
    }
  });
};

// Validate referral code format
export const validateReferralCode = (code) => {
  if (!code) return { valid: false, error: 'Referral code is required' };
  
  // Basic validation - should be 12 characters alphanumeric
  const codeRegex = /^[A-Z0-9]{12}$/;
  if (!codeRegex.test(code)) {
    return { 
      valid: false, 
      error: 'Invalid referral code format' 
    };
  }
  
  return { valid: true };
};

// Check if referral code exists
export const checkReferralCode = async (referralCode) => {
  try {
    const validation = validateReferralCode(referralCode);
    if (!validation.valid) {
      return validation;
    }

    // Check if referral code exists in database
    const userCreditsRef = ref(database, 'userCredits');
    const snapshot = await get(userCreditsRef);
    
    if (snapshot.exists()) {
      const allUserCredits = snapshot.val();
      const referralExists = Object.values(allUserCredits).some(
        userCredit => userCredit.referralCode === referralCode
      );
      
      if (referralExists) {
        return { 
          valid: true, 
          exists: true,
          message: 'Valid referral code! You\'ll receive bonus credits after signup.' 
        };
      } else {
        return { 
          valid: false, 
          exists: false,
          error: 'Referral code not found' 
        };
      }
    }
    
    return { 
      valid: false, 
      exists: false,
      error: 'Unable to verify referral code' 
    };
  } catch (error) {
    console.error('Error checking referral code:', error);
    return { 
      valid: false, 
      error: 'Failed to verify referral code' 
    };
  }
};

// Get error message for Firebase auth errors
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled';
    default:
      return 'An error occurred. Please try again';
  }
};

// Auth state change listener (alias for subscribeToAuthState)
export const onAuthStateChange = subscribeToAuthState;

// Check admin status (alias for isAdmin)
export const checkAdminStatus = isAdmin;

// Export all functions
export default {
  createAccount,
  signInUser,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  isAdmin,
  subscribeToAuthState,
  onAuthStateChange,
  checkAdminStatus,
  validateReferralCode,
  checkReferralCode
};

