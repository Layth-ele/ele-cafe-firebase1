import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getFeaturedProducts } from '../firebase/products'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useCart } from '../context/CartContext'
import { Plus, Minus, ShoppingCart, Eye } from 'lucide-react'

const Home = () => {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addToCart, updateQuantity, getItemQuantity } = useCart()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [categoriesResult, featuredResult] = await Promise.all([
          getCategories(),
          getFeaturedProducts(6)
        ])

        console.log('Categories result:', categoriesResult)
        console.log('Featured products result:', featuredResult)

        if (categoriesResult.success) {
          setCategories(categoriesResult.categories || [])
        } else {
          console.error('Categories error:', categoriesResult.error)
        }

        if (featuredResult.success) {
          setFeaturedProducts(featuredResult.products || [])
        } else {
          console.error('Featured products error:', featuredResult.error)
        }
      } catch (error) {
        console.error('Error loading home data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getCategoryColor = (category) => {
    const colors = {
      'Black Tea': 'bg-slate-700',
      'Green Tea': 'bg-green-600',
      'Herbal Tea': 'bg-purple-600',
      'Oolong Tea': 'bg-blue-500',
      'White Tea': 'bg-gray-100 text-gray-800',
      'Rooibos Tea': 'bg-red-500',
      'Fruit Tea': 'bg-orange-500',
      'Flower Tea': 'bg-pink-500'
    }
    return colors[category] || 'bg-primary'
  }

  // Quantity Control Component
  const QuantityControl = ({ product }) => {
    const currentQuantity = getItemQuantity(product.id)
    const isInStock = product.in_stock && product.stock_quantity > 0

    if (!isInStock) {
      return (
        <Button size="sm" disabled className="w-full">
          Out of Stock
        </Button>
      )
    }

    if (currentQuantity === 0) {
      return (
        <Button 
          size="sm" 
          onClick={() => addToCart(product)}
          className="w-full"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      )
    }

    return (
      <div className="flex items-center justify-center w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuantity(product.id, currentQuantity - 1)}
          className="h-8 w-8 p-0 rounded-l-md rounded-r-none border-r-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="h-8 px-3 border-t border-b border-input bg-background flex items-center justify-center min-w-[3rem] text-sm font-medium">
          {currentQuantity}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuantity(product.id, currentQuantity + 1)}
          className="h-8 w-8 p-0 rounded-r-md rounded-l-none border-l-0"
          disabled={currentQuantity >= product.stock_quantity}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-luxury text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium Tea Collection
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover the finest teas from around the world
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tea Categories</h2>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id || category.slug}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-full ${getCategoryColor(category.name)} text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl font-bold">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} products
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>No categories available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow flex flex-col h-full">
                  <CardHeader className="pb-4">
                    <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden relative">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                      
                      {/* Discount Badge - Positioned absolutely */}
                      {product.discount_active && product.discount_percentage > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="font-bold">
                            -{product.discount_percentage}% OFF
                          </Badge>
                        </div>
                      )}
                      
                      {/* Stock Status */}
                      {(!product.in_stock || product.stock_quantity <= 0) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary" className="text-white bg-black/70">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg leading-tight flex-1">{product.name}</CardTitle>
                        <div className="text-right flex-shrink-0">
                          {product.discount_active && product.discount_percentage > 0 ? (
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground line-through">
                                ${product.price.toFixed(2)}
                              </div>
                              <div className="font-bold text-primary text-lg">
                                ${(product.price * (1 - product.discount_percentage / 100)).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-primary text-lg">
                              ${product.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <CardDescription className="line-clamp-2 text-sm">
                        {product.description}
                      </CardDescription>
                      
                      {/* Category and Stock Info */}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.in_stock && product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                          <span className="text-xs text-orange-600 font-medium">
                            Only {product.stock_quantity} left
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Card Footer with Actions */}
                  <CardFooter className="pt-4 mt-auto">
                    <div className="w-full space-y-3">
                      {/* Quantity Control */}
                      <QuantityControl product={product} />
                      
                      {/* View Details Button */}
                      <Link 
                        to={`/tea-profile/${product.id}`}
                        className="w-full"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>No featured products available at the moment.</p>
            </div>
          )}
          
          {/* View All Products */}
          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Free Shipping Banner */}
      <section className="py-8 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-2">Free Shipping on Orders Over $75</h3>
          <p className="opacity-90">Enjoy complimentary shipping on all qualifying orders</p>
        </div>
      </section>
    </div>
  )
}

export default Home

