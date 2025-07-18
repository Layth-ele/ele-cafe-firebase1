import { ref, set, get, push, remove, onValue, off, query, orderByChild, equalTo, update } from 'firebase/database'
import { database } from './config'

// Order status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
}

// Create order data structure
const createOrderData = (orderData) => {
  const timestamp = new Date().toISOString()
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  return {
    // Order identification
    orderId: orderId,
    orderNumber: orderId,
    
    // Customer information
    customerId: orderData.customerId || '',
    customerEmail: orderData.customerEmail || '',
    customerName: orderData.customerName || '',
    customerPhone: orderData.customerPhone || '',
    
    // Shipping information
    shippingAddress: {
      street: orderData.shippingAddress?.street || '',
      city: orderData.shippingAddress?.city || '',
      province: orderData.shippingAddress?.province || '',
      postalCode: orderData.shippingAddress?.postalCode || '',
      country: orderData.shippingAddress?.country || 'Canada'
    },
    
    // Billing information (can be same as shipping)
    billingAddress: orderData.billingAddress || orderData.shippingAddress,
    
    // Order items
    items: orderData.items || [],
    
    // Pricing
    subtotal: parseFloat(orderData.subtotal) || 0,
    tax: parseFloat(orderData.tax) || 0,
    shipping: parseFloat(orderData.shipping) || 0,
    discount: parseFloat(orderData.discount) || 0,
    total: parseFloat(orderData.total) || 0,
    
    // Order status
    status: ORDER_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    
    // Timestamps
    createdAt: timestamp,
    updatedAt: timestamp,
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    
    // Admin notes and tracking
    adminNotes: '',
    trackingNumber: '',
    estimatedDelivery: null,
    
    // Notification tracking
    notifications: {
      orderCreated: false,
      orderConfirmed: false,
      orderShipped: false,
      orderDelivered: false
    },
    
    // Special instructions
    specialInstructions: orderData.specialInstructions || '',
    
    // Metadata
    source: 'web',
    currency: 'CAD'
  }
}

// Create new order (customer checkout)
export const createOrder = async (orderData) => {
  try {
    const ordersRef = ref(database, 'orders')
    const newOrderRef = push(ordersRef)
    
    const enhancedOrderData = createOrderData({
      ...orderData,
      id: newOrderRef.key
    })
    
    await set(newOrderRef, enhancedOrderData)
    
    // Also create a customer order reference for easy lookup
    if (orderData.customerId) {
      const customerOrderRef = ref(database, `customerOrders/${orderData.customerId}/${newOrderRef.key}`)
      await set(customerOrderRef, {
        orderId: enhancedOrderData.orderId,
        status: enhancedOrderData.status,
        total: enhancedOrderData.total,
        createdAt: enhancedOrderData.createdAt
      })
    }
    
    return { orderId: newOrderRef.key, orderNumber: enhancedOrderData.orderId, error: null }
  } catch (error) {
    return { orderId: null, orderNumber: null, error: error.message }
  }
}

// Get all orders (admin)
export const getAllOrders = async (filters = {}) => {
  try {
    const ordersRef = ref(database, 'orders')
    const snapshot = await get(ordersRef)
    
    if (!snapshot.exists()) {
      return { orders: [], error: null }
    }

    const ordersData = snapshot.val()
    let orders = Object.keys(ordersData).map(key => ({
      id: key,
      ...ordersData[key]
    }))

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      orders = orders.filter(order => order.status === filters.status)
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      orders = orders.filter(order => order.paymentStatus === filters.paymentStatus)
    }

    if (filters.dateFrom) {
      orders = orders.filter(order => new Date(order.createdAt) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      orders = orders.filter(order => new Date(order.createdAt) <= new Date(filters.dateTo))
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      orders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm) ||
        order.customerEmail.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm)
      )
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return { orders, error: null }
  } catch (error) {
    return { orders: [], error: error.message }
  }
}

// Get orders by customer
export const getCustomerOrders = async (customerId) => {
  try {
    const customerOrdersRef = ref(database, `customerOrders/${customerId}`)
    const snapshot = await get(customerOrdersRef)
    
    if (!snapshot.exists()) {
      return { orders: [], error: null }
    }

    const orderIds = Object.keys(snapshot.val())
    const orders = []

    // Fetch full order details for each order
    for (const orderId of orderIds) {
      const orderRef = ref(database, `orders/${orderId}`)
      const orderSnapshot = await get(orderRef)
      
      if (orderSnapshot.exists()) {
        orders.push({
          id: orderId,
          ...orderSnapshot.val()
        })
      }
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return { orders, error: null }
  } catch (error) {
    return { orders: [], error: error.message }
  }
}

// Get single order
export const getOrder = async (orderId) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    const snapshot = await get(orderRef)
    
    if (snapshot.exists()) {
      return { 
        order: { id: orderId, ...snapshot.val() }, 
        error: null 
      }
    } else {
      return { order: null, error: 'Order not found' }
    }
  } catch (error) {
    return { order: null, error: error.message }
  }
}

// Update order status (admin)
export const updateOrderStatus = async (orderId, newStatus, adminNotes = '') => {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    const snapshot = await get(orderRef)
    const currentData = snapshot.val()
    
    if (!currentData) {
      return { error: 'Order not found' }
    }

    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      adminNotes: adminNotes
    }

    // Set specific timestamps based on status
    if (newStatus === ORDER_STATUS.CONFIRMED && !currentData.confirmedAt) {
      updates.confirmedAt = new Date().toISOString()
      updates.paymentStatus = PAYMENT_STATUS.PROCESSING
    } else if (newStatus === ORDER_STATUS.SHIPPED && !currentData.shippedAt) {
      updates.shippedAt = new Date().toISOString()
    } else if (newStatus === ORDER_STATUS.DELIVERED && !currentData.deliveredAt) {
      updates.deliveredAt = new Date().toISOString()
      updates.paymentStatus = PAYMENT_STATUS.COMPLETED
    }

    await update(orderRef, updates)

    // Update customer order reference
    if (currentData.customerId) {
      const customerOrderRef = ref(database, `customerOrders/${currentData.customerId}/${orderId}`)
      await update(customerOrderRef, {
        status: newStatus,
        updatedAt: updates.updatedAt
      })
    }

    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Confirm order (admin) - this triggers payment processing
export const confirmOrder = async (orderId, adminNotes = '') => {
  try {
    const result = await updateOrderStatus(orderId, ORDER_STATUS.CONFIRMED, adminNotes)
    
    if (!result.error) {
      // Mark notification as needed
      const orderRef = ref(database, `orders/${orderId}`)
      await update(orderRef, {
        'notifications.orderConfirmed': true,
        paymentStatus: PAYMENT_STATUS.PROCESSING
      })
    }
    
    return result
  } catch (error) {
    return { error: error.message }
  }
}

// Cancel order
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    const updates = {
      status: ORDER_STATUS.CANCELLED,
      paymentStatus: PAYMENT_STATUS.REFUNDED,
      updatedAt: new Date().toISOString(),
      adminNotes: reason,
      cancelledAt: new Date().toISOString()
    }

    await update(orderRef, updates)

    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Add tracking number
export const addTrackingNumber = async (orderId, trackingNumber, carrier = '') => {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    const updates = {
      trackingNumber: trackingNumber,
      carrier: carrier,
      updatedAt: new Date().toISOString()
    }

    await update(orderRef, updates)

    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Real-time orders listener (admin)
export const subscribeToOrders = (callback, filters = {}) => {
  const ordersRef = ref(database, 'orders')
  
  const handleData = (snapshot) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }

    const ordersData = snapshot.val()
    let orders = Object.keys(ordersData).map(key => ({
      id: key,
      ...ordersData[key]
    }))

    // Apply filters (same logic as getAllOrders)
    if (filters.status && filters.status !== 'all') {
      orders = orders.filter(order => order.status === filters.status)
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    callback(orders)
  }

  onValue(ordersRef, handleData, (error) => {
    console.error('Error listening to orders:', error)
    callback([])
  })

  // Return unsubscribe function
  return () => off(ordersRef, 'value', handleData)
}

// Real-time customer orders listener
export const subscribeToCustomerOrders = (customerId, callback) => {
  const customerOrdersRef = ref(database, `customerOrders/${customerId}`)
  
  const handleData = async (snapshot) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }

    const orderIds = Object.keys(snapshot.val())
    const orders = []

    // Fetch full order details for each order
    for (const orderId of orderIds) {
      const orderRef = ref(database, `orders/${orderId}`)
      const orderSnapshot = await get(orderRef)
      
      if (orderSnapshot.exists()) {
        orders.push({
          id: orderId,
          ...orderSnapshot.val()
        })
      }
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    callback(orders)
  }

  onValue(customerOrdersRef, handleData, (error) => {
    console.error('Error listening to customer orders:', error)
    callback([])
  })

  // Return unsubscribe function
  return () => off(customerOrdersRef, 'value', handleData)
}

// Get order statistics (admin dashboard)
export const getOrderStatistics = async () => {
  try {
    const ordersRef = ref(database, 'orders')
    const snapshot = await get(ordersRef)
    
    if (!snapshot.exists()) {
      return { 
        stats: {
          total: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        }, 
        error: null 
      }
    }

    const ordersData = snapshot.val()
    const orders = Object.values(ordersData)

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
      confirmed: orders.filter(o => o.status === ORDER_STATUS.CONFIRMED).length,
      shipped: orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length,
      delivered: orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length,
      cancelled: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
      totalRevenue: orders
        .filter(o => o.status === ORDER_STATUS.DELIVERED)
        .reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: 0
    }

    if (stats.delivered > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.delivered
    }

    return { stats, error: null }
  } catch (error) {
    return { stats: null, error: error.message }
  }
}

// Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus, paymentDetails = {}) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    const updates = {
      paymentStatus: paymentStatus,
      updatedAt: new Date().toISOString(),
      paymentDetails: paymentDetails
    }

    if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
      updates.paidAt = new Date().toISOString()
    }

    await update(orderRef, updates)

    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

