// Notification service for SMS and Email
// This service handles sending notifications to customers
// Updated to be CSP-compliant

// Email service configuration
const EMAIL_CONFIG = {
  // You can use services like EmailJS, SendGrid, or Nodemailer
  // For demo purposes, we'll use EmailJS (client-side email service)
  serviceId: 'your_emailjs_service_id',
  templateId: 'your_emailjs_template_id',
  publicKey: 'your_emailjs_public_key'
}

// SMS service configuration
const SMS_CONFIG = {
  // You can use services like Twilio, AWS SNS, or other SMS providers
  // For demo purposes, we'll simulate SMS sending
  provider: 'twilio', // or 'aws-sns', 'nexmo', etc.
  accountSid: 'your_twilio_account_sid',
  authToken: 'your_twilio_auth_token',
  fromNumber: '+1234567890'
}

// Notification templates
const EMAIL_TEMPLATES = {
  ORDER_CONFIRMED: {
    subject: '✅ Your Ele Cafe Order is Confirmed!',
    template: (orderData) => {
      const itemsHtml = orderData.items.map(item => 
        `<div style="border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
          <p><strong>${item.name}</strong></p>
          <p>Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</p>
        </div>`
      ).join('')

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎉 Order Confirmed!</h1>
            <p>Your payment has been processed successfully</p>
          </div>
          
          <div style="padding: 20px;">
            <h2>Hello ${orderData.customerName},</h2>
            <p>Great news! Your order has been confirmed and your payment has been processed.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Order Details:</h3>
              <p><strong>Order Number:</strong> ${orderData.orderId}</p>
              <p><strong>Total Amount:</strong> $${orderData.total.toFixed(2)} CAD</p>
              <p><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Items Ordered:</h3>
              ${itemsHtml}
            </div>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Shipping Address:</h3>
              <p>${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.province}<br>
              ${orderData.shippingAddress.postalCode}, ${orderData.shippingAddress.country}</p>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <p>We're now preparing your order for shipment. You'll receive another notification with tracking information once your order ships.</p>
            
            <p>Thank you for choosing Ele Cafe!</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:info@elecafe.ca" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Contact Us</a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b;">
            <p>Ele Cafe - Premium Tea Collection</p>
            <p>If you have any questions, please contact us at info@elecafe.ca</p>
          </div>
        </div>
      `
    }
  },
  
  ORDER_SHIPPED: {
    subject: '📦 Your Ele Cafe Order Has Shipped!',
    template: (orderData) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; text-align: center;">
          <h1>📦 Order Shipped!</h1>
          <p>Your tea is on its way to you</p>
        </div>
        
        <div style="padding: 20px;">
          <h2>Hello ${orderData.customerName},</h2>
          <p>Exciting news! Your order has been shipped and is on its way to you.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Shipping Details:</h3>
            <p><strong>Order Number:</strong> ${orderData.orderId}</p>
            <p><strong>Tracking Number:</strong> ${orderData.trackingNumber || 'Will be provided soon'}</p>
            <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery || '3-5 business days'}</p>
          </div>
          
          <p>You can track your package using the tracking number provided above.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" style="background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
          </div>
        </div>
      </div>
    `
  }
}

const SMS_TEMPLATES = {
  ORDER_CONFIRMED: (orderData) => 
    `🎉 Ele Cafe: Your order ${orderData.orderId} is confirmed! Payment of $${orderData.total.toFixed(2)} processed. We're preparing your tea order for shipment. Thank you!`,
  
  ORDER_SHIPPED: (orderData) => 
    `📦 Ele Cafe: Your order ${orderData.orderId} has shipped! ${orderData.trackingNumber ? `Tracking: ${orderData.trackingNumber}` : 'Tracking info coming soon'}. Estimated delivery: ${orderData.estimatedDelivery || '3-5 days'}.`
}

// Email notification function (CSP-compliant)
export const sendEmailNotification = async (type, orderData, customerEmail) => {
  try {
    const template = EMAIL_TEMPLATES[type]
    if (!template) {
      throw new Error(`Email template not found for type: ${type}`)
    }

    // For production, integrate with a server-side email service
    // This avoids CSP issues by not loading external scripts dynamically
    
    // Option 1: Use fetch to send to your backend API
    const emailData = {
      to: customerEmail,
      subject: template.subject,
      html: template.template(orderData),
      orderData: {
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        total: orderData.total,
        createdAt: orderData.createdAt
      }
    }

    // For development: Log the email content
    console.log('📧 EMAIL NOTIFICATION:', {
      type,
      to: customerEmail,
      subject: template.subject,
      preview: `Email would be sent to ${customerEmail} with order ${orderData.orderId}`
    })

    // Simulate successful email sending
    return { 
      success: true, 
      messageId: 'dev-email-' + Date.now(), 
      error: null,
      method: 'simulated'
    }

    // In production, you would uncomment this and implement your backend API:
    /*
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, messageId: result.messageId, error: null }
    */

  } catch (error) {
    console.error('Email notification error:', error)
    return { success: false, messageId: null, error: error.message }
  }
}

// SMS notification function (CSP-compliant)
export const sendSMSNotification = async (type, orderData, phoneNumber) => {
  try {
    const template = SMS_TEMPLATES[type]
    if (!template) {
      throw new Error(`SMS template not found for type: ${type}`)
    }

    const message = template(orderData)

    // For production, use a server-side SMS service
    // This avoids CSP issues by not loading external scripts
    
    const smsData = {
      to: phoneNumber,
      message: message,
      orderData: {
        orderId: orderData.orderId,
        customerName: orderData.customerName
      }
    }

    // For development: Log the SMS content
    console.log('📱 SMS NOTIFICATION:', {
      type,
      to: phoneNumber,
      message: message
    })

    // Simulate successful SMS sending
    return { 
      success: true, 
      messageId: 'dev-sms-' + Date.now(), 
      error: null,
      message: message,
      method: 'simulated'
    }

    // In production, you would uncomment this and implement your backend API:
    /*
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    })

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, messageId: result.messageId, error: null }
    */

  } catch (error) {
    console.error('SMS notification error:', error)
    return { success: false, messageId: null, error: error.message }
  }
}

// Combined notification function
export const sendOrderNotification = async (type, orderData, notificationPreferences = { email: true, sms: false }) => {
  const results = {
    email: null,
    sms: null,
    success: false
  }

  try {
    // Send email notification
    if (notificationPreferences.email && orderData.customerEmail) {
      results.email = await sendEmailNotification(type, orderData, orderData.customerEmail)
    }

    // Send SMS notification
    if (notificationPreferences.sms && orderData.customerPhone) {
      results.sms = await sendSMSNotification(type, orderData, orderData.customerPhone)
    }

    // Consider it successful if at least one notification was sent successfully
    results.success = (results.email?.success || results.sms?.success) || false

    return results
  } catch (error) {
    console.error('Notification error:', error)
    return {
      email: null,
      sms: null,
      success: false,
      error: error.message
    }
  }
}

// Notification preferences management
export const getNotificationPreferences = (customerData) => {
  return {
    email: customerData.notificationPreferences?.email !== false, // Default to true
    sms: customerData.notificationPreferences?.sms === true, // Default to false
    push: customerData.notificationPreferences?.push === true // Default to false
  }
}

// Initialize notification services (CSP-compliant)
export const initializeNotificationServices = async () => {
  try {
    // No dynamic script loading - everything is handled server-side or through static imports
    console.log('✅ Notification services initialized (CSP-compliant mode)')
    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to initialize notification services:', error)
    return { success: false, error: error.message }
  }
}

// Test notification function (for admin testing)
export const sendTestNotification = async (type, testData) => {
  const testOrderData = {
    orderId: 'TEST-ORDER-123',
    customerName: testData.customerName || 'Test Customer',
    customerEmail: testData.customerEmail,
    customerPhone: testData.customerPhone,
    total: 45.99,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Earl Grey Tea', quantity: 2, price: 15.99 },
      { name: 'Green Dragon Well', quantity: 1, price: 14.01 }
    ],
    shippingAddress: {
      street: '123 Test Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      country: 'Canada'
    },
    trackingNumber: 'TEST123456789',
    estimatedDelivery: '3-5 business days'
  }

  return await sendOrderNotification(type, testOrderData, {
    email: !!testData.customerEmail,
    sms: !!testData.customerPhone
  })
}

// Utility function to validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utility function to validate phone number format
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

// Utility function to format phone number
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Add + if not present and number doesn't start with it
  if (!cleaned.startsWith('+')) {
    return '+1' + cleaned // Default to North American format
  }
  
  return cleaned
}

