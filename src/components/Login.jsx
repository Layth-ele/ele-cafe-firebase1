import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInUser, signInWithGoogle } from '../firebase/auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signInUser(email, password)
    
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    const result = await signInWithGoogle()
    
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Sign in with Google
            </Button>
            <div className="text-center text-sm space-y-2">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
              <div>
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default Login

