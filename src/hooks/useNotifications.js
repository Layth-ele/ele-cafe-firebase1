import { useState } from 'react'
import { 
  sendOrderNotification, 
  sendEmailNotification, 
  sendSMSNotification,
  sendTestNotification 
} from '../services/notifications'

export const useNotifications = () => {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const sendNotification = async (type, orderData, preferences = { email: true, sms: false }) => {
    setLoading(true)
    try {
      const result = await sendOrderNotification(type, orderData, preferences)
      setLastResult(result)
      return result
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        email: null,
        sms: null
      }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async (type, orderData, email) => {
    setLoading(true)
    try {
      const result = await sendEmailNotification(type, orderData, email)
      setLastResult({ email: result, sms: null, success: result.success })
      return result
    } catch (error) {
      const errorResult = { success: false, error: error.message }
      setLastResult({ email: errorResult, sms: null, success: false })
      return errorResult
    } finally {
      setLoading(false)
    }
  }

  const sendSMS = async (type, orderData, phoneNumber) => {
    setLoading(true)
    try {
      const result = await sendSMSNotification(type, orderData, phoneNumber)
      setLastResult({ email: null, sms: result, success: result.success })
      return result
    } catch (error) {
      const errorResult = { success: false, error: error.message }
      setLastResult({ email: null, sms: errorResult, success: false })
      return errorResult
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotifications = async (testData) => {
    setLoading(true)
    try {
      const results = {}
      
      if (testData.customerEmail) {
        results.confirmationEmail = await sendTestNotification('ORDER_CONFIRMED', testData)
      }
      
      if (testData.customerPhone) {
        results.confirmationSMS = await sendTestNotification('ORDER_CONFIRMED', testData)
      }
      
      setLastResult(results)
      return results
    } catch (error) {
      const errorResult = { success: false, error: error.message }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setLoading(false)
    }
  }

  const clearLastResult = () => {
    setLastResult(null)
  }

  return {
    loading,
    lastResult,
    sendNotification,
    sendEmail,
    sendSMS,
    sendTestNotifications,
    clearLastResult
  }
}

export default useNotifications

