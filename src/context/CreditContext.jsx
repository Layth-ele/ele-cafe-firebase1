// Credit Context for managing credit state across the application
// src/context/CreditContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserCredits,
  awardCredits,
  spendCredits,
  getCreditTransactions,
  validateCreditPayment,
  subscribeToUserCredits,
  getReferralStats,
  creditsToDollars,
  dollarsToCredits,
  CREDIT_RATES
} from '../firebase/credits';

const CreditContext = createContext();

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState({
    totalCredits: 0,
    availableCredits: 0,
    pendingCredits: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    referralCode: '',
    referredBy: null
  });
  const [transactions, setTransactions] = useState([]);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalReferralCredits: 0,
    referralHistory: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user credits when user changes
  useEffect(() => {
    if (user?.uid) {
      loadUserCredits();
      loadCreditTransactions();
      loadReferralStats();
      
      // Subscribe to real-time credit updates
      const unsubscribe = subscribeToUserCredits(user.uid, (result) => {
        if (result.success) {
          setCredits(result.data);
        } else {
          console.error('Credit subscription error:', result.error);
        }
      });

      return () => unsubscribe();
    } else {
      // Reset state when user logs out
      setCredits({
        totalCredits: 0,
        availableCredits: 0,
        pendingCredits: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        referralCode: '',
        referredBy: null
      });
      setTransactions([]);
      setReferralStats({
        totalReferrals: 0,
        totalReferralCredits: 0,
        referralHistory: []
      });
    }
  }, [user]);

  // Load user credits
  const loadUserCredits = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserCredits(user.uid);
      if (result.success) {
        setCredits(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load credits');
      console.error('Error loading credits:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load credit transactions
  const loadCreditTransactions = async (limit = 50) => {
    if (!user?.uid) return;
    
    try {
      const result = await getCreditTransactions(user.uid, limit);
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  // Load referral statistics
  const loadReferralStats = async () => {
    if (!user?.uid) return;
    
    try {
      const result = await getReferralStats(user.uid);
      if (result.success) {
        setReferralStats(result.data);
      }
    } catch (err) {
      console.error('Error loading referral stats:', err);
    }
  };

  // Award credits to user
  const awardUserCredits = async (amount, source, description, orderId = null) => {
    if (!user?.uid) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await awardCredits(user.uid, amount, source, description, orderId);
      if (result.success) {
        // Refresh data
        await loadUserCredits();
        await loadCreditTransactions();
        if (source === 'referral') {
          await loadReferralStats();
        }
      }
      return result;
    } catch (err) {
      console.error('Error awarding credits:', err);
      return { success: false, error: 'Failed to award credits' };
    }
  };

  // Spend credits
  const spendUserCredits = async (amount, orderId, description = 'Order payment') => {
    if (!user?.uid) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await spendCredits(user.uid, amount, orderId, description);
      if (result.success) {
        // Refresh data
        await loadUserCredits();
        await loadCreditTransactions();
      }
      return result;
    } catch (err) {
      console.error('Error spending credits:', err);
      return { success: false, error: 'Failed to spend credits' };
    }
  };

  // Validate credit payment
  const validatePayment = async (creditAmount) => {
    if (!user?.uid) return { success: false, error: 'User not authenticated' };
    
    try {
      return await validateCreditPayment(user.uid, creditAmount);
    } catch (err) {
      console.error('Error validating payment:', err);
      return { success: false, error: 'Failed to validate payment' };
    }
  };

  // Get credit balance in dollars
  const getCreditBalance = () => {
    return {
      credits: credits.availableCredits,
      dollars: creditsToDollars(credits.availableCredits)
    };
  };

  // Calculate maximum credits that can be used for a given order total
  const getMaxUsableCredits = (orderTotal) => {
    const maxCreditsFromOrder = dollarsToCredits(orderTotal);
    return Math.min(credits.availableCredits, maxCreditsFromOrder);
  };

  // Get credit earning potential for an order
  const getEarningPotential = (orderTotal) => {
    return Math.floor(orderTotal * CREDIT_RATES.PURCHASE_RATE);
  };

  // Format credits for display
  const formatCredits = (creditAmount) => {
    return creditAmount.toLocaleString();
  };

  // Format credit value in dollars
  const formatCreditValue = (creditAmount) => {
    const dollarValue = creditsToDollars(creditAmount);
    return `$${dollarValue.toFixed(2)}`;
  };

  // Get referral link
  const getReferralLink = () => {
    if (!credits.referralCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${credits.referralCode}`;
  };

  // Share referral code
  const shareReferralCode = async (method = 'copy') => {
    const referralLink = getReferralLink();
    const shareText = `Join Ele Cafe and get 2,500 credits (worth $25) when you sign up! Use my referral link: ${referralLink}`;
    
    try {
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(referralLink);
          return { success: true, message: 'Referral link copied to clipboard!' };
        
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
          window.open(whatsappUrl, '_blank');
          return { success: true, message: 'WhatsApp opened with referral message' };
        
        case 'email':
          const emailUrl = `mailto:?subject=Join Ele Cafe and Get Free Credits!&body=${encodeURIComponent(shareText)}`;
          window.open(emailUrl);
          return { success: true, message: 'Email client opened with referral message' };
        
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: 'Join Ele Cafe',
              text: shareText,
              url: referralLink
            });
            return { success: true, message: 'Shared successfully' };
          } else {
            throw new Error('Native sharing not supported');
          }
        
        default:
          return { success: false, error: 'Unknown sharing method' };
      }
    } catch (err) {
      console.error('Error sharing referral:', err);
      return { success: false, error: 'Failed to share referral' };
    }
  };

  // Get transaction by type
  const getTransactionsByType = (type) => {
    return transactions.filter(transaction => transaction.type === type);
  };

  // Get recent transactions
  const getRecentTransactions = (limit = 10) => {
    return transactions.slice(0, limit);
  };

  // Check if user has enough credits for amount
  const hasEnoughCredits = (amount) => {
    return credits.availableCredits >= amount;
  };

  // Get credit tier/level (for gamification)
  const getCreditTier = () => {
    const totalEarned = credits.lifetimeEarned;
    
    if (totalEarned >= 50000) return { tier: 'Platinum', color: 'text-purple-600', nextTier: null };
    if (totalEarned >= 25000) return { tier: 'Gold', color: 'text-yellow-600', nextTier: 50000 };
    if (totalEarned >= 10000) return { tier: 'Silver', color: 'text-gray-600', nextTier: 25000 };
    if (totalEarned >= 5000) return { tier: 'Bronze', color: 'text-orange-600', nextTier: 10000 };
    return { tier: 'Starter', color: 'text-green-600', nextTier: 5000 };
  };

  const value = {
    // State
    credits,
    transactions,
    referralStats,
    loading,
    error,
    
    // Core functions
    loadUserCredits,
    loadCreditTransactions,
    loadReferralStats,
    awardUserCredits,
    spendUserCredits,
    validatePayment,
    
    // Utility functions
    getCreditBalance,
    getMaxUsableCredits,
    getEarningPotential,
    formatCredits,
    formatCreditValue,
    hasEnoughCredits,
    getCreditTier,
    
    // Referral functions
    getReferralLink,
    shareReferralCode,
    
    // Transaction functions
    getTransactionsByType,
    getRecentTransactions,
    
    // Constants
    CREDIT_RATES,
    
    // Conversion functions
    creditsToDollars,
    dollarsToCredits
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

export default CreditProvider;

