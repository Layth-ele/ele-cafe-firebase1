import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCustomerOrders, subscribeToCustomerOrders, ORDER_STATUS, PAYMENT_STATUS } from '../firebase/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  Calendar,
  DollarSign,
  MapPin,
  Eye,
  AlertCircle
} from 'lucide-react'

const CustomerOrders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadOrders = async () => {
      try {
        const result = await getCustomerOrders(user.uid)
        if (!result.error) {
          setOrders(result.orders)
        }
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()

    // Set up real-time listener
    const unsubscribe = subscribeToCustomerOrders(user.uid, (updatedOrders) => {
      setOrders(updatedOrders)
    })

    return unsubscribe
  }, [user])

  const getStatusColor = (status) => {
    const colors = {
      [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ORDER_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [ORDER_STATUS.PROCESSING]: 'bg-purple-100 text-purple-800',
      [ORDER_STATUS.SHIPPED]: 'bg-green-100 text-green-800',
      [ORDER_STATUS.DELIVERED]: 'bg-emerald-100 text-emerald-800',
      [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      [ORDER_STATUS.PENDING]: <Clock className="h-4 w-4" />,
      [ORDER_STATUS.CONFIRMED]: <CheckCircle className="h-4 w-4" />,
      [ORDER_STATUS.PROCESSING]: <Package className="h-4 w-4" />,
      [ORDER_STATUS.SHIPPED]: <Truck className="h-4 w-4" />,
      [ORDER_STATUS.DELIVERED]: <CheckCircle className="h-4 w-4" />,
      [ORDER_STATUS.CANCELLED]: <XCircle className="h-4 w-4" />
    }
    return icons[status] || <Clock className="h-4 w-4" />
  }

  const getStatusDescription = (status) => {
    const descriptions = {
      [ORDER_STATUS.PENDING]: 'Your order is awaiting admin confirmation. You will be notified when it\'s confirmed and payment is processed.',
      [ORDER_STATUS.CONFIRMED]: 'Your order has been confirmed and payment has been processed. We\'re preparing your items.',
      [ORDER_STATUS.PROCESSING]: 'Your order is being prepared for shipment.',
      [ORDER_STATUS.SHIPPED]: 'Your order has been shipped and is on its way to you.',
      [ORDER_STATUS.DELIVERED]: 'Your order has been delivered successfully.',
      [ORDER_STATUS.CANCELLED]: 'This order has been cancelled.'
    }
    return descriptions[status] || 'Unknown status'
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please log in to view your orders.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading your orders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track your tea orders and view order history
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.orderId}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status.toUpperCase()}</span>
                    </Badge>
                    {order.paymentStatus && (
                      <Badge variant="outline">
                        Payment: {order.paymentStatus}
                      </Badge>
                    )}
                  </div>
                  
                  {order.trackingNumber && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tracking: </span>
                      <span className="font-mono">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Status Description */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {getStatusDescription(order.status)}
                  </AlertDescription>
                </Alert>

                {/* Items Preview */}
                <div>
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground ml-2">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address:</h4>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        {order.shippingAddress.street}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.province}<br />
                        {order.shippingAddress.postalCode}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div>
                  <h4 className="font-semibold mb-2">Order Timeline:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Order placed - {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {order.confirmedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Order confirmed - {new Date(order.confirmedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {order.shippedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Order shipped - {new Date(order.shippedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {order.deliveredAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Order delivered - {new Date(order.deliveredAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">Special Instructions:</h4>
                    <p className="text-sm">{order.specialInstructions}</p>
                  </div>
                )}

                {/* Order Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                  </Button>
                  
                  {order.status === ORDER_STATUS.SHIPPED && order.trackingNumber && (
                    <Button variant="outline" size="sm">
                      <Truck className="h-4 w-4 mr-1" />
                      Track Package
                    </Button>
                  )}
                  
                  {order.status === ORDER_STATUS.DELIVERED && (
                    <Button variant="outline" size="sm">
                      Reorder Items
                    </Button>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedOrder === order.id && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Complete Item List:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-background rounded">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.category} • ${item.price.toFixed(2)} each
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                ${(item.quantity * item.price).toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Order Summary:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>
                            {order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-1">
                          <span>Total:</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {order.adminNotes && (
                      <div>
                        <h4 className="font-semibold mb-2">Admin Notes:</h4>
                        <p className="text-sm text-muted-foreground">{order.adminNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerOrders

