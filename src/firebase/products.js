import { ref, set, get, push, remove, update, onValue, off } from 'firebase/database'
import { database } from './config'

// Get all products
export const getProducts = async (filters = {}) => {
  try {
    const productsRef = ref(database, 'products')
    const snapshot = await get(productsRef)
    
    if (snapshot.exists()) {
      const productsData = snapshot.val()
      let products = Object.keys(productsData).map(key => ({
        id: key,
        ...productsData[key]
      }))

      // Apply filters
      if (filters.category) {
        products = products.filter(product => 
          product.category && product.category.toLowerCase() === filters.category.toLowerCase()
        )
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        products = products.filter(product =>
          (product.name && product.name.toLowerCase().includes(searchTerm)) ||
          (product.description && product.description.toLowerCase().includes(searchTerm)) ||
          (product.category && product.category.toLowerCase().includes(searchTerm))
        )
      }

      if (filters.inStock) {
        products = products.filter(product => product.in_stock && product.stock_quantity > 0)
      }

      // Sort products
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            products.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            break
          case 'price_low':
            products.sort((a, b) => (a.price || 0) - (b.price || 0))
            break
          case 'price_high':
            products.sort((a, b) => (b.price || 0) - (a.price || 0))
            break
          case 'rating':
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0))
            break
          case 'newest':
            products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            break
          default:
            break
        }
      }

      console.log('Products fetched successfully:', products.length)
      return { success: true, products }
    } else {
      console.log('No products found in database')
      return { success: true, products: [] }
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { success: false, error: error.message, products: [] }
  }
}

// Get product by ID
export const getProductById = async (productId) => {
  try {
    console.log('Fetching product by ID:', productId)
    const productRef = ref(database, `products/${productId}`)
    const snapshot = await get(productRef)
    
    if (snapshot.exists()) {
      const productData = snapshot.val()
      const product = {
        id: productId,
        ...productData
      }
      console.log('Product found:', product)
      return { success: true, product }
    } else {
      console.log('Product not found for ID:', productId)
      return { success: false, error: 'Product not found', product: null }
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return { success: false, error: error.message, product: null }
  }
}

// Get categories with product counts
export const getCategories = async () => {
  try {
    console.log('Fetching categories...')
    const productsRef = ref(database, 'products')
    const snapshot = await get(productsRef)
    
    if (snapshot.exists()) {
      const productsData = snapshot.val()
      const products = Object.keys(productsData).map(key => ({
        id: key,
        ...productsData[key]
      }))

      // Count products by category
      const categoryCount = {}
      products.forEach(product => {
        if (product.category) {
          const category = product.category
          categoryCount[category] = (categoryCount[category] || 0) + 1
        }
      })

      // Convert to array format
      const categories = Object.keys(categoryCount).map(categoryName => ({
        id: categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        count: categoryCount[categoryName],
        description: getCategoryDescription(categoryName)
      }))

      console.log('Categories fetched successfully:', categories)
      return { success: true, categories }
    } else {
      console.log('No products found, returning empty categories')
      return { success: true, categories: [] }
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: error.message, categories: [] }
  }
}

// Helper function to get category descriptions
const getCategoryDescription = (categoryName) => {
  const descriptions = {
    'Black Tea': 'Bold and robust teas with full-bodied flavor',
    'Green Tea': 'Light and refreshing teas with delicate taste',
    'White Tea': 'Subtle and elegant teas with gentle flavor',
    'Oolong Tea': 'Complex teas with balanced oxidation',
    'Herbal Tea': 'Caffeine-free blends with natural ingredients',
    'Pu-erh Tea': 'Aged and fermented teas with earthy notes',
    'Chai Tea': 'Spiced tea blends with warming flavors',
    'Fruit Tea': 'Fruity and aromatic tea blends'
  }
  return descriptions[categoryName] || 'Premium tea selection'
}

// Get featured products
export const getFeaturedProducts = async (limit = 6) => {
  try {
    console.log('Fetching featured products...')
    const productsRef = ref(database, 'products')
    const snapshot = await get(productsRef)
    
    if (snapshot.exists()) {
      const productsData = snapshot.val()
      let products = Object.keys(productsData).map(key => ({
        id: key,
        ...productsData[key]
      }))

      // Filter for featured products or high-rated products
      let featuredProducts = products.filter(product => 
        product.featured === true || product.rating >= 4.5
      )

      // If not enough featured products, add popular ones
      if (featuredProducts.length < limit) {
        const popularProducts = products
          .filter(product => !featuredProducts.find(fp => fp.id === product.id))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        
        featuredProducts = [...featuredProducts, ...popularProducts].slice(0, limit)
      }

      // Limit the results
      featuredProducts = featuredProducts.slice(0, limit)

      console.log('Featured products fetched successfully:', featuredProducts.length)
      return { success: true, products: featuredProducts }
    } else {
      console.log('No products found for featured products')
      return { success: true, products: [] }
    }
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return { success: false, error: error.message, products: [] }
  }
}

// Add new product
export const addProduct = async (productData) => {
  try {
    const productsRef = ref(database, 'products')
    const newProductRef = push(productsRef)
    
    const product = {
      ...productData,
      id: newProductRef.key,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await set(newProductRef, product)
    console.log('Product added successfully:', product.id)
    return { success: true, product }
  } catch (error) {
    console.error('Error adding product:', error)
    return { success: false, error: error.message }
  }
}

// Update product
export const updateProduct = async (productId, updates) => {
  try {
    const productRef = ref(database, `products/${productId}`)
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    await update(productRef, updatedData)
    console.log('Product updated successfully:', productId)
    return { success: true }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, error: error.message }
  }
}

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`)
    await remove(productRef)
    console.log('Product deleted successfully:', productId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: error.message }
  }
}

// Update product stock
export const updateProductStock = async (productId, newStock) => {
  try {
    const productRef = ref(database, `products/${productId}`)
    await update(productRef, {
      stock_quantity: newStock,
      in_stock: newStock > 0,
      updated_at: new Date().toISOString()
    })
    console.log('Product stock updated successfully:', productId)
    return { success: true }
  } catch (error) {
    console.error('Error updating product stock:', error)
    return { success: false, error: error.message }
  }
}

// Increment product views
export const incrementProductViews = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`)
    const snapshot = await get(productRef)
    
    if (snapshot.exists()) {
      const currentViews = snapshot.val().views || 0
      await update(productRef, {
        views: currentViews + 1,
        updated_at: new Date().toISOString()
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Error incrementing product views:', error)
    return { success: false, error: error.message }
  }
}

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const result = await getProducts({ category })
    return result
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return { success: false, error: error.message, products: [] }
  }
}

// Search products
export const searchProducts = async (searchTerm) => {
  try {
    const result = await getProducts({ search: searchTerm })
    return result
  } catch (error) {
    console.error('Error searching products:', error)
    return { success: false, error: error.message, products: [] }
  }
}

// Update serving options for a product
export const updateProductServingOptions = async (productId, servingOptions) => {
  try {
    const productRef = ref(database, `products/${productId}`)
    await update(productRef, {
      available_serving_options: servingOptions,
      updated_at: new Date().toISOString()
    })
    console.log('Product serving options updated successfully:', productId)
    return { success: true }
  } catch (error) {
    console.error('Error updating product serving options:', error)
    return { success: false, error: error.message }
  }
}

// Real-time listener for products
export const subscribeToProducts = (callback) => {
  const productsRef = ref(database, 'products')
  
  const unsubscribe = onValue(productsRef, (snapshot) => {
    if (snapshot.exists()) {
      const productsData = snapshot.val()
      const products = Object.keys(productsData).map(key => ({
        id: key,
        ...productsData[key]
      }))
      callback({ success: true, products })
    } else {
      callback({ success: true, products: [] })
    }
  }, (error) => {
    console.error('Error in products subscription:', error)
    callback({ success: false, error: error.message, products: [] })
  })

  // Return unsubscribe function
  return () => off(productsRef, 'value', unsubscribe)
}

// Real-time listener for a specific product
export const subscribeToProduct = (productId, callback) => {
  const productRef = ref(database, `products/${productId}`)
  
  const unsubscribe = onValue(productRef, (snapshot) => {
    if (snapshot.exists()) {
      const product = {
        id: productId,
        ...snapshot.val()
      }
      callback({ success: true, product })
    } else {
      callback({ success: false, error: 'Product not found', product: null })
    }
  }, (error) => {
    console.error('Error in product subscription:', error)
    callback({ success: false, error: error.message, product: null })
  })

  // Return unsubscribe function
  return () => off(productRef, 'value', unsubscribe)
}

