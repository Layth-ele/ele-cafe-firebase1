import React, { useState, useEffect } from 'react'
import { 
  getAllOrders, 
  confirmOrder, 
  updateOrderStatus, 
  cancelOrder,
  addTrackingNumber,
  getOrderStatistics,
  ORDER_STATUS,
  PAYMENT_STATUS,
  subscribeToOrders
} from '../../firebase/orders'
import { sendOrderNotification } from '../../services/notifications'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  Eye, 
  MessageSquare,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  MapPin,
  User,
  ShoppingBag
} from 'lucide-react'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statistics, setStatistics] = useState(null)
  const [confirmingOrder, setConfirmingOrder] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notificationResult, setNotificationResult] = useState(null)

  // Load orders and statistics
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [ordersResult, statsResult] = await Promise.all([
          getAllOrders(),
          getOrderStatistics()
        ])

        if (!ordersResult.error) {
          setOrders(ordersResult.orders)
        }

        if (!statsResult.error) {
          setStatistics(statsResult.stats)
        }
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Set up real-time listener
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders)
    })

    return unsubscribe
  }, [])

  // Filter orders based on status and search
  useEffect(() => {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(search) ||
        order.customerEmail.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, statusFilter, searchTerm])

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

  const handleConfirmOrder = async (orderId) => {
    setConfirmingOrder(orderId)
    try {
      const result = await confirmOrder(orderId, adminNotes)
      
      if (!result.error) {
        // Send notification to customer
        const order = orders.find(o => o.id === orderId)
        if (order) {
          const notificationResult = await sendOrderNotification('ORDER_CONFIRMED', order, {
            email: true,
            sms: !!order.customerPhone
          })
          setNotificationResult(notificationResult)
        }
        
        setAdminNotes('')
        alert('Order confirmed successfully! Customer has been notified.')
      } else {
        alert('Error confirming order: ' + result.error)
      }
    } catch (error) {
      alert('Error confirming order: ' + error.message)
    } finally {
      setConfirmingOrder(null)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus, adminNotes)
      
      if (!result.error) {
        // Send notification for shipped orders
        if (newStatus === ORDER_STATUS.SHIPPED) {
          const order = orders.find(o => o.id === orderId)
          if (order) {
            await sendOrderNotification('ORDER_SHIPPED', order, {
              email: true,
              sms: !!order.customerPhone
            })
          }
        }
        
        setAdminNotes('')
        alert('Order status updated successfully!')
      } else {
        alert('Error updating order: ' + result.error)
      }
    } catch (error) {
      alert('Error updating order: ' + error.message)
    }
  }

  const handleAddTracking = async (orderId) => {
    if (!trackingNumber.trim()) {
      alert('Please enter a tracking number')
      return
    }

    try {
      const result = await addTrackingNumber(orderId, trackingNumber)
      
      if (!result.error) {
        setTrackingNumber('')
        alert('Tracking number added successfully!')
      } else {
        alert('Error adding tracking number: ' + result.error)
      }
    } catch (error) {
      alert('Error adding tracking number: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">Manage customer orders and confirmations</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${statistics.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${statistics.averageOrderValue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search orders by ID, customer email, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value={ORDER_STATUS.PENDING}>Pending</SelectItem>
            <SelectItem value={ORDER_STATUS.CONFIRMED}>Confirmed</SelectItem>
            <SelectItem value={ORDER_STATUS.PROCESSING}>Processing</SelectItem>
            <SelectItem value={ORDER_STATUS.SHIPPED}>Shipped</SelectItem>
            <SelectItem value={ORDER_STATUS.DELIVERED}>Delivered</SelectItem>
            <SelectItem value={ORDER_STATUS.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.orderId}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {order.customerName} ({order.customerEmail})
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status.toUpperCase()}</span>
                  </Badge>
                  <div className="text-right">
                    <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.quantity}× {item.name} - ${(item.quantity * item.price).toFixed(2)}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
                
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
              </div>
              
              {order.specialInstructions && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Special Instructions:</h4>
                  <p className="text-sm">{order.specialInstructions}</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between items-center">
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Order Details - {order.orderId}</DialogTitle>
                      <DialogDescription>
                        Complete order information and management options
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold">Customer Information</Label>
                            <div className="mt-2 space-y-1 text-sm">
                              <div>Name: {order.customerName}</div>
                              <div>Email: {order.customerEmail}</div>
                              {order.customerPhone && <div>Phone: {order.customerPhone}</div>}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="font-semibold">Order Information</Label>
                            <div className="mt-2 space-y-1 text-sm">
                              <div>Status: {order.status}</div>
                              <div>Payment: {order.paymentStatus}</div>
                              <div>Total: ${order.total.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Items Ordered</Label>
                          <div className="mt-2 space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity} × ${item.price.toFixed(2)}
                                  </div>
                                </div>
                                <div className="font-semibold">
                                  ${(item.quantity * item.price).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="actions" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="admin-notes">Admin Notes</Label>
                            <Textarea
                              id="admin-notes"
                              placeholder="Add notes about this order..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="tracking">Tracking Number</Label>
                            <div className="flex gap-2">
                              <Input
                                id="tracking"
                                placeholder="Enter tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                              />
                              <Button onClick={() => handleAddTracking(order.id)}>
                                Add
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            {order.status === ORDER_STATUS.PENDING && (
                              <Button 
                                onClick={() => handleConfirmOrder(order.id)}
                                disabled={confirmingOrder === order.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {confirmingOrder === order.id ? 'Confirming...' : 'Confirm Order'}
                              </Button>
                            )}
                            
                            {order.status === ORDER_STATUS.CONFIRMED && (
                              <Button onClick={() => handleUpdateStatus(order.id, ORDER_STATUS.PROCESSING)}>
                                <Package className="h-4 w-4 mr-1" />
                                Mark as Processing
                              </Button>
                            )}
                            
                            {order.status === ORDER_STATUS.PROCESSING && (
                              <Button onClick={() => handleUpdateStatus(order.id, ORDER_STATUS.SHIPPED)}>
                                <Truck className="h-4 w-4 mr-1" />
                                Mark as Shipped
                              </Button>
                            )}
                            
                            {order.status === ORDER_STATUS.SHIPPED && (
                              <Button onClick={() => handleUpdateStatus(order.id, ORDER_STATUS.DELIVERED)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as Delivered
                              </Button>
                            )}
                            
                            {order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.DELIVERED && (
                              <Button 
                                variant="destructive" 
                                onClick={() => cancelOrder(order.id, adminNotes)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="notifications" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold">Notification Status</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>Email notifications: </span>
                                <Badge variant={order.customerEmail ? "default" : "secondary"}>
                                  {order.customerEmail ? "Enabled" : "No email provided"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>SMS notifications: </span>
                                <Badge variant={order.customerPhone ? "default" : "secondary"}>
                                  {order.customerPhone ? "Enabled" : "No phone provided"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {notificationResult && (
                            <Alert>
                              <AlertDescription>
                                Last notification result: 
                                {notificationResult.email?.success && " Email sent successfully."}
                                {notificationResult.sms?.success && " SMS sent successfully."}
                                {!notificationResult.success && " Failed to send notifications."}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex gap-2">
                {order.customerPhone && (
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default AdminOrders

