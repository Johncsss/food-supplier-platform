'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { ShoppingCart, Trash2, ArrowLeft, Package, Plus, Minus, Coins, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { t } from '@/lib/translate';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PointsPurchaseModal from '@/components/ui/PointsPurchaseModal';
import CheckoutPasswordModal from '@/components/ui/CheckoutPasswordModal';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Category } from '@/shared/types';
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, format, isBefore, startOfDay, getDay } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';
import { fetchHongKongPublicHolidays } from '@/lib/hkPublicHolidays';

export default function Cart() {
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, firebaseUser, loading } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showCheckoutPasswordModal, setShowCheckoutPasswordModal] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number>(user?.memberPoints || 0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [categoryMinimumSpending, setCategoryMinimumSpending] = useState<number | undefined>(undefined);
  const supplierId = useMemo(() => (state.items.length > 0 ? state.items[0].supplier : null), [state.items]);
  const [deliverySettings, setDeliverySettings] = useState<{
    offDates: Set<string>;
    weeklyOffDays: Set<number>;
    autoPublicHolidays: boolean;
    holidayOverrides: Set<string>;
  } | null>(null);
  const [deliverySettingsLoading, setDeliverySettingsLoading] = useState(false);
  const [deliverySettingsError, setDeliverySettingsError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null);
  const [holidaySets, setHolidaySets] = useState<Record<number, Set<string>>>({});
  const [loadingHolidayYear, setLoadingHolidayYear] = useState<number | null>(null);
  const [deliverySettingsMessage, setDeliverySettingsMessage] = useState<string | null>(null);
  const [agreePurchaseAgreement, setAgreePurchaseAgreement] = useState(false);

  // Update currentPoints when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setCurrentPoints(user.memberPoints);
    }
  }, [user?.memberPoints]);

  useEffect(() => {
    setCalendarMonth(startOfMonth(new Date()));
    setSelectedDeliveryDate(null);
    setDeliverySettings(null);
    setDeliverySettingsError(null);
    setDeliverySettingsMessage(null);
    setHolidaySets({});
  }, [supplierId]);

  // Fetch category minimum spending when cart has items
  useEffect(() => {
    const fetchCategoryMinimumSpending = async () => {
      if (state.items.length === 0) {
        setCategoryMinimumSpending(undefined);
        return;
      }

      const cartCategory = state.items[0].category;
      if (!cartCategory) {
        setCategoryMinimumSpending(undefined);
        return;
      }

      try {
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, where('name', '==', cartCategory));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const categoryData = snapshot.docs[0].data() as Category;
          setCategoryMinimumSpending(categoryData.minimumSpending || undefined);
        } else {
          setCategoryMinimumSpending(undefined);
        }
      } catch (error) {
        console.error('Error fetching category minimum spending:', error);
        setCategoryMinimumSpending(undefined);
      }
    };

    fetchCategoryMinimumSpending();
  }, [state.items]);

  useEffect(() => {
    if (!supplierId) {
      setDeliverySettings(null);
      setDeliverySettingsLoading(false);
      setDeliverySettingsMessage('請先選擇商品');
      return;
    }

    let active = true;
    setDeliverySettingsLoading(true);
    setDeliverySettingsError(null);
    setDeliverySettingsMessage(null);

    (async () => {
      try {
        const response = await fetch(
          `/api/supplier/delivery-settings?supplierId=${encodeURIComponent(supplierId)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );
        if (!active) return;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '無法載入供應商送貨日設定');
        }

        const data = await response.json();
        const offDates = new Set<string>(Array.isArray(data?.offDates) ? data.offDates : []);
        const weeklyOffDays = new Set<number>(Array.isArray(data?.weeklyOffDays) ? data.weeklyOffDays : []);
        const autoPublicHolidays = Boolean(data?.autoPublicHolidays);
        const holidayOverrides = new Set<string>(Array.isArray(data?.holidayOverrides) ? data.holidayOverrides : []);

          setDeliverySettings({
          offDates,
          weeklyOffDays,
          autoPublicHolidays,
          holidayOverrides,
          });

        if (offDates.size === 0 && weeklyOffDays.size === 0 && !autoPublicHolidays) {
          setDeliverySettingsMessage('供應商尚未設定特定休息日，以下日期皆可選擇。');
        }
      } catch (error) {
        console.error('Failed to load supplier delivery settings', error);
        if (!active) return;
        setDeliverySettings({
          offDates: new Set(),
          weeklyOffDays: new Set(),
          autoPublicHolidays: false,
          holidayOverrides: new Set(),
        });
        setDeliverySettingsError('無法載入供應商送貨日設定，已套用預設可配送日。');
      } finally {
        if (active) {
          setDeliverySettingsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [supplierId]);

  // Fetch real points balance from API
  useEffect(() => {
    const fetchBalance = async () => {
      // Always start with user data as fallback
      const fallbackPoints = user?.memberPoints || 0;
      setCurrentPoints(fallbackPoints);
      
      if (!firebaseUser?.uid) {
        setLoadingBalance(false);
        return;
      }
      
      try {
        setLoadingBalance(true);
        const res = await fetch(`/api/purchase-points?userId=${firebaseUser.uid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          if (typeof data.memberPoints === 'number') {
            setCurrentPoints(data.memberPoints);
          } else {
            setCurrentPoints(fallbackPoints);
          }
        } else {
          setCurrentPoints(fallbackPoints);
        }
      } catch (err) {
        console.error('Failed to fetch points balance:', err);
        setCurrentPoints(fallbackPoints);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [firebaseUser, user]);

  const loadHolidayYear = useCallback(
    (year: number) => {
      if (!deliverySettings?.autoPublicHolidays) return;
      if (holidaySets[year] || loadingHolidayYear === year) return;
      setLoadingHolidayYear(year);
      fetchHongKongPublicHolidays(year)
        .then((set) => {
          setHolidaySets((prev) => ({
            ...prev,
            [year]: new Set(set),
          }));
        })
        .catch((error) => {
          console.error('Failed to load public holidays', error);
        })
        .finally(() => {
          setLoadingHolidayYear(null);
        });
    },
    [deliverySettings?.autoPublicHolidays, holidaySets, loadingHolidayYear]
  );

  useEffect(() => {
    if (!deliverySettings?.autoPublicHolidays) return;
    loadHolidayYear(calendarMonth.getFullYear());
  }, [calendarMonth, deliverySettings?.autoPublicHolidays, loadHolidayYear]);

  useEffect(() => {
    if (!deliverySettings?.autoPublicHolidays || !selectedDeliveryDate) return;
    loadHolidayYear(new Date(selectedDeliveryDate).getFullYear());
  }, [deliverySettings?.autoPublicHolidays, loadHolidayYear, selectedDeliveryDate]);

  // Cleanup effect to reset loading state if component unmounts during checkout
  useEffect(() => {
    return () => {
      if (isCheckingOut) {
        setIsCheckingOut(false);
      }
    };
  }, [isCheckingOut]);

  const isDateSelectable = useCallback(
    (date: Date) => {
      if (!deliverySettings) return false;
      const todayStart = startOfDay(new Date());
      if (isBefore(date, todayStart)) return false;
      const key = format(date, 'yyyy-MM-dd');
      if (deliverySettings.offDates.has(key)) return false;
      if (deliverySettings.weeklyOffDays.has(getDay(date))) return false;
      if (deliverySettings.autoPublicHolidays) {
        const holidaySet = holidaySets[date.getFullYear()];
        if (!holidaySet) return false;
        if (holidaySet.has(key) && !deliverySettings.holidayOverrides.has(key)) return false;
      }
      return true;
    },
    [deliverySettings, holidaySets]
  );

  useEffect(() => {
    if (!deliverySettings) return;
    const todayStart = startOfDay(new Date());
    const currentSelectionValid =
      selectedDeliveryDate && isDateSelectable(new Date(selectedDeliveryDate));
    if (currentSelectionValid) return;

    const maxDays = 180;
    for (let i = 0; i < maxDays; i++) {
      const candidate = addDays(todayStart, i);
      const year = candidate.getFullYear();
      if (deliverySettings.autoPublicHolidays && !holidaySets[year]) {
        loadHolidayYear(year);
        continue;
      }
      if (isDateSelectable(candidate)) {
        const formatted = format(candidate, 'yyyy-MM-dd');
        setSelectedDeliveryDate((prev) => (prev === formatted ? prev : formatted));
        setCalendarMonth((prev) => {
          const candidateMonth = startOfMonth(candidate);
          return prev.getFullYear() === candidateMonth.getFullYear() &&
            prev.getMonth() === candidateMonth.getMonth()
            ? prev
            : candidateMonth;
        });
        return;
      }
    }
  }, [deliverySettings, holidaySets, isDateSelectable, loadHolidayYear, selectedDeliveryDate]);

  const daysMatrix = useMemo(() => {
    const startDate = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 });
    const rows: Date[][] = [];
    let row: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      row.push(day);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
      day = addDays(day, 1);
    }
    if (row.length > 0) rows.push(row);
    return rows;
  }, [calendarMonth]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDeliveryDate) return null;
    return format(new Date(selectedDeliveryDate), 'yyyy年MM月dd日 (EEE)', { locale: zhTW });
  }, [selectedDeliveryDate]);

  const hasAvailableDates = useMemo(() => {
    if (!deliverySettings) return false;
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    let day = start;
    while (day <= end) {
      const year = day.getFullYear();
      if (deliverySettings.autoPublicHolidays && !holidaySets[year]) {
        day = addDays(day, 1);
        continue;
      }
      if (isDateSelectable(day)) {
        return true;
      }
      day = addDays(day, 1);
    }
    return false;
  }, [calendarMonth, deliverySettings, holidaySets, isDateSelectable]);

  const todayStart = startOfDay(new Date());

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

    if (state.items.length === 0) {
      toast.error('購物車是空的');
      return;
    }

    if (!agreePurchaseAgreement) {
      toast.error('請先勾選同意買賣協議');
      return;
    }

    if (!deliverySettings) {
      toast.error('正在載入供應商送貨日設定，請稍後再試');
      return;
    }

    if (!selectedDeliveryDate) {
      toast.error('請先選擇送貨日期');
      return;
    }

    if (!isDateSelectable(new Date(selectedDeliveryDate))) {
      toast.error('目前無法配送該日期，請選擇其他日期');
      return;
    }

    // Check minimum spending requirement for the category
    if (categoryMinimumSpending && categoryMinimumSpending > 0 && state.totalAmount < categoryMinimumSpending) {
      const shortfall = categoryMinimumSpending - state.totalAmount;
      toast.error(`未達到最低消費！此類別的最低消費為 HKD$ ${categoryMinimumSpending}，您目前的購物車總額為 HKD$ ${state.totalAmount}。還需要添加 HKD$ ${shortfall} 的商品才能結帳。`);
      return;
    }

    // Test API connectivity first
    try {
      const testResponse = await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.status}`);
      }
    } catch (error) {
      console.error('API connectivity test failed:', error);
      toast.error('無法連接到伺服器，請檢查網路連接後重試。');
      return;
    }

    // Check if user has enough points
    const requiredPoints = state.totalAmount;
    const userPoints = currentPoints;

    if (userPoints < requiredPoints) {
      const shortfall = requiredPoints - userPoints;
      toast.error(`點數不足！需要 ${requiredPoints} 點，您只有 ${userPoints} 點。還需要購買 ${shortfall} 點才能完成結帳。`);
      setShowPointsModal(true);
      return;
    }

    // Check if user has set up checkout password
    if (!user?.checkoutPassword) {
      toast.error('請先到個人資料頁面設定結帳密碼');
      window.location.href = '/dashboard/profile';
      return;
    }

    // Show checkout password modal
    setShowCheckoutPasswordModal(true);
  };

  // Safely parse JSON from a fetch Response
  const parseResponseSafely = async (response: Response): Promise<any> => {
    if (response.status === 204) return {};
    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') return {};

    try {
      const text = await response.text();
      if (!text) return {};
      if (!contentType.includes('application/json')) {
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }
      return JSON.parse(text);
    } catch (e) {
      return {};
    }
  };

  const handlePasswordVerified = async () => {
    setShowCheckoutPasswordModal(false);
    setIsCheckingOut(true);

    // Set an overall timeout for the entire checkout process
    const overallTimeout = setTimeout(() => {
      console.error('Checkout process timed out after 60 seconds');
      setIsCheckingOut(false);
      toast.error('結帳處理時間過長，請稍後再試或檢查網路連接。');
    }, 60000); // 60 second overall timeout

    const authUser = user || {
      id: firebaseUser!.uid,
      firebaseUid: firebaseUser!.uid,
      email: firebaseUser!.email || '',
      name: firebaseUser!.displayName || '',
      restaurantName: firebaseUser!.displayName || 'Web User',
      phone: '',
      address: { 
        street: '', 
        city: '', 
        state: '', 
        zipCode: '' 
      },
      membershipStatus: 'inactive' as const,
      membershipExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Proceeding with checkout...');

    if (!deliverySettings) {
      clearTimeout(overallTimeout);
      toast.error('送貨日期設定尚未載入，請稍後再試');
      setIsCheckingOut(false);
      return;
    }

    if (!selectedDeliveryDate || !isDateSelectable(new Date(selectedDeliveryDate))) {
      clearTimeout(overallTimeout);
      toast.error('請重新選擇有效的送貨日期');
      setIsCheckingOut(false);
      return;
    }

    const deliveryDateISO = `${selectedDeliveryDate}T00:00:00+08:00`;

    // Retry logic for server restarts
    let retries = 2;
    let lastError: Error | null = null;
    const requiredPoints = state.totalAmount;

    while (retries > 0) {
      try {
        console.log(`Starting checkout attempt ${3 - retries}/2`);
        
        // First, deduct points
        console.log('Deducting points first...');
        const deductUrl = '/api/deduct-points';
        
        console.log('Deducting points data:', {
          userId: firebaseUser!.uid,
          amount: requiredPoints,
          description: `結帳購買商品，總金額 ${requiredPoints} 點`
        });
        
        // Add timeout for deduct points API call
        const deductController = new AbortController();
        const deductTimeout = setTimeout(() => deductController.abort(), 20000); // 20 second timeout
        
        const deductResponse = await fetch(deductUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: firebaseUser!.uid,
            amount: requiredPoints,
            description: `結帳購買商品，總金額 ${requiredPoints} 點`
          }),
          signal: deductController.signal,
        });
        
        clearTimeout(deductTimeout);

        console.log('Deduct points response status:', deductResponse.status);

        const deductResult = await parseResponseSafely(deductResponse);

        if (!deductResponse.ok) {
          const errorMsg = deductResult.error || deductResult.message || '點數扣除失敗';
          console.error('Points deduction failed:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Points deducted successfully:', deductResult);

        // Create order items from cart items
        const orderItems = state.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          imageUrl: item.imageUrl || '',
          supplier: item.supplier || '',
          unit: item.unit || ''
        }));

        const orderData = {
          items: orderItems,
          totalAmount: state.totalAmount,
          pointsUsed: requiredPoints,
          pointsTransactionId: deductResult.transactionId,
          user: authUser,
          deliveryDate: deliveryDateISO,
        };

        // Send order to API
        console.log('Attempting to create order with data:', JSON.stringify(orderData, null, 2));
        const apiUrl = '/api/create-order';
        console.log('API URL:', apiUrl);
        console.log('Making fetch request...');
        
        // Add timeout for order creation API call
        const orderController = new AbortController();
        const orderTimeout = setTimeout(() => orderController.abort(), 20000); // 20 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
          signal: orderController.signal,
        });
        
        clearTimeout(orderTimeout);
        
        console.log('Fetch request completed successfully');
        console.log('Response status:', response.status);

        // If response is not ok, try to parse error details
        if (!response.ok) {
          console.log('Response not ok. Status:', response.status, response.statusText);
          let errorMessage = 'Failed to create order';
          let errorDetails = '';
          
          try {
            const errorData = await parseResponseSafely(response);
            console.log('Error data:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorDetails = errorData.details || '';
          } catch (parseError) {
            console.log('Failed to parse error response:', parseError);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          
          console.error('Order creation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorDetails,
          });
          
          // If it's a 404 or 500, it might be a server restart, so retry
          if (response.status === 404 || response.status === 500) {
            console.log(`Attempt ${3 - retries}/2: Server might be restarting, retrying...`);
            retries--;
            if (retries > 0) {
              toast.loading(`訂單創建失敗，正在重試... (${3 - retries}/2)`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
              continue;
            }
          }
          
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }

        const data = await parseResponseSafely(response);

        if (data.success) {
          clearTimeout(overallTimeout); // Clear the overall timeout
          setIsCheckingOut(false); // Reset loading state
          // Update points balance after successful checkout
          setCurrentPoints(deductResult.newBalance);
          const deliveryDateDisplay = format(new Date(deliveryDateISO), 'yyyy年MM月dd日 (EEE)', { locale: zhTW });
          
          clearCart();
          
          // Redirect to thank you page with order information
          const thankYouUrl = new URL('/checkout/thank-you', window.location.origin);
          thankYouUrl.searchParams.set('orderId', data.orderId || 'N/A');
          thankYouUrl.searchParams.set('deliveryDate', deliveryDateDisplay);
          thankYouUrl.searchParams.set('pointsUsed', requiredPoints.toString());
          thankYouUrl.searchParams.set('remainingPoints', deductResult.newBalance.toString());
          
          // Use window.location.replace to ensure navigation happens
          // Small delay to ensure cart is cleared and state is updated
          setTimeout(() => {
            window.location.replace(thankYouUrl.toString());
          }, 200);
          return; // Success, exit the retry loop
        } else {
          throw new Error(data.message || 'Order creation failed');
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${3 - retries}/2 failed:`, error);
        
        // Handle specific error types
        let errorMessage = 'Unknown error';
        let shouldRetry = true;
        
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.message === 'Request timeout') {
            errorMessage = '請求超時 - 請檢查網路連接或稍後再試';
            shouldRetry = false; // Don't retry on timeout
          } else if (error.message.includes('Network request failed')) {
            errorMessage = '網路連接失敗 - 請檢查網路設置';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '無法連接到伺服器 - 請檢查網路連接';
          } else if (error.message.includes('TypeError')) {
            errorMessage = '網路錯誤 - 請檢查網路連接';
          } else if (error.message.includes('The operation was aborted')) {
            errorMessage = '操作被取消 - 請檢查網路連接';
            shouldRetry = false; // Don't retry on abort
          } else {
            errorMessage = error.message;
          }
        }
        
        retries--;
        if (retries > 0 && shouldRetry) {
          toast.loading(`訂單創建失敗，正在重試... (${3 - retries}/2)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        } else if (!shouldRetry) {
          // Don't retry for timeout errors
          break;
        }
      }
    }

    // All retries failed
    clearTimeout(overallTimeout); // Clear the overall timeout
    console.error('All retry attempts failed:', lastError);
    
    // Provide specific error message based on the last error
    let finalErrorMessage = '請稍後再試';
    if (lastError instanceof Error) {
      if (lastError.name === 'AbortError' || lastError.message === 'Request timeout') {
        finalErrorMessage = '網路連接超時，請檢查網路連接後重試';
      } else if (lastError.message.includes('Network request failed')) {
        finalErrorMessage = '網路連接失敗，請檢查網路設置';
      } else if (lastError.message.includes('Failed to fetch')) {
        finalErrorMessage = '無法連接到伺服器，請檢查網路連接';
      } else {
        finalErrorMessage = lastError.message;
      }
    }
    
    toast.error(finalErrorMessage);
    setIsCheckingOut(false);
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
                          HKD$ {item.unitPrice.toFixed(2)} / {item.unit || '單位'}
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
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary-600" />
                      <span className="text-lg font-semibold text-gray-900">送貨日期</span>
                    </div>
                    {selectedDateLabel && (
                      <span className="text-sm font-medium text-primary-700">{selectedDateLabel}</span>
                    )}
                  </div>
                  {deliverySettingsLoading ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                      載入供應商送貨日...
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))}
                          className="rounded-lg p-2 hover:bg-white"
                          aria-label="上一個月"
                        >
                          <ChevronLeft className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900">
                          {format(calendarMonth, 'yyyy年 MMMM', { locale: zhTW })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                          className="rounded-lg p-2 hover:bg-white"
                          aria-label="下一個月"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="mb-2 grid grid-cols-7 gap-2 text-xs text-gray-500">
                        {['一', '二', '三', '四', '五', '六', '日'].map((label) => (
                          <div key={label} className="text-center">
                            {label}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {daysMatrix.flat().map((day, idx) => {
                          const inMonth = isSameMonth(day, calendarMonth);
                          const key = format(day, 'yyyy-MM-dd');
                          const isPast = isBefore(day, todayStart);
                          const holidaySet = holidaySets[day.getFullYear()];
                          const baseHoliday = Boolean(deliverySettings?.autoPublicHolidays && holidaySet?.has(key));
                          const holidayBlocked =
                            baseHoliday && !deliverySettings?.holidayOverrides.has(key);
                          const selectable = inMonth && isDateSelectable(day);
                          const isSelected = selectedDeliveryDate === key;
                          const disabled =
                            !deliverySettings ||
                            !inMonth ||
                            isPast ||
                            !selectable ||
                            (deliverySettings.autoPublicHolidays && !holidaySet && inMonth);

                          let classes =
                            'relative h-10 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500';

                          if (!inMonth) {
                            classes += ' bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed';
                          } else if (isSelected) {
                            classes += ' bg-primary-600 border-primary-600 text-white hover:bg-primary-700';
                          } else if (disabled) {
                            classes += ' bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed';
                          } else {
                            classes += ' bg-white border-gray-200 text-gray-700 hover:bg-primary-50';
                          }

                          return (
                            <button
                              key={`${key}-${idx}`}
                              type="button"
                              className={classes}
                              onClick={() => setSelectedDeliveryDate(key)}
                              disabled={disabled}
                            >
                              <span className="block text-center leading-9 font-medium">
                                {holidayBlocked ? '' : format(day, 'd')}
                              </span>
                              {holidayBlocked && (
                                <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-red-500">
                                  假
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {deliverySettings?.autoPublicHolidays && loadingHolidayYear === calendarMonth.getFullYear() && (
                        <p className="mt-3 text-xs text-gray-500">正在載入本年度公眾假期...</p>
                      )}
                      {deliverySettings?.autoPublicHolidays && (
                        <p className="mt-2 text-xs text-gray-500">
                          標記「假」代表公眾假期，無法安排送貨。
                        </p>
                      )}
                      {!deliverySettingsLoading &&
                        deliverySettings &&
                        hasAvailableDates === false &&
                        (!deliverySettings.autoPublicHolidays ||
                          Boolean(holidaySets[calendarMonth.getFullYear()])) && (
                          <p className="mt-3 text-xs text-red-600">
                            此月份目前沒有可配送日期，請切換至其他月份或聯絡供應商。
                          </p>
                        )}
                    </div>
                  )}
                  {deliverySettingsError && (
                    <p className="mt-2 text-xs text-red-600">{deliverySettingsError}</p>
                  )}
                  {deliverySettingsMessage && (
                    <p className="mt-2 text-xs text-gray-500">{deliverySettingsMessage}</p>
                  )}
                  {selectedDateLabel && (
                    <p className="mt-3 text-sm text-gray-700">
                      已選擇送貨日期：{' '}
                      <span className="font-semibold text-primary-700">{selectedDateLabel}</span>
                    </p>
                  )}
                </div>
                
                                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">運費</span>
                      <span className="font-medium text-green-600">免費</span>
                    </div>
                    
                    {/* Points Balance Display */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">會員點數餘額</span>
                        <span className="font-bold text-blue-900">{loadingBalance ? '...' : currentPoints} 點</span>
                      </div>
                      {currentPoints < state.totalAmount && (
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

                    {/* Minimum Spending Display */}
                    {categoryMinimumSpending && categoryMinimumSpending > 0 && (
                      <div className={`p-4 rounded-lg mb-4 border ${
                        state.totalAmount < categoryMinimumSpending 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className={`text-sm font-semibold mb-2 ${
                          state.totalAmount < categoryMinimumSpending 
                            ? 'text-red-800' 
                            : 'text-yellow-800'
                        }`}>
                          最低消費: HKD$ {categoryMinimumSpending}
                        </div>
                        {state.totalAmount < categoryMinimumSpending && (
                          <div className="text-sm font-semibold text-red-600">
                            還需 HKD$ {categoryMinimumSpending - state.totalAmount}
                          </div>
                        )}
                      </div>
                    )}
                    
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

                  <div className="mt-4 flex items-start space-x-2">
                    <input
                      id="agreePurchaseAgreement"
                      type="checkbox"
                      checked={agreePurchaseAgreement}
                      onChange={(e) => setAgreePurchaseAgreement(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="agreePurchaseAgreement" className="text-sm text-gray-700">
                      我已閱讀並同意{' '}
                      <a
                        href="/legal/purchase-sale-agreement"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        買賣協議 Purchase and Sale Agreement
                      </a>
                      。
                    </label>
                  </div>

                  </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || loading || !firebaseUser || !user || !agreePurchaseAgreement}
                  className="w-full text-white py-3 px-6 rounded-lg font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:opacity-90"
                  style={{ backgroundColor: '#0B8628' }}
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
        onPointsPurchased={(newBalance) => {
          if (typeof newBalance === 'number') {
            setCurrentPoints(newBalance);
            console.log('Points updated from purchase:', newBalance);
          } else if (firebaseUser?.uid) {
            // Fallback: refetch balance
            const fetchBalance = async () => {
              try {
                const res = await fetch(`/api/purchase-points?userId=${firebaseUser.uid}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                const data = await res.json();
                if (res.ok && typeof data.memberPoints === 'number') {
                  setCurrentPoints(data.memberPoints);
                  console.log('Points refetched after purchase:', data.memberPoints);
                } else {
                  console.log('Failed to refetch points, using user data');
                  setCurrentPoints(user?.memberPoints || 0);
                }
              } catch (err) {
                console.error('Failed to refetch points balance', err);
                setCurrentPoints(user?.memberPoints || 0);
              }
            };
            fetchBalance();
          }
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