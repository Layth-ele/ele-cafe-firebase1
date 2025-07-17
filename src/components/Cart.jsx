import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react'

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()

  const freeShippingThreshold = 75
  const cartTotal = getTotalPrice()
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal)
  const tax = cartTotal * 0.13 // 13% HST for Canada
  const shipping = cartTotal >= freeShippingThreshold ? 0 : 9.99
  const finalTotal = cartTotal + tax + shipping

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login?redirect=/checkout')
      return
    }
    navigate('/checkout')
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some delicious teas to get started!
              </p>
              <Button onClick={() => navigate('/')}>
                Start Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">
          Review your items and proceed to checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Items ({cartItems.length} items)</CardTitle>
              <Button variant="outline" size="sm" onClick={clearCart}>
                Clear Cart
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {item.discount_active && item.discount_percentage > 0 ? (
                        <div>
                          <span className="text-sm text-muted-foreground line-through">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="font-bold text-primary ml-2">
                            ${(item.price * (1 - item.discount_percentage / 100)).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                      {item.discount_active && (
                        <Badge variant="destructive" className="text-xs">
                          {item.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">
                      ${(item.quantity * (item.discount_active ? 
                        item.price * (1 - item.discount_percentage / 100) : 
                        item.price)).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} × ${(item.discount_active ? 
                        item.price * (1 - item.discount_percentage / 100) : 
                        item.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Free Shipping Progress */}
              {remainingForFreeShipping > 0 ? (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Add ${remainingForFreeShipping.toFixed(2)} more for free shipping!
                  </p>
                  <div className="w-full bg-background rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg">
                  <p className="text-sm font-medium">🎉 You qualify for free shipping!</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (HST)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <Badge variant="secondary">FREE</Badge>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)} CAD</span>
                </div>
              </div>

              {/* Important Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>New:</strong> Orders require admin confirmation before payment processing. 
                  You'll be notified when your order is confirmed.
                </AlertDescription>
              </Alert>

              {/* Login Notice */}
              {!user && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Please log in to proceed with checkout.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {user ? 'Proceed to Checkout' : 'Login to Checkout'}
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                Secure checkout • SSL encrypted
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Cart

