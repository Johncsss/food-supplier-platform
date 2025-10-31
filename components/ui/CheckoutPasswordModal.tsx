'use client';

import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

interface CheckoutPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordVerified: () => void;
  onPasswordIncorrect: () => void;
  userCheckoutPassword?: string;
}

export default function CheckoutPasswordModal({
  isOpen,
  onClose,
  onPasswordVerified,
  onPasswordIncorrect,
  userCheckoutPassword
}: CheckoutPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      return;
    }

    setIsVerifying(true);

    // Simulate verification delay for better UX
    setTimeout(() => {
      if (password === userCheckoutPassword) {
        onPasswordVerified();
        setPassword('');
      } else {
        onPasswordIncorrect();
      }
      setIsVerifying(false);
    }, 500);
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Lock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">結帳驗證</h3>
              <p className="text-sm text-gray-600">請輸入結帳密碼以繼續</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="checkout-password" className="block text-sm font-medium text-gray-700 mb-2">
              結帳密碼
            </label>
            <div className="relative">
              <input
                id="checkout-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="請輸入結帳密碼"
                disabled={isVerifying}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isVerifying}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isVerifying}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isVerifying}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  驗證中...
                </>
              ) : (
                '確認'
              )}
            </button>
          </div>
        </form>

        {!userCheckoutPassword && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              您尚未設定結帳密碼，請先到{' '}
              <a href="/dashboard/profile" className="text-yellow-900 underline hover:text-yellow-700">
                個人資料
              </a>{' '}
              頁面設定結帳密碼。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
