import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById, getProducts, incrementProductViews } from '../firebase/products'
import { useCart } from '../context/CartContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Heart, 
  Leaf, 
  Coffee, 
  Shield, 
  MapPin, 
  Globe,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Star,
  Clock,
  Thermometer
} from 'lucide-react'

// Serving options data
const servingOptions = {
  infused_tea: {
    id: 'infused_tea',
    name: 'Infused Tea',
    icon: '🍵',
    description: 'Traditional hot tea preparation with perfect steeping',
    temperature: 'Hot (85-100°C)',
    preparation_time: '3-5 minutes'
  },
  iced_tea: {
    id: 'iced_tea',
    name: 'Iced Tea',
    icon: '🧊',
    description: 'Refreshing cold-brewed tea served over ice',
    temperature: 'Cold (4-8°C)',
    preparation_time: '2-4 hours'
  },
  fresh_milk_iced_tea: {
    id: 'fresh_milk_iced_tea',
    name: 'Fresh Milk Iced Tea',
    icon: '🥛',
    description: 'Creamy iced tea with fresh milk for a smooth taste',
    temperature: 'Cold (4-8°C)',
    preparation_time: '5-10 minutes'
  },
  hot_tea_latte: {
    id: 'hot_tea_latte',
    name: 'Tea Latte',
    icon: '☕',
    description: 'Rich and creamy hot tea latte with steamed milk',
    temperature: 'Hot (65-70°C)',
    preparation_time: '5-8 minutes'
  },
  bubble_tea: {
    id: 'bubble_tea',
    name: 'Bubble Tea',
    icon: '🧋',
    description: 'Fun bubble tea with chewy tapioca pearls',
    temperature: 'Cold (4-8°C)',
    preparation_time: '10-15 minutes'
  }
}

// Helper function to convert slug to search terms
const slugToSearchTerms = (slug) => {
  // Convert slug like "green-dragon-well" to "Green Dragon Well"
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to check if a string looks like a Firebase ID
const isFirebaseId = (str) => {
  // Firebase IDs are typically alphanumeric with dashes, around 20 characters
  return /^[a-zA-Z0-9_-]{15,}$/.test(str)
}

const TeaProfile = () => {
  const { id } = useParams() // This could be either an ID or a slug
  const navigate = useNavigate()
  const [tea, setTea] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedServingOption, setSelectedServingOption] = useState(null)
  const { addToCart, updateQuantity, getItemQuantity } = useCart()

  useEffect(() => {
    const loadTea = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let teaData = null
        
        if (id) {
          console.log('Loading tea with parameter:', id)
          
          // Check if the parameter looks like a Firebase ID
          if (isFirebaseId(id)) {
            console.log('Parameter looks like Firebase ID, trying getProductById...')
            const result = await getProductById(id)
            console.log('Product by ID result:', result)
            
            if (result.success) {
              teaData = result.product
            }
          }
          
          // If we don't have tea data yet, try to find by name/slug
          if (!teaData) {
            console.log('Trying to find product by name/slug...')
            const allProductsResult = await getProducts()
            console.log('All products result:', allProductsResult)
            
            if (allProductsResult.success && allProductsResult.products) {
              // Convert slug to potential tea name
              const searchName = slugToSearchTerms(id)
              console.log('Searching for tea name:', searchName)
              
              // Try exact match first
              teaData = allProductsResult.products.find(product => 
                product.name && product.name.toLowerCase() === searchName.toLowerCase()
              )
              
              // If no exact match, try partial match
              if (!teaData) {
                teaData = allProductsResult.products.find(product => 
                  product.name && product.name.toLowerCase().includes(searchName.toLowerCase())
                )
              }
              
              // If still no match, try matching individual words
              if (!teaData) {
                const searchWords = searchName.toLowerCase().split(' ')
                teaData = allProductsResult.products.find(product => {
                  if (!product.name) return false
                  const productName = product.name.toLowerCase()
                  return searchWords.every(word => productName.includes(word))
                })
              }
              
              console.log('Found tea by name search:', teaData)
            }
          }
        }
        
        if (teaData) {
          setTea(teaData)
          setSelectedServingOption(teaData.default_serving_option || 'infused_tea')
          
          // Increment view count
          if (teaData.id) {
            incrementProductViews(teaData.id)
          }
        } else {
          console.log('Tea not found for parameter:', id)
          setError('Tea not found')
        }
      } catch (error) {
        console.error('Error loading tea:', error)
        setError('Failed to load tea details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadTea()
    }
  }, [id])

  const handleShare = (platform) => {
    const url = window.location.href
    const text = `Check out this amazing ${tea.name} tea from Ele Cafe!`
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`)
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(tea.name + ' - Ele Cafe')}&body=${encodeURIComponent(text + '\n\n' + url)}`)
        break
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          // You could add a toast notification here
          alert('Link copied to clipboard!')
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = url
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert('Link copied to clipboard!')
        })
        break
      default:
        break
    }
  }

  // Quantity Control Component
  const QuantityControl = () => {
    const currentQuantity = getItemQuantity(tea.id)
    const isInStock = tea.in_stock && tea.stock_quantity > 0

    if (!isInStock) {
      return (
        <Button size="lg" disabled className="w-full">
          Out of Stock
        </Button>
      )
    }

    if (currentQuantity === 0) {
      return (
        <Button 
          size="lg" 
          onClick={() => addToCart(tea)}
          className="w-full"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Add to Cart - ${tea.price.toFixed(2)}
        </Button>
      )
    }

    return (
      <div className="flex items-center justify-center w-full gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => updateQuantity(tea.id, currentQuantity - 1)}
          className="h-12 w-12 p-0"
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="h-12 px-6 border border-input bg-background flex items-center justify-center min-w-[4rem] text-lg font-medium rounded-md">
          {currentQuantity}
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => updateQuantity(tea.id, currentQuantity + 1)}
          className="h-12 w-12 p-0"
          disabled={currentQuantity >= tea.stock_quantity}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tea profile...</p>
        </div>
      </div>
    )
  }

  if (error || !tea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tea Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || `The tea "${id}" could not be found.`}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Searched for: "{slugToSearchTerms(id)}"
          </p>
          <Button onClick={() => navigate('/products')}>
            Browse All Teas
          </Button>
        </div>
      </div>
    )
  }

  const currentServingOption = servingOptions[selectedServingOption]
  const availableServingOptions = tea.available_serving_options || ['infused_tea']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Main Card */}
        <Card className="overflow-hidden shadow-2xl">
          {/* Header Section */}
          <CardHeader className="text-center py-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="text-4xl md:text-5xl font-bold mb-4">
              {tea.name}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < Math.floor(tea.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="ml-2 text-white/90">({tea.reviews_count || 0} reviews)</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {tea.category}
            </Badge>
          </CardHeader>

          {/* Description Section */}
          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-8">
            <div className="text-center">
              <Badge className="mb-4 bg-indigo-600 hover:bg-indigo-700">
                DESCRIPTION
              </Badge>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                {tea.description}
              </p>
            </div>
          </div>

          {/* Tea Details Section */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Tea Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Benefits */}
              {tea.benefits && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Heart className="h-6 w-6 text-red-500" />
                      <h3 className="text-xl font-semibold text-gray-800">Benefits:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {Array.isArray(tea.benefits) ? tea.benefits.join(', ') : tea.benefits}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Ingredients */}
              {tea.ingredients && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Leaf className="h-6 w-6 text-green-500" />
                      <h3 className="text-xl font-semibold text-gray-800">Ingredients:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {Array.isArray(tea.ingredients) ? tea.ingredients.join(', ') : tea.ingredients}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Caffeine */}
              {tea.caffeine_level && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Coffee className="h-6 w-6 text-amber-600" />
                      <h3 className="text-xl font-semibold text-gray-800">Caffeine:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {tea.caffeine_level}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Antioxidants */}
              {tea.antioxidants && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-purple-500" />
                      <h3 className="text-xl font-semibold text-gray-800">Antioxidants:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {tea.antioxidants}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* From */}
              {tea.origin && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="h-6 w-6 text-blue-500" />
                      <h3 className="text-xl font-semibold text-gray-800">From:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {tea.origin}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Regions */}
              {tea.regions && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-6 w-6 text-emerald-500" />
                      <h3 className="text-xl font-semibold text-gray-800">Regions:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {Array.isArray(tea.regions) ? tea.regions.join(' / ') : tea.regions}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Serving Options Section */}
          <div className="p-8 bg-white">
            <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
              Enjoy This Tea Today at Ele Cafe:
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {availableServingOptions.map((optionId) => {
                const option = servingOptions[optionId]
                if (!option) return null
                
                const isSelected = selectedServingOption === optionId
                
                return (
                  <Card 
                    key={optionId}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      isSelected 
                        ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedServingOption(optionId)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-3">{option.icon}</div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {option.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                        <Thermometer className="h-4 w-4" />
                        {option.temperature}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {option.preparation_time}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Selected Serving Option Details */}
            {currentServingOption && (
              <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{currentServingOption.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {currentServingOption.name}
                    </h3>
                    <p className="text-gray-700 mb-4">
                      {currentServingOption.description}
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4" />
                        {currentServingOption.temperature}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {currentServingOption.preparation_time}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add to Cart Section */}
            <div className="text-center mb-8">
              <div className="mb-4">
                {tea.discount_active && tea.discount_percentage > 0 ? (
                  <div className="space-y-2">
                    <div className="text-lg text-gray-500 line-through">
                      ${tea.price.toFixed(2)}
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">
                      ${(tea.price * (1 - tea.discount_percentage / 100)).toFixed(2)}
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      -{tea.discount_percentage}% OFF
                    </Badge>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-indigo-600">
                    ${tea.price.toFixed(2)}
                  </span>
                )}
                <span className="text-gray-600 ml-2">per {tea.weight || '100g'}</span>
              </div>
              <div className="max-w-md mx-auto">
                <QuantityControl />
              </div>
              {tea.stock_quantity <= 10 && tea.stock_quantity > 0 && (
                <p className="text-orange-600 text-sm mt-2">
                  Only {tea.stock_quantity} left in stock!
                </p>
              )}
            </div>

            {/* Social Sharing */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Share this tea with your friends!
              </h3>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleShare('whatsapp')}
                  className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleShare('email')}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleShare('copy')}
                  className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TeaProfile

