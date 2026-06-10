'use client';

import { useEffect, useState } from 'react';
import { X, CreditCard, Coins, Building2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { DEFAULT_POINTS_PLANS, NormalizedPointsPlan } from '@/lib/points-plans';
import ImageUploader from '@/components/ui/ImageUploader';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PointsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPointsPurchased?: (newBalance: number) => void;
  initialPlanId?: string | null;
}

export default function PointsPurchaseModal({ 
  isOpen, 
  onClose, 
  onPointsPurchased,
  initialPlanId = null,
}: PointsPurchaseModalProps) {
  const { user, firebaseUser } = useAuth();
  const [pointPlans, setPointPlans] = useState<NormalizedPointsPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ name: string; number: string }>>([]);

  const fetchPlans = async () => {
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
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('points-plans-cache', JSON.stringify(plans));
        }
        return;
      }
      setPointPlans(DEFAULT_POINTS_PLANS);
    } catch (error) {
      console.error('Failed to fetch points plans:', error);
      if (typeof window !== 'undefined') {
        try {
          const cached = window.localStorage.getItem('points-plans-cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPointPlans(parsed);
              return;
            }
          }
        } catch {
          // ignore cache errors
        }
      }
      setPointPlans(DEFAULT_POINTS_PLANS);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('points-plans-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPointPlans(parsed);
            setPlansLoading(false);
          }
        }
      } catch {
        // ignore cache errors
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<any>;
      const detail = custom.detail;
      if (Array.isArray(detail)) {
        setPointPlans(detail);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('points-plans-cache', JSON.stringify(detail));
        }
        setPlansLoading(false);
      } else {
        fetchPlans();
      }
    };

    window.addEventListener('points-plans-updated', handler as EventListener);
    return () => {
      window.removeEventListener('points-plans-updated', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  // Fetch payment methods from mobile-app page (same as mobile version)
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const pageDoc = await getDoc(doc(db, 'pages', 'mobile-app'));
        console.log('[PointsPurchaseModal] Fetching payment methods from Firestore...');
        if (pageDoc.exists()) {
          const data = pageDoc.data();
          const areasData = data.areas || null;
          console.log('[PointsPurchaseModal] Firestore data:', { 
            hasAreas: !!areasData, 
            paymentMethods: areasData?.paymentMethods,
            paymentMethodsType: typeof areasData?.paymentMethods,
            isArray: Array.isArray(areasData?.paymentMethods)
          });
          
          if (Array.isArray(areasData?.paymentMethods) && areasData.paymentMethods.length > 0) {
            const filtered = areasData.paymentMethods.filter((pm: any) => pm?.name && pm?.number);
            console.log('[PointsPurchaseModal] Filtered payment methods:', filtered);
            if (filtered.length > 0) {
              setPaymentMethods(filtered);
              console.log('[PointsPurchaseModal] Set payment methods from Firestore:', filtered);
              return;
            }
          }
        }
        console.log('[PointsPurchaseModal] No payment methods found in Firestore, using defaults');
        // If no payment methods found in Firestore, use default
        const defaults = [
          { name: '銀行名稱', number: '香港銀行' },
          { name: '帳號', number: '123-456-789-012' },
          { name: '戶名', number: 'iFoodPulse Limited' }
        ];
        setPaymentMethods(defaults);
        console.log('[PointsPurchaseModal] Set default payment methods:', defaults);
      } catch (error) {
        console.error('[PointsPurchaseModal] Error fetching payment methods:', error);
        // On error, use default payment methods
        const defaults = [
          { name: '銀行名稱', number: '香港銀行' },
          { name: '帳號', number: '123-456-789-012' },
          { name: '戶名', number: 'iFoodPulse Limited' }
        ];
        setPaymentMethods(defaults);
        console.log('[PointsPurchaseModal] Set default payment methods on error:', defaults);
      }
    };
    if (isOpen) {
      fetchPaymentMethods();
    } else {
      // Reset when modal closes
      setPaymentMethods([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanId(null);
      setReceiptUrl('');
    }
  }, [isOpen]);
  useEffect(() => {
    if (selectedPlanId) {
      const exists = pointPlans.some(plan => plan.id === selectedPlanId);
      if (!exists) {
        setSelectedPlanId(null);
        setReceiptUrl('');
      }
    }
  }, [pointPlans, selectedPlanId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanId(null);
      setReceiptUrl('');
      return;
    }
    if (initialPlanId) {
      const plan = pointPlans.find(p => p.id === initialPlanId);
      if (plan) {
        console.log('[PointsPurchaseModal] Setting selected plan from initialPlanId:', plan.id);
        setSelectedPlanId(plan.id);
        setReceiptUrl('');
      } else {
        console.log('[PointsPurchaseModal] Plan not found for initialPlanId:', initialPlanId, 'Available plans:', pointPlans.map(p => p.id));
      }
    }
  }, [initialPlanId, pointPlans, isOpen]);

  if (!isOpen) return null;

  const selectedPlan = selectedPlanId
    ? pointPlans.find(plan => plan.id === selectedPlanId)
    : null;
  const planPoints = selectedPlan?.points ?? 0;

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

    if (!selectedPlan) {
      toast.error('請選擇點數方案');
      return;
    }

    if (!receiptUrl) {
      toast.error('請先上傳轉帳收據');
      return;
    }

    const pointsToPurchase = planPoints;

    setIsProcessing(true);

    try {
      const requestBody = {
        userId: firebaseUser.uid,
        pointsToPurchase,
        paymentAmount: pointsToPurchase, // 1 HKD = 1 point
        receiptUrl,
        planId: selectedPlan.id,
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
        } else if (data.pending) {
          toast.success('申請已送出，等待審核，點數將於審核通過後入帳。');
        } else {
          toast.success(`成功購買 ${pointsToPurchase} 點！`);
        }
        if (typeof data.newBalance === 'number') {
          onPointsPurchased?.(data.newBalance);
        }
        onClose();
        // Reset form
        setSelectedPlanId(null);
        setReceiptUrl('');
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
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <div className="p-6 md:p-8">
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
          <div className="mb-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">選擇點數方案</h3>
              <p className="text-xs text-gray-500 mb-3">
                點選方案卡片即可查看 QR Code 與金額資訊。
              </p>
              {plansLoading ? (
                <div className="p-6 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  點數方案載入中...
                </div>
              ) : pointPlans.length === 0 ? (
                <div className="p-6 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  目前沒有可用的點數方案。
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {pointPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setReceiptUrl('');
                      }}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        selectedPlanId === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-lg">{plan.title}</div>
                      <div className="mt-1 text-xs text-gray-500">內含 {plan.points.toLocaleString()} 點</div>
                      <div className="mt-2 text-sm font-semibold text-green-600">
                        HKD ${plan.points.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPlanId && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">掃描 QR Code 轉帳</h4>
                <p className="text-xs text-gray-500 mb-3">
                  請使用手機銀行或支付應用掃描下方 QR Code，完成 {planPoints.toLocaleString()} 港元的轉帳。
                </p>
                {selectedPlan?.qrCodeUrl ? (
                  <div className="flex flex-col items-center space-y-3">
                    <img
                      src={selectedPlan.qrCodeUrl}
                      alt="收款 QR Code"
                      className="w-48 h-48 object-contain rounded-lg border border-gray-200 bg-white shadow-sm"
                    />
                    <p className="text-xs text-gray-500">
                      請使用此 QR Code 進行轉帳，並上傳收據。
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    此方案尚未設定 QR Code，請聯絡客服或選擇其他方案。
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Purchase Summary */}
          {selectedPlanId && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">購買摘要</h4>
              <div className="flex justify-between">
                <span>點數：</span>
                <span className="font-medium">
                  {planPoints.toLocaleString()} 點
                </span>
              </div>
              <div className="flex justify-between">
                <span>金額：</span>
                <span className="font-medium">
                  HKD ${planPoints.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>總計：</span>
                  <span>HKD ${planPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Section */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">付款方式</h3>
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-blue-700" />
                <h4 className="text-sm font-semibold text-blue-900">銀行轉帳資料</h4>
              </div>
              <div className="space-y-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 mb-1">{method.name}:</p>
                          <p className="text-sm font-semibold text-blue-900">{method.number}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(method.number);
                            setCopiedField(`method-${index}`);
                            setTimeout(() => setCopiedField(null), 2000);
                            toast.success(`已複製${method.name}`);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="複製"
                        >
                          {copiedField === `method-${index}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg p-3 border border-blue-200 text-center text-gray-500 text-sm">
                    載入銀行轉帳資料中...
                  </div>
                )}
              </div>
              <p className="text-xs text-blue-700 mt-3">
                請轉帳後上傳收據以便核對
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">上傳轉帳收據</h3>
            <ImageUploader
              value={receiptUrl}
              folder="images"
              onChange={(url) => setReceiptUrl(url)}
              onError={(message) => toast.error(message)}
              disabled={!selectedPlanId}
            />
            <p className="text-xs text-gray-500 mt-2">
              {selectedPlanId
                ? '請確認已完成轉帳，並上傳清晰的收據圖片（支援 JPG、PNG、GIF），方便客服快速審核。'
                : '請先選擇點數方案再上傳收據。'}
            </p>
          </div>

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
              disabled={isProcessing || !selectedPlan || !firebaseUser || !receiptUrl || !selectedPlan.qrCodeUrl}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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

          {/* Terms */}
          <div className="mt-4 text-xs text-gray-500">
            <p>• 1 港元 = 1 點</p>
            <p>• 點數購買後立即到帳</p>
            <p>• 點數可用於購買所有商品</p>
            <p>• 需上傳轉帳收據以供審核，客服於工作時間內處理</p>
          </div>
        </div>
      </div>
    </div>
  );
}
