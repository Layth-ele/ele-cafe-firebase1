import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import AdminOrders from './admin/AdminOrders'
import AdminProducts from './admin/AdminProducts'
import { 
  ShoppingBag, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please log in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.displayName || user.email}! Manage your tea shop from here.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">
            Orders
            <Badge variant="secondary" className="ml-2">New</Badge>
          </TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$0.00</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Active products
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No recent orders to display
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <ShoppingBag className="h-6 w-6 mb-2 text-blue-600" />
                    <div className="font-semibold">Manage Orders</div>
                    <div className="text-sm text-muted-foreground">View and confirm orders</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('products')}
                    className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Package className="h-6 w-6 mb-2 text-green-600" />
                    <div className="font-semibold">Manage Products</div>
                    <div className="text-sm text-muted-foreground">Add and edit teas</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Management System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🎉 New Order Confirmation System Active!
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Customers now need admin approval before their orders are processed. 
                    When you confirm an order, the customer will be automatically notified 
                    via email and SMS (if provided) that their payment has been processed.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Customer places order (Pending)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Admin confirms order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>Customer gets charged & notified</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <AdminOrders />
        </TabsContent>

        <TabsContent value="products">
          <AdminProducts />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure email notifications for order confirmations and updates.
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Status:</strong> Ready to configure<br />
                      <strong>Service:</strong> EmailJS (client-side) or SendGrid (server-side)<br />
                      <strong>Templates:</strong> Order confirmation, shipping notifications
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">SMS Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure SMS notifications for order confirmations and updates.
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Status:</strong> Ready to configure<br />
                      <strong>Service:</strong> Twilio or AWS SNS<br />
                      <strong>Templates:</strong> Order confirmation, shipping notifications
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Store Name</label>
                  <input 
                    type="text" 
                    defaultValue="Ele Cafe" 
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Email</label>
                  <input 
                    type="email" 
                    defaultValue="info@elecafe.ca" 
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Free Shipping Threshold</label>
                  <input 
                    type="number" 
                    defaultValue="75" 
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard

