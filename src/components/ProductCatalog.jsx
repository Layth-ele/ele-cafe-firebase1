import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getProducts } from '../firebase/products'
import { useCart } from '../context/CartContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Minus, ShoppingCart, Eye } from 'lucide-react'

const ProductCatalog = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [searchParams] = useSearchParams()
  const { addToCart, updateQuantity, getItemQuantity } = useCart()

  useEffect(() => {
    const category = searchParams.get('category')
    if (category) {
      setSelectedCategory(category)
    }
  }, [searchParams])

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const filters = {
          in_stock_only: true
        }

        if (selectedCategory && selectedCategory !== 'all') {
          filters.category = selectedCategory
        }

        if (searchTerm) {
          filters.search = searchTerm
        }

        if (sortBy) {
          filters.sort_by = sortBy
        }

        console.log('Loading products with filters:', filters)
        const result = await getProducts(filters)
        console.log('Products result:', result)

        if (result.success) {
          setProducts(result.products || [])
        } else {
          console.error('Products error:', result.error)
          setError(result.error || 'Failed to load products')
        }
      } catch (error) {
        console.error('Error loading products:', error)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [selectedCategory, searchTerm, sortBy])

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
          <p>Loading products...</p>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tea Collection</h1>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search teas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/3"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Black Tea">Black Tea</SelectItem>
            <SelectItem value="Green Tea">Green Tea</SelectItem>
            <SelectItem value="Herbal Tea">Herbal Tea</SelectItem>
            <SelectItem value="Oolong Tea">Oolong Tea</SelectItem>
            <SelectItem value="White Tea">White Tea</SelectItem>
            <SelectItem value="Rooibos Tea">Rooibos Tea</SelectItem>
            <SelectItem value="Fruit Tea">Fruit Tea</SelectItem>
            <SelectItem value="Flower Tea">Flower Tea</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
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
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      {product.seasonal_promotion && (
                        <Badge variant="outline" className="text-xs">Seasonal</Badge>
                      )}
                    </div>
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductCatalog

