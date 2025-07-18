// Updated App Component with Credit System Integration
// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CreditProvider } from './context/CreditContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import ProductCatalog from './components/ProductCatalog';
import TeaProfile from './components/TeaProfile';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import CustomerOrders from './components/CustomerOrders';
import AdminDashboard from './components/AdminDashboard';
import NotFound from './components/NotFound';

// Credit System Components
import CreditDashboard from './components/CreditDashboard';
import ReferralShare from './components/ReferralShare';

// Hooks
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductCatalog />} />
          <Route path="/products/:category" element={<ProductCatalog />} />
          <Route path="/tea-profile/:id" element={<TeaProfile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <CustomerOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders/:orderId" 
            element={
              <ProtectedRoute>
                <CustomerOrders />
              </ProtectedRoute>
            } 
          />

          {/* Credit System Routes */}
          <Route 
            path="/credits" 
            element={
              <ProtectedRoute>
                <CreditDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/referrals" 
            element={
              <ProtectedRoute>
                <ReferralShare />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/:tab" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CreditProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </CreditProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;

