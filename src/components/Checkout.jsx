import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCredit } from '../context/CreditContext';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../firebase/orders';
import { processPurchaseCredits } from '../firebase/credits';
import { 
  CreditCard, 
  Coins, 
  ShoppingBag, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Gift,
  Calculator,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

const Checkout = () => {
  const { cartItems, getCartSummary, clearCart } = useCart();
  const { user } = useAuth();
  const { 
    credits, 
    spendUserCredits, 
    validatePayment, 
    getMaxUsableCredits, 
    formatCredits, 
    formatCreditValue,
    creditsToDollars,
    dollarsToCredits
  } = useCredit();
  
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    specialInstructions: '',
    notificationPreferences: {
      email: true,
      sms: false
    }
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'credit', 'mixed'
  const [creditAmount, setCreditAmount] = useState(0);
  const [maxUsableCredits, setMaxUsableCredits] = useState(0);
  const [paymentValidation, setPaymentValidation] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const cartSummary = getCartSummary();

  // Calculate maximum usable credits when cart changes
  useEffect(() => {
    if (cartSummary.finalTotal > 0) {
      const maxCredits = getMaxUsableCredits(cartSummary.finalTotal);
      setMaxUsableCredits(maxCredits);
      
      // Reset credit amount if it exceeds maximum
      if (creditAmount > maxCredits) {
        setCreditAmount(maxCredits);
      }
    }
  }, [cartSummary.finalTotal, credits.availableCredits, creditAmount, getMaxUsableCredits]);

  // Calculate payment breakdown
  const calculatePaymentBreakdown = () => {
    const creditValue = creditsToDollars(creditAmount);
    const remainingAmount = Math.max(0, cartSummary.finalTotal - creditValue);
    
    return {
      creditAmount,
      creditValue,
      remainingAmount,
      totalAmount: cartSummary.finalTotal,
      creditsToEarn: Math.floor(cartSummary.finalTotal * 10) // 10 credits per dollar
    };
  };

  const paymentBreakdown = calculatePaymentBreakdown();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle credit amount change
  const handleCreditAmountChange = (value) => {
    const newAmount = Math.min(Math.max(0, value), maxUsableCredits);
    setCreditAmount(newAmount);
    
    // Update payment method based on credit usage
    if (newAmount === 0) {
      setPaymentMethod('card');
    } else if (paymentBreakdown.remainingAmount <= 0.01) {
      setPaymentMethod('credit');
    } else {
      setPaymentMethod('mixed');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle order submission
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      setErrors({ general: 'Your cart is empty' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Validate credit payment if using credits
      if (creditAmount > 0) {
        const validation = await validatePayment(creditAmount);
        if (!validation.success) {
          setErrors({ payment: validation.error });
          setLoading(false);
          return;
        }
      }

      // Prepare order data
      const orderData = {
        customerId: user.uid,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        items: cartItems,
        pricing: {
          subtotal: cartSummary.subtotal,
          tax: cartSummary.tax,
          shipping: cartSummary.shipping,
          discount: cartSummary.discount,
          total: cartSummary.finalTotal
        },
        paymentMethod: {
          type: paymentMethod,
          creditAmount: creditAmount,
          creditValue: paymentBreakdown.creditValue,
          cardAmount: paymentBreakdown.remainingAmount,
          totalAmount: cartSummary.finalTotal
        },
        specialInstructions: formData.specialInstructions,
        notificationPreferences: formData.notificationPreferences,
        status: 'pending',
        creditsToEarn: paymentBreakdown.creditsToEarn
      };

      // Create order
      const orderResult = await createOrder(orderData);
      
      if (!orderResult.success) {
        setErrors({ general: orderResult.error });
        setLoading(false);
        return;
      }

      // Process credit payment if applicable
      if (creditAmount > 0) {
        const creditResult = await spendUserCredits(
          creditAmount,
          orderResult.orderId,
          `Payment for order #${orderResult.orderId}`
        );
        
        if (!creditResult.success) {
          setErrors({ payment: 'Failed to process credit payment' });
          setLoading(false);
          return;
        }
      }

      // Award purchase credits
      const purchaseCreditResult = await processPurchaseCredits(
        user.uid,
        cartSummary.finalTotal,
        orderResult.orderId
      );

      // Clear cart and show success
      clearCart();
      setOrderSuccess(true);
      setOrderDetails({
        orderId: orderResult.orderId,
        total: cartSummary.finalTotal,
        creditsUsed: creditAmount,
        creditsEarned: paymentBreakdown.creditsToEarn,
        paymentMethod: paymentMethod
      });

      // Redirect to order confirmation after delay
      setTimeout(() => {
        navigate(`/orders/${orderResult.orderId}`);
      }, 3000);

    } catch (error) {
      console.error('Error submitting order:', error);
      setErrors({ general: 'Failed to submit order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  // Show success message
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-semibold">#{orderDetails.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold">${orderDetails.total.toFixed(2)}</span>
            </div>
            {orderDetails.creditsUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Used:</span>
                <span className="font-semibold text-yellow-600">
                  {formatCredits(orderDetails.creditsUsed)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Credits Earned:</span>
              <span className="font-semibold text-green-600">
                +{formatCredits(orderDetails.creditsEarned)}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            Redirecting to order details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order and earn credits!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.zipCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.zipCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Payment Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Coins className="w-6 h-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Use Credits</h2>
                <div className="bg-yellow-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-yellow-800">
                    {formatCredits(credits.availableCredits)} available
                  </span>
                </div>
              </div>
              
              {credits.availableCredits > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credits to Use (Max: {formatCredits(maxUsableCredits)})
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max={maxUsableCredits}
                        value={creditAmount}
                        onChange={(e) => handleCreditAmountChange(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max={maxUsableCredits}
                        value={creditAmount}
                        onChange={(e) => handleCreditAmountChange(parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>0 credits</span>
                      <span>{formatCredits(maxUsableCredits)} credits</span>
                    </div>
                  </div>
                  
                  {creditAmount > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calculator className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Payment Breakdown</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Credits Used:</span>
                          <span className="font-medium">{formatCredits(creditAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Credit Value:</span>
                          <span className="font-medium">${paymentBreakdown.creditValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remaining to Pay:</span>
                          <span className="font-medium">${paymentBreakdown.remainingAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No credits available</p>
                  <p className="text-sm">Earn credits by shopping and referring friends!</p>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Instructions</h2>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any special instructions for your order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              
              {/* Pricing Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${cartSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>${cartSummary.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span>{cartSummary.shipping === 0 ? 'FREE' : `$${cartSummary.shipping.toFixed(2)}`}</span>
                </div>
                {cartSummary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${cartSummary.discount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Credit Payment Breakdown */}
                {creditAmount > 0 && (
                  <>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-yellow-600">
                        <span>Credits Used:</span>
                        <span>-${paymentBreakdown.creditValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Card Payment:</span>
                        <span>${paymentBreakdown.remainingAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>${cartSummary.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Credits to Earn */}
              <div className="bg-green-50 rounded-lg p-4 mt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">You'll Earn</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +{formatCredits(paymentBreakdown.creditsToEarn)} Credits
                </div>
                <div className="text-sm text-green-700">
                  Worth {formatCreditValue(paymentBreakdown.creditsToEarn)}
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={loading || cartItems.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-6 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'credit' ? 'Pay with Credits' : 
                       paymentMethod === 'mixed' ? 'Complete Payment' : 
                       'Place Order'}
                    </span>
                  </>
                )}
              </button>
              
              {/* Error Messages */}
              {errors.general && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">{errors.general}</span>
                  </div>
                </div>
              )}
              
              {errors.payment && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">{errors.payment}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
