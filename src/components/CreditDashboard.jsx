// Credit Dashboard Component
// src/components/CreditDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useCredit } from '../context/CreditContext';
import { 
  Coins, 
  Gift, 
  Share2, 
  TrendingUp, 
  History, 
  Copy, 
  MessageCircle, 
  Mail,
  Star,
  Award,
  Calendar,
  DollarSign,
  Users,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

const CreditDashboard = () => {
  const {
    credits,
    transactions,
    referralStats,
    loading,
    error,
    getCreditBalance,
    formatCredits,
    formatCreditValue,
    getReferralLink,
    shareReferralCode,
    getRecentTransactions,
    getCreditTier,
    CREDIT_RATES
  } = useCredit();

  const [activeTab, setActiveTab] = useState('overview');
  const [shareMessage, setShareMessage] = useState('');

  const creditBalance = getCreditBalance();
  const recentTransactions = getRecentTransactions(10);
  const creditTier = getCreditTier();

  // Handle referral sharing
  const handleShare = async (method) => {
    const result = await shareReferralCode(method);
    setShareMessage(result.message);
    setTimeout(() => setShareMessage(''), 3000);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction icon
  const getTransactionIcon = (type, source) => {
    switch (source) {
      case 'signup': return <Gift className="w-4 h-4 text-green-500" />;
      case 'referral': return <Users className="w-4 h-4 text-purple-500" />;
      case 'purchase': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-red-500" />;
      default: return <Coins className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get transaction color
  const getTransactionColor = (type) => {
    return type === 'earned' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Dashboard</h1>
          <p className="text-gray-600">Manage your credits, track earnings, and share with friends</p>
        </div>

        {/* Credit Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Available Credits */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Available Credits</h3>
                  <p className="text-sm text-gray-500">Ready to use</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {formatCredits(creditBalance.credits)}
              </div>
              <div className="text-lg text-gray-600">
                {formatCreditValue(creditBalance.credits)} value
              </div>
            </div>
          </div>

          {/* Lifetime Earned */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lifetime Earned</h3>
                  <p className="text-sm text-gray-500">Total credits earned</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {formatCredits(credits.lifetimeEarned)}
              </div>
              <div className="flex items-center space-x-2">
                <Award className={`w-4 h-4 ${creditTier.color}`} />
                <span className={`text-sm font-medium ${creditTier.color}`}>
                  {creditTier.tier} Member
                </span>
              </div>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Referrals</h3>
                  <p className="text-sm text-gray-500">Friends invited</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {referralStats.totalReferrals}
              </div>
              <div className="text-sm text-gray-600">
                {formatCredits(referralStats.totalReferralCredits)} credits earned
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'transactions', label: 'Transactions', icon: History },
                { id: 'referrals', label: 'Referrals', icon: Share2 },
                { id: 'earn', label: 'Earn More', icon: Gift }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Credit Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Available Credits</span>
                        <span className="font-semibold text-blue-600">
                          {formatCredits(credits.availableCredits)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Lifetime Spent</span>
                        <span className="font-semibold text-red-600">
                          {formatCredits(credits.lifetimeSpent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Value</span>
                        <span className="font-semibold text-green-600">
                          {formatCreditValue(credits.lifetimeEarned)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab('referrals')}
                        className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Share2 className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-purple-900">Share & Earn</span>
                        </div>
                        <span className="text-sm text-purple-600">+2,500 credits</span>
                      </button>
                      
                      <button
                        onClick={() => window.location.href = '/products'}
                        className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <ShoppingBag className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Shop & Earn</span>
                        </div>
                        <span className="text-sm text-blue-600">10 credits/$1</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type, transaction.source)}
                          <div>
                            <div className="font-medium text-gray-900">{transaction.description}</div>
                            <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                          </div>
                        </div>
                        <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'earned' ? '+' : '-'}{formatCredits(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="space-y-3">
                  {transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.type, transaction.source)}
                        <div>
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)} • {transaction.source}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'earned' ? '+' : '-'}{formatCredits(transaction.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCreditValue(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions yet. Start shopping to earn credits!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {credits.referralCode}
                      </div>
                      <p className="text-gray-600">
                        Share this code and earn {formatCredits(CREDIT_RATES.REFERRAL_BONUS)} credits for each friend who signs up!
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </button>
                      
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </button>
                      
                      <button
                        onClick={() => handleShare('email')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </button>
                    </div>
                    
                    {shareMessage && (
                      <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
                        {shareMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Referral Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {referralStats.totalReferrals}
                      </div>
                      <div className="text-gray-600">Total Referrals</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCredits(referralStats.totalReferralCredits)}
                      </div>
                      <div className="text-gray-600">Credits Earned</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Earn More Tab */}
            {activeTab === 'earn' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Ways to Earn Credits</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Purchase Credits */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-blue-900">Shop & Earn</h4>
                        <p className="text-blue-700">Earn credits with every purchase</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {CREDIT_RATES.PURCHASE_RATE} credits per $1
                      </div>
                      <p className="text-blue-700">
                        Every dollar you spend earns you {CREDIT_RATES.PURCHASE_RATE} credits automatically!
                      </p>
                    </div>
                    <button
                      onClick={() => window.location.href = '/products'}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Start Shopping</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Referral Credits */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-purple-900">Refer Friends</h4>
                        <p className="text-purple-700">Biggest credit rewards</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCredits(CREDIT_RATES.REFERRAL_BONUS)} credits
                      </div>
                      <p className="text-purple-700">
                        For each friend who signs up using your referral code!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('referrals')}
                      className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Share Now</span>
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Credit Value Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Credit Value</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">1 Credit</div>
                      <div className="text-gray-600">= $0.01 USD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">100 Credits</div>
                      <div className="text-gray-600">= $1.00 USD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">2,500 Credits</div>
                      <div className="text-gray-600">= $25.00 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditDashboard;

