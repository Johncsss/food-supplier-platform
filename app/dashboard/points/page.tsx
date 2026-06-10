'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Coins,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  ShieldCheck,
  UploadCloud,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import PointsPurchaseModal from '@/components/ui/PointsPurchaseModal';
import { DEFAULT_POINTS_PLANS, NormalizedPointsPlan } from '@/lib/points-plans';

export default function PointsPage() {
  const { user, firebaseUser } = useAuth();
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number>(user?.memberPoints || 0);
  const [pendingPoints, setPendingPoints] = useState<number>(user?.pendingPoints || 0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [pointPlans, setPointPlans] = useState<NormalizedPointsPlan[]>(DEFAULT_POINTS_PLANS);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [pageRefreshing, setPageRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // Update currentPoints when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setCurrentPoints(user.memberPoints);
    }
    if (user?.pendingPoints !== undefined) {
      setPendingPoints(user.pendingPoints);
    }
  }, [user?.memberPoints, user?.pendingPoints]);

  const fetchBalance = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setCurrentPoints(user?.memberPoints || 0);
      setPendingPoints(user?.pendingPoints || 0);
      setLoadingBalance(false);
      return;
    }
    
    try {
      setLoadingBalance(true);
      const res = await fetch(`/api/purchase-points?userId=${firebaseUser.uid}`);
      const data = await res.json();
      
      if (res.ok && typeof data.memberPoints === 'number') {
        setCurrentPoints(data.memberPoints);
        if (typeof data.pendingPoints === 'number') {
          setPendingPoints(data.pendingPoints);
        }
        setLastUpdatedAt(new Date().toISOString());
      } else {
        console.log('API failed, using user data fallback:', data);
        setCurrentPoints(user?.memberPoints || 0);
        setPendingPoints(user?.pendingPoints || 0);
      }
    } catch (err) {
      console.error('Failed to fetch points balance', err);
      setCurrentPoints(user?.memberPoints || 0);
      setPendingPoints(user?.pendingPoints || 0);
    } finally {
      setLoadingBalance(false);
    }
  }, [firebaseUser?.uid, user?.memberPoints, user?.pendingPoints]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
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
  }, [firebaseUser?.uid]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const response = await fetch('/api/points-plans');
      if (!response.ok) {
        throw new Error(`Failed to fetch points plans (${response.status})`);
      }
      const result = await response.json();
      const plans: NormalizedPointsPlan[] = Array.isArray(result.plans) ? result.plans : [];
      if (plans.length > 0) {
        setPointPlans(plans);
      } else {
        setPointPlans(DEFAULT_POINTS_PLANS);
      }
    } catch (error) {
      console.error('Failed to fetch points plans:', error);
      setPointPlans(DEFAULT_POINTS_PLANS);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenModal = (planId?: string | null) => {
    setSelectedPlanId(planId ?? null);
    setShowPointsModal(true);
  };

  const handleRefreshAll = async () => {
    setPageRefreshing(true);
    await Promise.all([fetchBalance(), fetchTransactions(), fetchPlans()]);
    setPageRefreshing(false);
  };

  const latestTransaction = transactions[0];

  const recommendedPlanId = useMemo(() => {
    if (!pointPlans.length) return null;
    return pointPlans.reduce(
      (best, plan) => (plan.points > best.points ? plan : best),
      pointPlans[0],
    ).id;
  }, [pointPlans]);

  const howToSteps = [
    {
      icon: Wallet,
      title: '選擇方案',
      description: '挑選適合的點數方案並確認金額。',
    },
    {
      icon: UploadCloud,
      title: '上傳轉帳收據',
      description: '掃描 QR Code 完成轉帳，並上傳清晰收據截圖。',
    },
    {
      icon: ShieldCheck,
      title: '等待審核',
      description: '客服審核通過後，點數將自動加入您的帳戶。',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary Cards */}
        <div className="grid gap-4 mb-8 md:grid-cols-3">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-32 opacity-20 bg-white rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">目前點數餘額</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight">
                    {loadingBalance ? '...' : currentPoints.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <Coins className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-blue-100">
                <span>
                  {lastUpdatedAt
                    ? `最後更新：${new Date(lastUpdatedAt).toLocaleString('zh-TW')}`
                    : '從最新資料計算'}
                </span>
                <button
                  onClick={handleRefreshAll}
                  disabled={pageRefreshing}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0B8628', color: '#FFFFFF' }}
                >
                  {pageRefreshing ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-b border-white"></span>
                      重新整理中...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-3.5 w-3.5" />
                      重新整理
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
              >
                <Coins className="h-4 w-4" />
                購買點數
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">待審核點數</p>
              <p className="mt-3 text-3xl font-bold text-blue-600">
                {pendingPoints.toLocaleString()} 點
              </p>
              <p className="mt-2 text-sm text-gray-500">
                收據提交後，客服會在收到資料後儘速完成審核。通過後點數將自動入帳。
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              若有緊急需求，請聯絡客服團隊協助。
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">最近交易</p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {transactions.length}
                <span className="ml-1 text-base font-medium text-gray-500">筆紀錄</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {latestTransaction
                  ? `最後更新：${
                      (() => {
                        const rawDate =
                          latestTransaction.transactionDate || latestTransaction.purchaseDate;
                        if (rawDate?.toDate) return rawDate.toDate().toLocaleString('zh-TW');
                        if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                          const parsed = new Date(rawDate);
                          return Number.isNaN(parsed.getTime())
                            ? '-'
                            : parsed.toLocaleString('zh-TW');
                        }
                        if (rawDate?._seconds) {
                          return new Date(rawDate._seconds * 1000).toLocaleString('zh-TW');
                        }
                        return '-';
                      })()
                    }`
                  : '尚未有交易紀錄'}
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              交易歷史會保留最近 20 筆紀錄。
            </div>
          </div>
        </div>

        {/* Points Plans */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">點數方案</h3>
              <p className="text-sm text-gray-600 mt-1">選擇適合的點數方案，即可快速購買。</p>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex justify-center items-center py-10 text-gray-500">
              點數方案載入中...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {pointPlans.map((plan) => {
                const isRecommended = plan.id === recommendedPlanId;
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleOpenModal(plan.id)}
                    className={`group rounded-xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isRecommended
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">方案</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">{plan.title}</p>
                      </div>
                      {isRecommended && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          推薦
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-blue-600">
                        {plan.points.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">點</p>
                    </div>
                    <p className="text-sm text-gray-500">HKD ${plan.points.toLocaleString()}</p>
                    <p className="mt-4 text-xs text-gray-400 group-hover:text-gray-500">
                      點擊方案即可查看付款資訊並送出申請。
                    </p>
                  </button>
                );
              })}
            </div>
          )}
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
                          {(() => {
                            const rawDate = transaction.transactionDate || transaction.purchaseDate;
                            if (rawDate?.toDate) {
                              return rawDate.toDate().toLocaleString('zh-TW');
                            }
                            if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                              const parsed = new Date(rawDate);
                              return Number.isNaN(parsed.getTime())
                                ? ''
                                : parsed.toLocaleString('zh-TW');
                            }
                            if (rawDate?._seconds) {
                              return new Date(rawDate._seconds * 1000).toLocaleString('zh-TW');
                            }
                            return '';
                          })()}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Info Section */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="bg-white rounded-lg border shadow-sm p-6 lg:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4">購買流程小提醒</h4>
            <div className="grid gap-4 md:grid-cols-3">
              {howToSteps.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 inline-flex items-center justify-center rounded-full bg-blue-50 p-2 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-3">小幫手</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 申請審核時間約 1–2 個工作日。</li>
              <li>• 如遇到收據無法上傳，請聯絡客服。</li>
              <li>• 按「重新整理」更新點數顯示。</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        isOpen={showPointsModal}
        onClose={() => {
          setShowPointsModal(false);
          setSelectedPlanId(null);
        }}
        initialPlanId={selectedPlanId}
        onPointsPurchased={(newBalance) => {
          if (typeof newBalance === 'number') {
            setCurrentPoints(newBalance);
          }
          // Refresh balances regardless of response
          fetchBalance();
          fetchTransactions();
        }}
      />
    </div>
  );
}