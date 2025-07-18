// Referral Share Component
// src/components/ReferralShare.jsx

import React, { useState } from 'react';
import { useCredit } from '../context/CreditContext';
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Mail, 
  Facebook, 
  Twitter,
  Gift,
  Users,
  ExternalLink,
  CheckCircle,
  QrCode,
  Download
} from 'lucide-react';

const ReferralShare = ({ compact = false }) => {
  const { 
    credits, 
    shareReferralCode, 
    getReferralLink, 
    formatCredits,
    CREDIT_RATES 
  } = useCredit();
  
  const [shareMessage, setShareMessage] = useState('');
  const [showQR, setShowQR] = useState(false);

  const referralLink = getReferralLink();
  const shareText = `Join Ele Cafe and get ${formatCredits(CREDIT_RATES.SIGNUP_BONUS)} credits (worth $${(CREDIT_RATES.SIGNUP_BONUS * CREDIT_RATES.CREDIT_VALUE).toFixed(2)}) when you sign up! Use my referral link: ${referralLink}`;

  // Handle sharing
  const handleShare = async (method) => {
    const result = await shareReferralCode(method);
    setShareMessage(result.message);
    setTimeout(() => setShareMessage(''), 3000);
  };

  // Generate QR code URL (using a QR code service)
  const getQRCodeUrl = () => {
    const encodedUrl = encodeURIComponent(referralLink);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
  };

  // Social media sharing URLs
  const getSocialShareUrl = (platform) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(referralLink);
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'reddit':
        return `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent('Join Ele Cafe and Get Free Credits!')}`;
      default:
        return '';
    }
  };

  if (compact) {
    // Compact version for header or sidebar
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Refer & Earn</span>
          </div>
          <span className="text-sm font-medium text-purple-600">
            +{formatCredits(CREDIT_RATES.REFERRAL_BONUS)}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleShare('copy')}
            className="flex-1 bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center justify-center space-x-1"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Link</span>
          </button>
          
          <button
            onClick={() => handleShare('whatsapp')}
            className="bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
        
        {shareMessage && (
          <div className="mt-2 text-xs text-green-600 text-center">
            {shareMessage}
          </div>
        )}
      </div>
    );
  }

  // Full version for dedicated referral page
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Refer Friends & Earn Credits</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Share Ele Cafe with your friends and earn {formatCredits(CREDIT_RATES.REFERRAL_BONUS)} credits for each signup!
        </p>
      </div>

      {/* Referral Code Display */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Your Referral Code</h2>
          <div className="bg-white rounded-lg p-4 border-2 border-purple-200 inline-block">
            <div className="text-3xl font-mono font-bold text-purple-600 tracking-wider">
              {credits.referralCode}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-gray-700 mb-2">Share this link with your friends:</p>
          <div className="bg-white rounded-lg p-3 border border-gray-300 flex items-center space-x-3">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-transparent text-gray-600 text-sm"
            />
            <button
              onClick={() => handleShare('copy')}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center">
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-2 mx-auto"
          >
            <QrCode className="w-4 h-4" />
            <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
          </button>
          
          {showQR && (
            <div className="mt-4 inline-block bg-white p-4 rounded-lg border border-gray-300">
              <img
                src={getQRCodeUrl()}
                alt="Referral QR Code"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-sm text-gray-600 mt-2">Scan to visit referral link</p>
            </div>
          )}
        </div>
      </div>

      {/* Sharing Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Quick Share */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <span>Quick Share</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleShare('whatsapp')}
              className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            
            <button
              onClick={() => handleShare('email')}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            
            <button
              onClick={() => handleShare('copy')}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            
            <button
              onClick={() => handleShare('native')}
              className="bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>More</span>
            </button>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            <span>Social Media</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <a
              href={getSocialShareUrl('facebook')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>
            
            <a
              href={getSocialShareUrl('twitter')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 text-white py-3 px-4 rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </a>
            
            <a
              href={getSocialShareUrl('linkedin')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-700 text-white py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
            
            <a
              href={getSocialShareUrl('reddit')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Reddit</span>
            </a>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">How Referrals Work</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">1. Share Your Link</h4>
            <p className="text-gray-600 text-sm">
              Share your unique referral link with friends via social media, email, or messaging apps.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">2. Friend Signs Up</h4>
            <p className="text-gray-600 text-sm">
              Your friend creates an account using your referral link and gets {formatCredits(CREDIT_RATES.SIGNUP_BONUS)} welcome credits.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">3. You Earn Credits</h4>
            <p className="text-gray-600 text-sm">
              You receive {formatCredits(CREDIT_RATES.REFERRAL_BONUS)} credits (worth ${(CREDIT_RATES.REFERRAL_BONUS * CREDIT_RATES.CREDIT_VALUE).toFixed(2)}) instantly when they sign up!
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {shareMessage && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{shareMessage}</span>
        </div>
      )}

      {/* Terms */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Referral credits are awarded when your friend successfully creates an account. 
          Credits have no expiration date and can be used for any purchase.
        </p>
      </div>
    </div>
  );
};

export default ReferralShare;

