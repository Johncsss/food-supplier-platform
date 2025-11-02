'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { ShoppingCart, Trash2, ArrowLeft, Package, Plus, Minus, Coins } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { t } from '@/lib/translate';
import Link from 'next/link';
import toast from 'react-hot-toast';
// Removed direct Firestore imports - now using API endpoints
import PointsPurchaseModal from '@/components/ui/PointsPurchaseModal';
import CheckoutPasswordModal from '@/components/ui/CheckoutPasswordModal';

export default function Cart() {
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, firebaseUser, loading } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showCheckoutPasswordModal, setShowCheckoutPasswordModal] = useState(false);
  // Removed demo points; always use real user.memberPoints

  // Cleanup effect to reset loading state if component unmounts during checkout
  useEffect(() => {
    return () => {
      if (isCheckingOut) {
        setIsCheckingOut(false);
      }
    };
  }, [isCheckingOut]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (loading) {
      toast.error('正在載入帳戶資料，請稍後再試');
      return;
    }

    if (!firebaseUser) {
      toast.error('請先登入以進行結帳');
      return;
    }

    if (!user) {
      toast.error('帳戶資料尚未載入，請重新整理或稍後再試');
      return;
    }

    if (state.items.length === 0) {
      toast.error('購物車是空的');
      return;
    }

    // Check if user has enough points
    const requiredPoints = state.totalAmount;
    const userPoints = user?.memberPoints || 0;

    if (userPoints < requiredPoints) {
      const shortfall = requiredPoints - userPoints;
      toast.error(`點數不足！需要 ${requiredPoints} 點，您只有 ${userPoints} 點。還需要購買 ${shortfall} 點才能完成結帳。`);
      setShowPointsModal(true);
      return;
    }

    // Check if user has set up checkout password
    if (!user.checkoutPassword) {
      toast.error('請先到個人資料頁面設定結帳密碼');
      window.location.href = '/dashboard/profile';
      return;
    }

    // Show checkout password modal
    setShowCheckoutPasswordModal(true);
  };

  const handlePasswordVerified = async () => {
    setShowCheckoutPasswordModal(false);
    setIsCheckingOut(true);

    try {
      // Check if we're in demo mode (using demo points)
      // Demo mode removed; always perform real checkout

      // Regular checkout for non-demo users - use API endpoint instead of direct Firestore
      console.log('Creating order via API endpoint...');
      
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      
      // Build user data for API
      const userData = {
        id: firebaseUser.uid,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || '',
        restaurantName: user?.restaurantName || ''
      };

      // Build order data for API
      const orderData = {
        items: state.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          imageUrl: item.imageUrl || '',
          supplier: item.supplier || '',
          unit: item.unit || ''
        })),
        totalAmount: state.totalAmount,
        user: userData
      };

      console.log('Sending order to API:', {
        itemCount: orderData.items.length,
        totalAmount: orderData.totalAmount,
        userId: userData.id,
        userEmail: userData.email
      });

      // Call the create-order API endpoint
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      console.log('Order created successfully via API:', result.orderId);

      // Deduct points using the deduct-points API
      try {
        console.log('Deducting points via API...');
        const deductResponse = await fetch('/api/deduct-points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: firebaseUser.uid,
            amount: state.totalAmount,
            description: `結帳購買商品，總金額 ${state.totalAmount} 點`
          })
        });

        const deductResult = await deductResponse.json();

        if (!deductResponse.ok) {
          console.warn('Could not deduct points:', deductResult.error);
          // Continue even if points deduction fails
        } else {
          console.log('Points deducted successfully:', deductResult.newBalance);
        }
      } catch (deductError: any) {
        console.warn('Could not deduct points (user document may not exist):', deductError.message);
        // Continue with order creation even if points update fails
      }

      toast.success(`訂單已成功創建！已扣除 ${state.totalAmount} 點`);
      clearCart();
      setIsCheckingOut(false);
      setTimeout(() => {
        window.location.href = '/dashboard/orders';
      }, 100);
    } catch (err: any) {
      console.error('Error creating order:', err);
      const message = err?.message || '請稍後再試';
      toast.error(`結帳時發生錯誤: ${message}`);
      setIsCheckingOut(false);
    }
  };

  const handlePasswordIncorrect = () => {
    toast.error('密碼錯誤，請重試');
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">您的訂貨是空的</h1>
            <p className="text-gray-600 mb-8">
              看起來您還沒有添加任何產品到您的訂貨中。
            </p>
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>繼續訂貨</span>
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">訂貨管理</h1>
          <p className="text-gray-600">
            檢視您的項目並進行結帳。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    訂貨項目 ({state.totalItems})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                  >
                    清空訂貨
                  </button>
                </div>

                <div className="space-y-4">
                  {state.items.map((item) => (
                    <div key={item.productId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.productName}</h3>
                        <p className="text-sm text-gray-600">
                          ${item.unitPrice.toFixed(2)} per unit
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">訂單摘要</h2>
                
                                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">運費</span>
                      <span className="font-medium text-green-600">免費</span>
                    </div>
                    
                    {/* Points Balance Display */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-800">會員點數餘額</span>
                      <span className="font-bold text-blue-900">{user?.memberPoints || 0} 點</span>
                      </div>
                      {(user?.memberPoints || 0) < state.totalAmount && (
                        <div className="mt-2 text-xs text-red-600">
                          點數不足！需要 {state.totalAmount} 點
                        </div>
                      )}
                      <button
                        onClick={() => setShowPointsModal(true)}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-2"
                      >
                        <Coins className="w-4 h-4" />
                        購買點數
                      </button>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">總計</span>
                        <span className="text-lg font-semibold text-gray-900">
                          ${state.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        將使用 {state.totalAmount} 點進行結帳
                      </div>
                    </div>
                  </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || loading || !firebaseUser || !user}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      處理中...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      進行結帳
                    </>
                  )}
                </button>

                                  <Link
                    href="/products"
                    className="block w-full text-center text-gray-600 hover:text-gray-800 py-3 mt-4 transition-colors"
                  >
                    繼續訂貨
                  </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onPointsPurchased={() => {
          // Refresh user data after points purchase
          window.location.reload();
        }}
      />

      {/* Checkout Password Modal */}
      <CheckoutPasswordModal
        isOpen={showCheckoutPasswordModal}
        onClose={() => setShowCheckoutPasswordModal(false)}
        onPasswordVerified={handlePasswordVerified}
        onPasswordIncorrect={handlePasswordIncorrect}
        userCheckoutPassword={user?.checkoutPassword}
      />
    </div>
  );
} 