import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../firebase/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Truck,
  Phone,
  Mail
} from 'lucide-react'

const Checkout = () => {
  const navigate = useNavigate()
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [error, setError] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    // Customer info
    customerName: user?.displayName || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    
    // Shipping address
    shippingAddress: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Canada'
    },
    
    // Billing same as shipping
    billingAddressSame: true,
    billingAddress: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Canada'
    },
    
    // Special instructions
    specialInstructions: '',
    
    // Notification preferences
    emailNotifications: true,
    smsNotifications: false
  })

  // Calculate pricing
  const subtotal = getTotalPrice()
  const tax = subtotal * 0.13 // 13% HST for Canada
  const shipping = subtotal >= 75 ? 0 : 9.99
  const total = subtotal + tax + shipping

  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate('/cart')
    }
  }, [cartItems, orderPlaced, navigate])

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const validateForm = () => {
    const required = [
      'customerName',
      'customerEmail',
      'shippingAddress.street',
      'shippingAddress.city',
      'shippingAddress.province',
      'shippingAddress.postalCode'
    ]

    for (const field of required) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        if (!formData[parent][child]?.trim()) {
          return `${child.charAt(0).toUpperCase() + child.slice(1)} is required`
        }
      } else {
        if (!formData[field]?.trim()) {
          return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        }
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.customerEmail)) {
      return 'Please enter a valid email address'
    }

    // Phone validation (if SMS notifications enabled)
    if (formData.smsNotifications && !formData.customerPhone?.trim()) {
      return 'Phone number is required for SMS notifications'
    }

    return null
  }

  const handlePlaceOrder = async () => {
    setError('')
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Prepare order data
      const orderData = {
        customerId: user?.uid || '',
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.billingAddressSame ? formData.shippingAddress : formData.billingAddress,
        
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          image: item.image
        })),
        
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        total: total,
        
        specialInstructions: formData.specialInstructions,
        
        notificationPreferences: {
          email: formData.emailNotifications,
          sms: formData.smsNotifications
        }
      }

      const result = await createOrder(orderData)

      if (result.error) {
        setError('Failed to place order: ' + result.error)
      } else {
        setOrderDetails({
          orderId: result.orderNumber,
          total: total
        })
        setOrderPlaced(true)
        clearCart()
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800 dark:text-green-200">
                Order Placed Successfully!
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Your order has been received and is awaiting confirmation
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Order Number</div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {orderDetails.orderId}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Total: ${orderDetails.total.toFixed(2)} CAD
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>What happens next?</strong><br />
                  Your order is currently <Badge variant="secondary">Pending</Badge> and awaiting admin confirmation. 
                  Once our team reviews and confirms your order, you'll receive an email and SMS notification 
                  (if provided) confirming that your payment has been processed.
                </AlertDescription>
              </Alert>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">Order Process:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Order placed and received</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Awaiting admin confirmation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-500">Payment processing (after confirmation)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-500">Order preparation and shipping</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Notification Settings
                </h3>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email notifications: {formData.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>SMS notifications: {formData.smsNotifications ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/')} variant="outline">
                  Continue Shopping
                </Button>
                <Button onClick={() => navigate('/orders')}>
                  View My Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order - payment will be processed after admin confirmation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="Enter your phone number (for SMS notifications)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleInputChange('shippingAddress.street', e.target.value)}
                    placeholder="Enter your street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      value={formData.shippingAddress.province}
                      onChange={(e) => handleInputChange('shippingAddress.province', e.target.value)}
                      placeholder="Province"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => handleInputChange('shippingAddress.postalCode', e.target.value)}
                      placeholder="Postal Code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
                <CardDescription>
                  Any special requests or delivery instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Enter any special instructions for your order..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you'd like to receive order updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                  />
                  <Label htmlFor="emailNotifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email notifications (recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsNotifications"
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
                  />
                  <Label htmlFor="smsNotifications" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS notifications (requires phone number)
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        ${(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (HST)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <Badge variant="secondary">FREE</Badge>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {shipping === 0 && (
                    <div className="text-xs text-green-600">
                      🎉 Free shipping on orders over $75!
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)} CAD</span>
                  </div>
                </div>

                {/* Important Notice */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Important:</strong> Your order will be placed as "Pending" and payment will only be processed after admin confirmation. You'll be notified when your order is confirmed.
                  </AlertDescription>
                </Alert>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Place Order Button */}
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={loading || cartItems.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Place Order (${total.toFixed(2)})
                    </>
                  )}
                </Button>

                <div className="text-xs text-center text-muted-foreground">
                  By placing this order, you agree to our terms and conditions.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

