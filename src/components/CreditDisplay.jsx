// Credit Display Component for Header
// src/components/CreditDisplay.jsx

import React, { useState } from 'react';
import { useCredit } from '../context/CreditContext';
import { Coins, TrendingUp, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreditDisplay = ({ compact = false }) => {
  const { 
    credits, 
    loading, 
    formatCredits, 
    formatCreditValue, 
    getCreditBalance 
  } = useCredit();
  
  const [showTooltip, setShowTooltip] = useState(false);
  const creditBalance = getCreditBalance();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact version for mobile or small spaces
    return (
      <Link 
        to="/credits" 
        className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 transition-colors"
      >
        <Coins className="w-4 h-4" />
        <span className="font-medium text-sm">
          {formatCredits(creditBalance.credits)}
        </span>
      </Link>
    );
  }

  // Full version for desktop header
  return (
    <div className="relative">
      <Link 
        to="/credits"
        className="flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 px-4 py-2 rounded-lg border border-yellow-200 transition-all duration-200 group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-yellow-100 rounded-full group-hover:bg-yellow-200 transition-colors">
            <Coins className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-yellow-800">
              {formatCredits(creditBalance.credits)} Credits
            </div>
            <div className="text-xs text-yellow-600">
              {formatCreditValue(creditBalance.credits)} value
            </div>
          </div>
        </div>
        
        {/* Earning indicator */}
        {credits.lifetimeEarned > credits.availableCredits && (
          <div className="flex items-center space-x-1 text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">Earning</span>
          </div>
        )}
      </Link>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Credits</span>
              <span className="font-semibold text-yellow-600">
                {formatCredits(credits.availableCredits)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lifetime Earned</span>
              <span className="font-semibold text-green-600">
                {formatCredits(credits.lifetimeEarned)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="font-semibold text-blue-600">
                {formatCreditValue(credits.lifetimeEarned)}
              </span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex items-center space-x-2 text-purple-600">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Earn 2,500 credits by referring friends!
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Click to view full credit dashboard
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditDisplay;

