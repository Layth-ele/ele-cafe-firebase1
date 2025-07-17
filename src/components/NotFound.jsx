import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">404 - Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>The page you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound

