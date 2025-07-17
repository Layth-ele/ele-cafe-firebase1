// Firebase Credit Management System
// src/firebase/credits.js

import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  onValue,
  serverTimestamp,
  runTransaction
} from 'firebase/database';
import { database } from './config';

// Credit system constants
export const CREDIT_RATES = {
  SIGNUP_BONUS: 2500,
  REFERRAL_BONUS: 2500,
  PURCHASE_RATE: 10, // credits per dollar
  CREDIT_VALUE: 0.01 // 1 credit = $0.01
};

// Generate unique referral code
export const generateReferralCode = (userId) => {
  const timestamp = Date.now().toString(36);
  const userPart = userId.substring(0, 6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${userPart}${timestamp}${randomPart}`.substring(0, 12);
};

// Initialize user credits (called during signup)
export const initializeUserCredits = async (userId, referralCode = null) => {
  try {
    const userCreditsRef = ref(database, `userCredits/${userId}`);
    
    // Check if user credits already exist
    const snapshot = await get(userCreditsRef);
    if (snapshot.exists()) {
      return { success: false, error: 'User credits already initialized' };
    }

    const newReferralCode = generateReferralCode(userId);
    const creditData = {
      userId,
      totalCredits: CREDIT_RATES.SIGNUP_BONUS,
      availableCredits: CREDIT_RATES.SIGNUP_BONUS,
      pendingCredits: 0,
      lifetimeEarned: CREDIT_RATES.SIGNUP_BONUS,
      lifetimeSpent: 0,
      referralCode: newReferralCode,
      referredBy: referralCode || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await set(userCreditsRef, creditData);

    // Create signup bonus transaction
    await createCreditTransaction(userId, {
      type: 'earned',
      amount: CREDIT_RATES.SIGNUP_BONUS,
      source: 'signup',
      description: 'Welcome bonus for new account',
      status: 'completed'
    });

    // Process referral if referral code was used
    if (referralCode) {
      await processReferralBonus(referralCode, userId);
    }

    return { 
      success: true, 
      data: creditData,
      message: `Welcome! You've received ${CREDIT_RATES.SIGNUP_BONUS} credits!`
    };
  } catch (error) {
    console.error('Error initializing user credits:', error);
    return { success: false, error: error.message };
  }
};

// Get user credits
export const getUserCredits = async (userId) => {
  try {
    const userCreditsRef = ref(database, `userCredits/${userId}`);
    const snapshot = await get(userCreditsRef);
    
    if (!snapshot.exists()) {
      // Initialize credits if they don't exist
      const initResult = await initializeUserCredits(userId);
      if (initResult.success) {
        return { success: true, data: initResult.data };
      }
      return { success: false, error: 'Failed to initialize user credits' };
    }

    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error('Error getting user credits:', error);
    return { success: false, error: error.message };
  }
};

// Award credits to user
export const awardCredits = async (userId, amount, source, description, orderId = null, referralUserId = null) => {
  try {
    const userCreditsRef = ref(database, `userCredits/${userId}`);
    
    // Use transaction to ensure atomic updates
    const result = await runTransaction(userCreditsRef, (currentData) => {
      if (currentData === null) {
        return null; // Abort transaction if user doesn't exist
      }

      return {
        ...currentData,
        totalCredits: (currentData.totalCredits || 0) + amount,
        availableCredits: (currentData.availableCredits || 0) + amount,
        lifetimeEarned: (currentData.lifetimeEarned || 0) + amount,
        updatedAt: serverTimestamp()
      };
    });

    if (!result.committed) {
      return { success: false, error: 'Failed to update user credits' };
    }

    // Create transaction record
    await createCreditTransaction(userId, {
      type: 'earned',
      amount,
      source,
      description,
      orderId,
      referralUserId,
      status: 'completed'
    });

    return { 
      success: true, 
      data: result.snapshot.val(),
      message: `You earned ${amount} credits!`
    };
  } catch (error) {
    console.error('Error awarding credits:', error);
    return { success: false, error: error.message };
  }
};

// Spend credits (for payments)
export const spendCredits = async (userId, amount, orderId, description = 'Order payment') => {
  try {
    const userCreditsRef = ref(database, `userCredits/${userId}`);
    
    // Use transaction to ensure atomic updates and validate balance
    const result = await runTransaction(userCreditsRef, (currentData) => {
      if (currentData === null) {
        return null; // Abort transaction if user doesn't exist
      }

      const availableCredits = currentData.availableCredits || 0;
      if (availableCredits < amount) {
        return null; // Abort transaction if insufficient credits
      }

      return {
        ...currentData,
        availableCredits: availableCredits - amount,
        lifetimeSpent: (currentData.lifetimeSpent || 0) + amount,
        updatedAt: serverTimestamp()
      };
    });

    if (!result.committed) {
      return { success: false, error: 'Insufficient credits or user not found' };
    }

    // Create transaction record
    await createCreditTransaction(userId, {
      type: 'spent',
      amount,
      source: 'payment',
      description,
      orderId,
      status: 'completed'
    });

    return { 
      success: true, 
      data: result.snapshot.val(),
      message: `${amount} credits used for payment`
    };
  } catch (error) {
    console.error('Error spending credits:', error);
    return { success: false, error: error.message };
  }
};

// Process referral bonus
export const processReferralBonus = async (referralCode, newUserId) => {
  try {
    // Find the user who owns this referral code
    const userCreditsRef = ref(database, 'userCredits');
    const referralQuery = query(userCreditsRef, orderByChild('referralCode'), equalTo(referralCode));
    const snapshot = await get(referralQuery);

    if (!snapshot.exists()) {
      return { success: false, error: 'Invalid referral code' };
    }

    const referrerData = Object.values(snapshot.val())[0];
    const referrerId = referrerData.userId;

    // Prevent self-referral
    if (referrerId === newUserId) {
      return { success: false, error: 'Cannot refer yourself' };
    }

    // Award credits to referrer
    const awardResult = await awardCredits(
      referrerId,
      CREDIT_RATES.REFERRAL_BONUS,
      'referral',
      `Referral bonus for inviting new user`,
      null,
      newUserId
    );

    if (awardResult.success) {
      return { 
        success: true, 
        message: `Referral bonus awarded to ${referrerId}`,
        referrerId 
      };
    }

    return awardResult;
  } catch (error) {
    console.error('Error processing referral bonus:', error);
    return { success: false, error: error.message };
  }
};

// Calculate credits earned from purchase
export const calculatePurchaseCredits = (orderTotal) => {
  return Math.floor(orderTotal * CREDIT_RATES.PURCHASE_RATE);
};

// Process purchase credits
export const processPurchaseCredits = async (userId, orderTotal, orderId) => {
  const creditsEarned = calculatePurchaseCredits(orderTotal);
  
  if (creditsEarned > 0) {
    return await awardCredits(
      userId,
      creditsEarned,
      'purchase',
      `Credits earned from order #${orderId}`,
      orderId
    );
  }

  return { success: true, data: { creditsEarned: 0 } };
};

// Create credit transaction record
export const createCreditTransaction = async (userId, transactionData) => {
  try {
    const transactionsRef = ref(database, 'creditTransactions');
    const newTransactionRef = push(transactionsRef);
    
    const transaction = {
      transactionId: newTransactionRef.key,
      userId,
      ...transactionData,
      createdAt: serverTimestamp(),
      processedAt: serverTimestamp()
    };

    await set(newTransactionRef, transaction);
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error creating credit transaction:', error);
    return { success: false, error: error.message };
  }
};

// Get user's credit transaction history
export const getCreditTransactions = async (userId, limit = 50) => {
  try {
    const transactionsRef = ref(database, 'creditTransactions');
    const userTransactionsQuery = query(
      transactionsRef,
      orderByChild('userId'),
      equalTo(userId),
      limitToLast(limit)
    );
    
    const snapshot = await get(userTransactionsQuery);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const transactions = Object.values(snapshot.val())
      .sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    return { success: false, error: error.message };
  }
};

// Validate credit payment
export const validateCreditPayment = async (userId, creditAmount) => {
  try {
    const userCredits = await getUserCredits(userId);
    
    if (!userCredits.success) {
      return { success: false, error: 'Unable to get user credits' };
    }

    const availableCredits = userCredits.data.availableCredits || 0;
    
    if (creditAmount > availableCredits) {
      return { 
        success: false, 
        error: 'Insufficient credits',
        availableCredits 
      };
    }

    return { 
      success: true, 
      availableCredits,
      creditValue: creditAmount * CREDIT_RATES.CREDIT_VALUE
    };
  } catch (error) {
    console.error('Error validating credit payment:', error);
    return { success: false, error: error.message };
  }
};

// Convert credits to dollar value
export const creditsToDollars = (credits) => {
  return credits * CREDIT_RATES.CREDIT_VALUE;
};

// Convert dollars to credits
export const dollarsToCredits = (dollars) => {
  return Math.floor(dollars / CREDIT_RATES.CREDIT_VALUE);
};

// Get referral statistics
export const getReferralStats = async (userId) => {
  try {
    const transactionsRef = ref(database, 'creditTransactions');
    const referralQuery = query(
      transactionsRef,
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const snapshot = await get(referralQuery);
    
    if (!snapshot.exists()) {
      return { success: true, data: { totalReferrals: 0, totalReferralCredits: 0 } };
    }

    const transactions = Object.values(snapshot.val());
    const referralTransactions = transactions.filter(t => t.source === 'referral');
    
    const stats = {
      totalReferrals: referralTransactions.length,
      totalReferralCredits: referralTransactions.reduce((sum, t) => sum + t.amount, 0),
      referralHistory: referralTransactions.sort((a, b) => b.createdAt - a.createdAt)
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe to real-time credit updates
export const subscribeToUserCredits = (userId, callback) => {
  const userCreditsRef = ref(database, `userCredits/${userId}`);
  
  const unsubscribe = onValue(userCreditsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ success: true, data: snapshot.val() });
    } else {
      callback({ success: false, error: 'User credits not found' });
    }
  }, (error) => {
    callback({ success: false, error: error.message });
  });

  return unsubscribe;
};

// Admin function: Manually adjust user credits
export const adminAdjustCredits = async (userId, amount, reason, adminId) => {
  try {
    const adjustmentType = amount > 0 ? 'earned' : 'spent';
    const adjustmentAmount = Math.abs(amount);
    
    if (adjustmentType === 'earned') {
      return await awardCredits(
        userId,
        adjustmentAmount,
        'admin',
        `Admin adjustment: ${reason}`,
        null,
        adminId
      );
    } else {
      return await spendCredits(
        userId,
        adjustmentAmount,
        null,
        `Admin adjustment: ${reason}`
      );
    }
  } catch (error) {
    console.error('Error in admin credit adjustment:', error);
    return { success: false, error: error.message };
  }
};

// Get credit system statistics (for admin dashboard)
export const getCreditSystemStats = async () => {
  try {
    const userCreditsRef = ref(database, 'userCredits');
    const transactionsRef = ref(database, 'creditTransactions');
    
    const [creditsSnapshot, transactionsSnapshot] = await Promise.all([
      get(userCreditsRef),
      get(transactionsRef)
    ]);

    const users = creditsSnapshot.exists() ? Object.values(creditsSnapshot.val()) : [];
    const transactions = transactionsSnapshot.exists() ? Object.values(transactionsSnapshot.val()) : [];

    const stats = {
      totalUsers: users.length,
      totalCreditsIssued: users.reduce((sum, user) => sum + (user.lifetimeEarned || 0), 0),
      totalCreditsSpent: users.reduce((sum, user) => sum + (user.lifetimeSpent || 0), 0),
      totalCreditsOutstanding: users.reduce((sum, user) => sum + (user.availableCredits || 0), 0),
      totalTransactions: transactions.length,
      signupBonuses: transactions.filter(t => t.source === 'signup').length,
      referralBonuses: transactions.filter(t => t.source === 'referral').length,
      purchaseCredits: transactions.filter(t => t.source === 'purchase').length,
      creditPayments: transactions.filter(t => t.source === 'payment').length
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting credit system stats:', error);
    return { success: false, error: error.message };
  }
};

export default {
  // Core functions
  initializeUserCredits,
  getUserCredits,
  awardCredits,
  spendCredits,
  
  // Referral functions
  processReferralBonus,
  getReferralStats,
  generateReferralCode,
  
  // Purchase functions
  calculatePurchaseCredits,
  processPurchaseCredits,
  
  // Transaction functions
  createCreditTransaction,
  getCreditTransactions,
  
  // Validation functions
  validateCreditPayment,
  
  // Utility functions
  creditsToDollars,
  dollarsToCredits,
  
  // Real-time functions
  subscribeToUserCredits,
  
  // Admin functions
  adminAdjustCredits,
  getCreditSystemStats,
  
  // Constants
  CREDIT_RATES
};

