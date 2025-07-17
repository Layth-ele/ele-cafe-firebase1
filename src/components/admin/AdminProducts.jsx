import React, { useState, useEffect } from 'react'
import { getProducts, updateProduct, deleteProduct, updateProductServingOptions } from '../../firebase/products'
import { servingOptions } from '../../firebase/seedData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { 
  Plus, 
  Package, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Settings,
  Coffee,
  Thermometer,
  Clock,
  Search
} from 'lucide-react'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const result = await getProducts()
      if (result.success) {
        setProducts(result.products)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      available_serving_options: product.available_serving_options || ['infused_tea'],
      default_serving_option: product.default_serving_option || 'infused_tea'
    })
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    try {
      const result = await updateProduct(editingProduct.id, editingProduct)
      if (result.success) {
        await loadProducts()
        setEditingProduct(null)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const result = await deleteProduct(productId)
        if (result.success) {
          await loadProducts()
        }
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const handleServingOptionChange = (optionId, checked) => {
    if (!editingProduct) return

    let newOptions = [...editingProduct.available_serving_options]
    
    if (checked) {
      if (!newOptions.includes(optionId)) {
        newOptions.push(optionId)
      }
    } else {
      newOptions = newOptions.filter(option => option !== optionId)
    }

    // Ensure at least one option is selected
    if (newOptions.length === 0) {
      newOptions = ['infused_tea']
    }

    // Update default option if it's no longer available
    let defaultOption = editingProduct.default_serving_option
    if (!newOptions.includes(defaultOption)) {
      defaultOption = newOptions[0]
    }

    setEditingProduct({
      ...editingProduct,
      available_serving_options: newOptions,
      default_serving_option: defaultOption
    })
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(products.map(p => p.category))]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-muted-foreground">Manage your tea products, serving options, and inventory</p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="category">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="secondary">{product.category}</Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-semibold">${product.price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <span className={`font-semibold ${product.stock_quantity > 10 ? 'text-green-600' : product.stock_quantity > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {product.stock_quantity || 0}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Serving Options:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(product.available_serving_options || ['infused_tea']).map(optionId => {
                      const option = servingOptions[optionId]
                      return option ? (
                        <Badge key={optionId} variant="outline" className="text-xs">
                          {option.icon} {option.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No products match your search criteria.' 
                : 'No products found. Add your first tea product to get started.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Edit Product: {editingProduct.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingProduct(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingProduct.category || ''}
                    onValueChange={(value) => setEditingProduct({
                      ...editingProduct,
                      category: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Black Tea">Black Tea</SelectItem>
                      <SelectItem value="Green Tea">Green Tea</SelectItem>
                      <SelectItem value="White Tea">White Tea</SelectItem>
                      <SelectItem value="Oolong Tea">Oolong Tea</SelectItem>
                      <SelectItem value="Herbal Tea">Herbal Tea</SelectItem>
                      <SelectItem value="Pu-erh Tea">Pu-erh Tea</SelectItem>
                      <SelectItem value="Flavored Tea">Flavored Tea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editingProduct.stock_quantity || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      stock_quantity: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Serving Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Serving Options
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which serving options are available for this tea. Customers will be able to choose from these options on the tea profile page.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(servingOptions).map(([optionId, option]) => (
                    <Card key={optionId} className={`cursor-pointer transition-all ${
                      editingProduct.available_serving_options?.includes(optionId)
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={editingProduct.available_serving_options?.includes(optionId) || false}
                            onCheckedChange={(checked) => handleServingOptionChange(optionId, checked)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{option.icon}</span>
                              <h4 className="font-medium">{option.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {option.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3" />
                                {option.temperature}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {option.preparation_time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Default Serving Option */}
                <div className="mt-4">
                  <Label htmlFor="default-option">Default Serving Option</Label>
                  <Select
                    value={editingProduct.default_serving_option || 'infused_tea'}
                    onValueChange={(value) => setEditingProduct({
                      ...editingProduct,
                      default_serving_option: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default option" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingProduct.available_serving_options || ['infused_tea']).map(optionId => {
                        const option = servingOptions[optionId]
                        return option ? (
                          <SelectItem key={optionId} value={optionId}>
                            {option.icon} {option.name}
                          </SelectItem>
                        ) : null
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="caffeine">Caffeine Level</Label>
                  <Select
                    value={editingProduct.caffeine_level || ''}
                    onValueChange={(value) => setEditingProduct({
                      ...editingProduct,
                      caffeine_level: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select caffeine level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caffeine-Free">Caffeine-Free</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Low-Medium">Low-Medium</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Medium-High">Medium-High</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="antioxidants">Antioxidants Level</Label>
                  <Select
                    value={editingProduct.antioxidants || ''}
                    onValueChange={(value) => setEditingProduct({
                      ...editingProduct,
                      antioxidants: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select antioxidants level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Very High">Very High</SelectItem>
                      <SelectItem value="Extremely High">Extremely High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminProducts

