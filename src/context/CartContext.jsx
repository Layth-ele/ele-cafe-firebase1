import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ele-cafe-cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        setCartItems([])
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ele-cafe-cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Add item to cart
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id)
      
      if (existingItem) {
        // If item already exists, increase quantity
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // If new item, add with quantity 1
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
  }

  // Remove item from cart completely
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
  }

  // Update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    }
  }

  // Get quantity of specific item
  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  // Get total number of items in cart
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  // Get total price of all items in cart
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Calculate price considering discounts
      let itemPrice = item.price
      if (item.discount_active && item.discount_percentage > 0) {
        itemPrice = item.price * (1 - item.discount_percentage / 100)
      }
      return total + (itemPrice * item.quantity)
    }, 0)
  }

  // Get subtotal (before tax and shipping)
  const getSubtotal = () => {
    return getTotalPrice()
  }

  // Calculate tax (you can adjust the tax rate as needed)
  const getTax = (taxRate = 0.08) => {
    return getSubtotal() * taxRate
  }

  // Calculate shipping cost
  const getShippingCost = () => {
    const subtotal = getSubtotal()
    // Free shipping over $75
    return subtotal >= 75 ? 0 : 9.99
  }

  // Get final total including tax and shipping
  const getFinalTotal = (taxRate = 0.08) => {
    return getSubtotal() + getTax(taxRate) + getShippingCost()
  }

  // Clear entire cart
  const clearCart = () => {
    setCartItems([])
  }

  // Check if cart is empty
  const isEmpty = () => {
    return cartItems.length === 0
  }

  // Get cart summary for checkout
  const getCartSummary = () => {
    const subtotal = getSubtotal()
    const tax = getTax()
    const shipping = getShippingCost()
    const total = getFinalTotal()

    return {
      items: cartItems,
      itemCount: getTotalItems(),
      subtotal,
      tax,
      shipping,
      total,
      freeShippingEligible: subtotal >= 75
    }
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTax,
    getShippingCost,
    getFinalTotal,
    clearCart,
    isEmpty,
    getCartSummary
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

