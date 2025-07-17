// Updated Header Component with Credit Display
// src/components/Header.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import CreditDisplay from './CreditDisplay';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Settings,
  Package,
  Coins,
  Gift,
  UserPlus
} from 'lucide-react';

const Header = () => {
  const { user, signOutUser } = useAuth();
  const { getTotalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartItemCount = getTotalItems();

  const handleSignOut = async () => {
    await signOutUser();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Ele Cafe</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Shop
            </Link>
            <Link 
              to="/products/black-tea" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Black Tea
            </Link>
            <Link 
              to="/products/green-tea" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Green Tea
            </Link>
            <Link 
              to="/products/herbal-tea" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Herbal Tea
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Credit Display (for logged in users) */}
            {user && (
              <div className="hidden lg:block">
                <CreditDisplay />
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Shopping Cart */}
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="hidden md:block font-medium">
                    {user.displayName?.split(' ')[0] || 'Account'}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt="Profile" 
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.displayName || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* Credit Display (Mobile) */}
                    <div className="lg:hidden px-4 py-3 border-b border-gray-200">
                      <CreditDisplay compact={true} />
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/credits"
                        onClick={closeUserMenu}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span>My Credits</span>
                      </Link>

                      <Link
                        to="/referrals"
                        onClick={closeUserMenu}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Gift className="w-4 h-4 text-purple-600" />
                        <span>Refer Friends</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={closeUserMenu}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={closeUserMenu}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span>Account Settings</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={closeUserMenu}
                          className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-green-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Shop All
              </Link>
              <Link
                to="/products/black-tea"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Black Tea
              </Link>
              <Link
                to="/products/green-tea"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Green Tea
              </Link>
              <Link
                to="/products/herbal-tea"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Herbal Tea
              </Link>

              {user && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <Link
                      to="/credits"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span>My Credits</span>
                    </Link>
                    <Link
                      to="/referrals"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Gift className="w-4 h-4 text-purple-600" />
                      <span>Refer Friends</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>My Orders</span>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;

