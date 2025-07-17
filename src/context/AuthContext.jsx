import React, { createContext, useContext, useState, useEffect } from 'react'
import { subscribeToAuthState, isAdmin, signOutUser } from '../firebase/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setUser(user)
      
      if (user) {
        const adminStatus = await isAdmin(user.uid)
        setIsAdminUser(adminStatus)
      } else {
        setIsAdminUser(false)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    isAdmin: isAdminUser,
    loading,
    signOutUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

