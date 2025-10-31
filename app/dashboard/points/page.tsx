'use client';

import { useState, useEffect } from 'react';
import { Coins, History, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import PointsPurchaseModal from '@/components/ui/PointsPurchaseModal';
import toast from 'react-hot-toast';

export default function PointsPage() {
  const { user, firebaseUser } = useAuth();
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number>(user?.memberPoints || 0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);

  // Update currentPoints when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setCurrentPoints(user.memberPoints);
    }
  }, [user?.memberPoints]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!firebaseUser?.uid) {
        // If no firebaseUser, use user data as fallback
        setCurrentPoints(user?.memberPoints || 0);
        setLoadingBalance(false);
        return;
      }
      
      try {
        setLoadingBalance(true);
        const res = await fetch(`/api/purchase-points?userId=${firebaseUser.uid}`);
        const data = await res.json();
        
        if (res.ok && typeof data.memberPoints === 'number') {
          setCurrentPoints(data.memberPoints);
        } else {
          // Fallback to user data if API fails
          console.log('API failed, using user data fallback:', data);
          setCurrentPoints(user?.memberPoints || 0);
        }
      } catch (err) {
        console.error('Failed to fetch points balance', err);
        // Fallback to user data on error
        setCurrentPoints(user?.memberPoints || 0);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [firebaseUser, user]);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!firebaseUser?.uid) {
        return;
      }
      
      try {
        setLoadingTransactions(true);
        const res = await fetch(`/api/points-transactions?userId=${firebaseUser.uid}&limit=20`);
        const data = await res.json();
        
        if (res.ok && data.success) {
          setTransactions(data.transactions || []);
        } else {
          console.log('Failed to fetch transactions:', data);
        }
      } catch (err) {
        console.error('Failed to fetch transaction history', err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [firebaseUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Points Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">目前點數餘額</h2>
              <p className="text-4xl font-bold">{loadingBalance ? '...' : currentPoints}</p>
              <p className="text-blue-100 mt-1">點數</p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-full p-4 mb-4">
                <Coins className="h-8 w-8" />
              </div>
              <button
                onClick={() => setShowPointsModal(true)}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                購買點數
              </button>
            </div>
          </div>
        </div>


        {/* Transaction History */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">交易記錄</h3>
            </div>
          </div>
          
          <div className="p-6">
            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue- 

600"></div>
                <p className="mt-2 text-gray-600">載入交易記錄中...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">暫無交易記錄</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'purchase' || transaction.pointsPurchased 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'purchase' || transaction.pointsPurchased ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || (transaction.type === 'purchase' || transaction.pointsPurchased 
                            ? '購買點數' 
                            : '消費點數')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.type === 'purchase' || transaction.pointsPurchased 
                            ? `購買 ${transaction.pointsPurchased || transaction.amount} 點`
                            : `消費 ${transaction.pointsDeducted || transaction.amount} 點`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.transactionDate || transaction.purchaseDate).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'purchase' || transaction.pointsPurchased 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'purchase' || transaction.pointsPurchased ? '+' : '-'}
                        {transaction.pointsPurchased || transaction.pointsDeducted || transaction.amount} 點
                      </p>
                      <p className="text-sm text-gray-600">
                        餘額: {transaction.newBalance || transaction.balanceAfter || 'N/A'} 點
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">關於會員點數</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• 1 港元 = 1 點</p>
            <p>• 點數購買後立即到帳，可用於購買所有商品</p>
            <p>• 點數不會過期，可隨時使用</p>
            <p>• 所有交易記錄都會保存在此頁面</p>
          </div>
        </div>
      </div>
      
      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onPointsPurchased={(newBalance) => {
          if (typeof newBalance === 'number') {
            setCurrentPoints(newBalance);
            // Refresh transaction history
            const fetchTransactions = async () => {
              if (!firebaseUser?.uid) return;
              
              try {
                const res = await fetch(`/api/points-transactions?userId=${firebaseUser.uid}&limit=20`);
                const data = await res.json();
                
                if (res.ok && data.success) {
                  setTransactions(data.transactions || []);
                }
              } catch (err) {
                console.error('Failed to refresh transaction history', err);
              }
            };
            
            fetchTransactions();
          }
        }}
      />
    </div>
  );
}