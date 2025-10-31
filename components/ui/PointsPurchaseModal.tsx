'use client';

import { useState } from 'react';
import { X, CreditCard, Coins } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

interface PointsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPointsPurchased?: (newBalance: number) => void;
}

const POINTS_PACKAGES = [
  { points: 100, price: 100, label: '100 點' },
  { points: 500, price: 500, label: '500 點' },
  { points: 1000, price: 1000, label: '1000 點' },
  { points: 2000, price: 2000, label: '2000 點' },
  { points: 5000, price: 5000, label: '5000 點' },
];

export default function PointsPurchaseModal({ 
  isOpen, 
  onClose, 
  onPointsPurchased 
}: PointsPurchaseModalProps) {
  const { user, firebaseUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    console.log('=== Points Purchase Debug ===');
    console.log('firebaseUser:', firebaseUser);
    console.log('user:', user);
    console.log('isOpen:', isOpen);
    
    // For demo purposes, allow purchase even without full authentication
    if (!firebaseUser) {
      console.log('No Firebase user - redirecting to login');
      toast.error('請先登入以購買點數');
      onClose();
      // Redirect to login page
      window.location.href = '/login';
      return;
    }
    
    if (!user) {
      console.log('No user data - using minimal user for demo');
      // Create a minimal user for demo purposes
      const minimalUser = {
        id: firebaseUser.uid,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Demo User',
        restaurantName: 'Demo Restaurant',
        phone: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        membershipStatus: 'active' as const,
        membershipExpiry: new Date(),
        memberPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Using minimal user for demo:', minimalUser);
    }

    console.log('Firebase User UID:', firebaseUser.uid);
    console.log('User object:', user);

    const pointsToPurchase = useCustomAmount 
      ? parseInt(customAmount) 
      : selectedPackage;

    if (!pointsToPurchase || pointsToPurchase <= 0) {
      toast.error('請選擇要購買的點數');
      return;
    }

    if (useCustomAmount && (pointsToPurchase < 10 || pointsToPurchase > 50000)) {
      toast.error('自定義金額必須在 10-50000 點之間');
      return;
    }

    setIsProcessing(true);

    try {
      const requestBody = {
        userId: firebaseUser.uid,
        pointsToPurchase,
        paymentAmount: pointsToPurchase // 1 HKD = 1 point
      };
      
      console.log('Sending request:', requestBody);
      
      const response = await fetch('/api/purchase-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.demo) {
          toast.success(`演示模式：成功購買 ${pointsToPurchase} 點！`);
        } else {
          toast.success(`成功購買 ${pointsToPurchase} 點！`);
        }
        onPointsPurchased?.(data.newBalance);
        onClose();
        // Reset form
        setSelectedPackage(null);
        setCustomAmount('');
        setUseCustomAmount(false);
      } else {
        console.error('API Error Response:', data);
        toast.error(data.error || '購買失敗');
      }
    } catch (error) {
      console.error('Error purchasing points:', error);
      toast.error(`購買失敗：${error instanceof Error ? error.message : '請稍後再試'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">購買會員點數</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Balance */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">目前點數餘額</p>
            <p className="text-2xl font-bold text-green-600">
              {user?.memberPoints || 0} 點
            </p>
            {!firebaseUser && (
              <p className="text-xs text-red-600 mt-1">⚠️ 請先登入以購買點數</p>
            )}
            {firebaseUser && !user && (
              <p className="text-xs text-yellow-600 mt-1">⚠️ 用戶資料載入中...</p>
            )}
          </div>

          {/* Points Packages */}
          {!useCustomAmount && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">選擇點數套餐</h3>
              <div className="grid grid-cols-2 gap-3">
                {POINTS_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.points}
                    onClick={() => setSelectedPackage(pkg.points)}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedPackage === pkg.points
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-lg">{pkg.label}</div>
                    <div className="text-green-600 font-medium">
                      HKD ${pkg.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          {useCustomAmount && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">自定義金額</h3>
              <div className="relative">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="輸入點數 (10-50000)"
                  min="10"
                  max="50000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  點
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                自定義金額：HKD ${customAmount || '0'}
              </p>
            </div>
          )}

          {/* Toggle between packages and custom */}
          <div className="mb-6">
            <button
              onClick={() => setUseCustomAmount(!useCustomAmount)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {useCustomAmount ? '選擇預設套餐' : '自定義金額'}
            </button>
          </div>

          {/* Purchase Summary */}
          {(selectedPackage || (useCustomAmount && customAmount)) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">購買摘要</h4>
              <div className="flex justify-between">
                <span>點數：</span>
                <span className="font-medium">
                  {useCustomAmount ? customAmount : selectedPackage} 點
                </span>
              </div>
              <div className="flex justify-between">
                <span>金額：</span>
                <span className="font-medium">
                  HKD ${useCustomAmount ? customAmount : selectedPackage}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>總計：</span>
                  <span>HKD ${useCustomAmount ? customAmount : selectedPackage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isProcessing}
            >
              取消
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing || (!selectedPackage && !customAmount) || !firebaseUser}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  立即購買
                </>
              )}
            </button>
          </div>

          {/* Demo Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm font-medium text-yellow-800">演示模式</p>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              此為演示版本，無需實際付款即可購買點數
            </p>
          </div>

          {/* Terms */}
          <div className="mt-4 text-xs text-gray-500">
            <p>• 1 港元 = 1 點</p>
            <p>• 點數購買後立即到帳</p>
            <p>• 點數可用於購買所有商品</p>
          </div>
        </div>
      </div>
    </div>
  );
}
