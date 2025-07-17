import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Ele Cafe</h3>
            <p className="text-sm text-muted-foreground">
              Premium tea collection from around the world
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/products" className="text-muted-foreground hover:text-foreground">Products</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=Black Tea" className="text-muted-foreground hover:text-foreground">Black Tea</Link></li>
              <li><Link to="/products?category=Green Tea" className="text-muted-foreground hover:text-foreground">Green Tea</Link></li>
              <li><Link to="/products?category=Herbal Tea" className="text-muted-foreground hover:text-foreground">Herbal Tea</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-sm text-muted-foreground">
              info@elecafe.ca
            </p>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Ele Cafe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

