import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_CONFIG, buildApiUrl, testApiConnectivity } from '../config/api';
import { getBestApiEndpoint } from '../utils/apiHelper';
import PointsPurchaseModal from '../components/PointsPurchaseModal';
import CheckoutPasswordModal from '../components/CheckoutPasswordModal';
import { db } from '../../../shared/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Category } from '../../../shared/types';
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, format, isBefore, startOfDay, getDay } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';
import { markSuppressHomePopupOnce } from '../utils/popupBannerSession';

const CartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { items, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, firebaseUser, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showCheckoutPasswordModal, setShowCheckoutPasswordModal] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number>(user?.memberPoints || 0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [categoryMinimumSpending, setCategoryMinimumSpending] = useState<number | undefined>(undefined);
  const supplierId = useMemo(() => (items.length > 0 ? items[0].supplier : null), [items]);
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
  const [deliveryTimes, setDeliveryTimes] = useState<string[]>([]);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState<string | null>(null);
  const [holidaySets, setHolidaySets] = useState<Record<number, Set<string>>>({});
  const [loadingHolidayYear, setLoadingHolidayYear] = useState<number | null>(null);
  const [deliverySettingsMessage, setDeliverySettingsMessage] = useState<string | null>(null);
  const [agreePurchaseAgreement, setAgreePurchaseAgreement] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [cartBannerImage, setCartBannerImage] = useState<string | null>(null);

  useEffect(() => {
    setQuantityInputs(
      items.reduce((acc, cartItem) => {
        acc[cartItem.productId] = cartItem.quantity.toString();
        return acc;
      }, {} as Record<string, string>),
    );
  }, [items]);

  // Check authentication every time screen is focused - show alert and redirect to login if not authenticated
  useFocusEffect(
    React.useCallback(() => {
      if (!loading && !firebaseUser) {
        // Show alert immediately when screen is focused
        Alert.alert(
          '需要登入',
          '此功能需要登入後才能使用，是否前往登入？',
          [
            { 
              text: '取消', 
              style: 'cancel', 
              onPress: () => (navigation as any).navigate('Home') 
            },
            {
              text: '前往登入',
              onPress: () => (navigation as any).navigate('Login'),
            },
          ]
        );
        // Navigate back to home immediately
        (navigation as any).navigate('Home');
      }

      // When leaving Cart (e.g. tapping Home tab), suppress the Home popup banner once.
      return () => {
        markSuppressHomePopupOnce();
      };
    }, [firebaseUser, loading, navigation])
  );

  // Update currentPoints when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setCurrentPoints(user.memberPoints);
    }
  }, [user?.memberPoints]);

  // Fetch category minimum spending when cart has items
  useEffect(() => {
    const fetchCategoryMinimumSpending = async () => {
      if (items.length === 0) {
        setCategoryMinimumSpending(undefined);
        return;
      }

      const cartCategory = items[0].category;
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
  }, [items]);

  // (Removed duplicate points balance effect here – unified into fetchPointsBalance below)

  // Reset delivery-related state when supplier changes
  useEffect(() => {
    setCalendarMonth(startOfMonth(new Date()));
    setSelectedDeliveryDate(null);
    setDeliveryTimes([]);
    setSelectedDeliveryTime(null);
    setDeliverySettings(null);
    setDeliverySettingsError(null);
    setDeliverySettingsMessage(null);
    setHolidaySets({});
  }, [supplierId]);

  // Fetch HK public holidays (from Firestore with fallback), cache per year
  const getFallbackHongKongPublicHolidays = (year: number): string[] => {
    const fallback: Record<number, string[]> = {
      2024: ['2024-01-01','2024-02-10','2024-02-11','2024-02-12','2024-02-13','2024-03-29','2024-03-30','2024-04-01','2024-04-04','2024-05-01','2024-05-15','2024-06-10','2024-07-01','2024-09-18','2024-10-01','2024-10-11','2024-12-25','2024-12-26'],
      2025: ['2025-01-01','2025-01-28','2025-01-29','2025-01-30','2025-01-31','2025-03-29','2025-03-31','2025-04-04','2025-04-18','2025-05-01','2025-05-06','2025-06-02','2025-07-01','2025-09-08','2025-10-01','2025-10-07','2025-12-25','2025-12-26'],
      2026: ['2026-01-01','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-04-03','2026-04-04','2026-04-06','2026-04-10','2026-05-01','2026-05-20','2026-06-19','2026-07-01','2026-09-25','2026-10-01','2026-10-30','2026-12-25','2026-12-26']
    };
    return fallback[year] || [];
  };

  const loadHolidayYear = useCallback(async (year: number) => {
    if (!deliverySettings?.autoPublicHolidays) return;
    if (holidaySets[year] || loadingHolidayYear === year) return;
    try {
      setLoadingHolidayYear(year);
      const ref = doc(db, 'publicHolidays', year.toString());
      const snap = await getDoc(ref);
      let dates: string[] = [];
      if (snap.exists()) {
        const data = snap.data() as any;
        if (Array.isArray(data?.dates)) dates = data.dates;
      }
      if (dates.length === 0) dates = getFallbackHongKongPublicHolidays(year);
      setHolidaySets(prev => ({ ...prev, [year]: new Set(dates) }));
    } catch (e) {
      setHolidaySets(prev => ({ ...prev, [year]: new Set(getFallbackHongKongPublicHolidays(year)) }));
    } finally {
      setLoadingHolidayYear(null);
    }
  }, [deliverySettings?.autoPublicHolidays]);

  // Fetch supplier delivery settings
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutMs = API_CONFIG.TIMEOUT || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchSettings = async () => {
      if (!supplierId) {
        setDeliverySettings(null);
        setDeliverySettingsLoading(false);
        setDeliverySettingsMessage('請先選擇商品');
        return;
      }
      setDeliverySettingsLoading(true);
      setDeliverySettingsError(null);
      setDeliverySettingsMessage(null);
      try {
        const baseEndpoint = await getBestApiEndpoint();
        const res = await fetch(`${baseEndpoint}/api/supplier/delivery-settings?supplierId=${encodeURIComponent(supplierId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        if (!active) return;
        if (!res.ok) throw new Error('無法載入供應商送貨日設定');
        const data = await res.json();
        const offDates = new Set<string>(Array.isArray(data?.offDates) ? data.offDates : []);
        const weeklyOffDays = new Set<number>(Array.isArray(data?.weeklyOffDays) ? data.weeklyOffDays : []);
        const autoPublicHolidays = Boolean(data?.autoPublicHolidays);
        const holidayOverrides = new Set<string>(Array.isArray(data?.holidayOverrides) ? data.holidayOverrides : []);
        const times: string[] = Array.isArray(data?.deliveryTimes) 
          ? data.deliveryTimes.filter((time: any) => typeof time === 'string' && time.trim() !== '')
          : (typeof data?.deliveryTime === 'string' && data.deliveryTime ? [data.deliveryTime] : []);
        setDeliverySettings({ offDates, weeklyOffDays, autoPublicHolidays, holidayOverrides });
        setDeliveryTimes(times);
        if (times.length > 0) {
          setSelectedDeliveryTime(times[0]);
        } else {
          setSelectedDeliveryTime(null);
        }
        if (offDates.size === 0 && weeklyOffDays.size === 0 && !autoPublicHolidays) {
          setDeliverySettingsMessage('供應商尚未設定特定休息日，以下日期皆可選擇。');
        }
      } catch (e) {
        if (!active) return;
        setDeliverySettings({
          offDates: new Set(),
          weeklyOffDays: new Set(),
          autoPublicHolidays: false,
          holidayOverrides: new Set(),
        });
        setDeliverySettingsError('無法載入供應商送貨日設定，已套用預設可配送日。');
      } finally {
        clearTimeout(timeoutId);
        if (active) setDeliverySettingsLoading(false);
      }
    };
    fetchSettings();
    return () => { 
      active = false; 
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [supplierId]);

  useEffect(() => {
    if (!deliverySettings?.autoPublicHolidays) return;
    loadHolidayYear(calendarMonth.getFullYear());
  }, [calendarMonth, deliverySettings?.autoPublicHolidays]);

  useEffect(() => {
    if (!deliverySettings?.autoPublicHolidays || !selectedDeliveryDate) return;
    loadHolidayYear(new Date(selectedDeliveryDate).getFullYear());
  }, [deliverySettings?.autoPublicHolidays, selectedDeliveryDate]);

  const isDateSelectable = useCallback((date: Date) => {
    if (!deliverySettings) return false;
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return false;
    const key = format(date, 'yyyy-MM-dd');
    if (deliverySettings.offDates.has(key)) return false;
    if (deliverySettings.weeklyOffDays.has(getDay(date))) return false;
    if (deliverySettings.autoPublicHolidays) {
      const holidaySet = holidaySets[date.getFullYear()];
      if (!holidaySet) return false;
      if (holidaySet.has(key) && !deliverySettings.holidayOverrides.has(key)) return false;
    }
    return true;
  }, [deliverySettings, holidaySets]);

  // Auto-pick the first available date
  useEffect(() => {
    if (!deliverySettings) return;
    const today = startOfDay(new Date());
    const currentSelectionValid = selectedDeliveryDate && isDateSelectable(new Date(selectedDeliveryDate));
    if (currentSelectionValid) return;
    const maxDays = 180;
    for (let i = 0; i < maxDays; i++) {
      const candidate = addDays(today, i);
      const year = candidate.getFullYear();
      if (deliverySettings.autoPublicHolidays && !holidaySets[year]) {
        loadHolidayYear(year);
        continue;
      }
      if (isDateSelectable(candidate)) {
        const formatted = format(candidate, 'yyyy-MM-dd');
        setSelectedDeliveryDate(prev => (prev === formatted ? prev : formatted));
        setCalendarMonth(prev => {
          const candidateMonth = startOfMonth(candidate);
          return prev.getFullYear() === candidateMonth.getFullYear() && prev.getMonth() === candidateMonth.getMonth()
            ? prev
            : candidateMonth;
        });
        return;
      }
    }
  }, [deliverySettings, holidaySets, isDateSelectable, selectedDeliveryDate]);

  // Build calendar matrix for current month (rows of 7 days)
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

  // Safely parse JSON from a fetch Response. Avoids crashes on empty/non-JSON bodies
  const parseResponseSafely = async (response: Response): Promise<any> => {
    // 204 No Content or Content-Length: 0
    if (response.status === 204) return {};

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') return {};

    try {
      // Prefer text first to detect empty bodies
      const text = await response.text();
      if (!text) return {};
      if (!contentType.includes('application/json')) {
        // Attempt JSON parse; if it fails, return raw text for diagnostics
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }
      return JSON.parse(text);
    } catch (e) {
      // Fall back to empty object if parsing fails
      return {};
    }
  };

  // Cleanup effect to reset loading state if component unmounts during checkout
  useEffect(() => {
    return () => {
      if (isProcessing) {
        console.log('Component unmounting during checkout, resetting processing state');
        setIsProcessing(false);
      }
    };
  }, [isProcessing]);

  const handleQuantityInputChange = (productId: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantityInputs(prev => ({ ...prev, [productId]: value }));
    }
  };

  const commitQuantityInput = (productId: string) => {
    const rawValue = quantityInputs[productId];
    const parsedQuantity = parseInt(rawValue, 10);

    if (!isNaN(parsedQuantity)) {
      if (parsedQuantity > 0) {
        updateQuantity(productId, parsedQuantity);
        return;
      }
      if (parsedQuantity === 0) {
        updateQuantity(productId, 0);
        return;
      }
    }

    const fallback =
      items.find(cartItem => cartItem.productId === productId)?.quantity.toString() || '1';
    setQuantityInputs(prev => ({ ...prev, [productId]: fallback }));
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      '移除商品',
      '確定要從購物車中移除這個商品嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: () => removeFromCart(productId) }
      ]
    );
  };

  const handlePasswordIncorrect = () => {
    Alert.alert('密碼錯誤', '請重新輸入正確的結帳密碼');
  };

  const fetchPointsBalance = async () => {
    const fallbackPoints = user?.memberPoints || 0;
    setCurrentPoints(fallbackPoints);

    if (!firebaseUser?.uid) {
      setLoadingBalance(false);
      return;
    }

    const controller = new AbortController();
    const timeoutMs = API_CONFIG.TIMEOUT || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      setLoadingBalance(true);
      const baseEndpoint = await getBestApiEndpoint();
      console.log(
        'Fetching points balance from:',
        `${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`,
      );

      const res = await fetch(
        `${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        },
      );

      console.log('Points balance response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Points balance response data:', data);

        if (typeof data.memberPoints === 'number') {
          setCurrentPoints(data.memberPoints);
          console.log('Successfully updated points balance:', data.memberPoints);
        } else {
          console.log('Invalid memberPoints data, using fallback:', data);
          setCurrentPoints(fallbackPoints);
        }
      } else {
        console.log('API request failed, using fallback points');
        setCurrentPoints(fallbackPoints);
      }
    } catch (err) {
      // Same behaviour as the auto-balance fetch above: log as a warning and use fallback.
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Points balance request timed out, using fallback points');
      } else {
        console.warn('Failed to fetch points balance, using fallback points:', err);
      }
      setCurrentPoints(fallbackPoints);
    } finally {
      clearTimeout(timeoutId);
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchPointsBalance();
  }, [firebaseUser, user]);

  // Fetch cart banner from mobile-app content
  useEffect(() => {
    const fetchCartBanner = async () => {
      try {
        const pageDoc = await getDoc(doc(db, 'pages', 'mobile-app'));
        if (pageDoc.exists()) {
          const data = pageDoc.data();
          const areasData = data.areas || null;
          if (areasData?.cartBanner?.image) {
            setCartBannerImage(areasData.cartBanner.image);
          } else {
            setCartBannerImage(null);
          }
        }
      } catch (error) {
        console.error('Error fetching cart banner:', error);
        setCartBannerImage(null);
      }
    };
    fetchCartBanner();
  }, []);

  // Show loading or redirect if not authenticated (AFTER all hooks)
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!firebaseUser) {
    // This should not be reached due to navigation redirect, but show empty screen as fallback
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            請先登入以查看購物車
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleClearCart = () => {
    Alert.alert(
      '清空購物車',
      '確定要清空購物車嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: clearCart }
      ]
    );
  };

  const handleCheckout = async () => {
    if (loading) {
      Alert.alert('載入中', '正在取得帳戶資料，請稍候...');
      return;
    }

    if (!firebaseUser) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    if (items.length === 0) {
      Alert.alert('購物車為空', '請先添加商品到購物車');
      return;
    }

    if (!agreePurchaseAgreement) {
      Alert.alert('需要同意', '請先勾選「我已閱讀並同意 買賣協議」');
      return;
    }

    if (!deliverySettings) {
      Alert.alert('載入中', '正在載入送貨日期設定，請稍後再試');
      return;
    }

    if (!selectedDeliveryDate) {
      Alert.alert('需要選擇', '請先選擇送貨日期');
      return;
    }

    if (!isDateSelectable(new Date(selectedDeliveryDate))) {
      Alert.alert('不可配送', '目前無法配送該日期，請選擇其他日期');
      return;
    }

    if (deliveryTimes.length > 0 && !selectedDeliveryTime) {
      Alert.alert('需要選擇', '請先選擇送貨時間');
      return;
    }

    // Check minimum spending requirement for the category
    if (categoryMinimumSpending && categoryMinimumSpending > 0 && totalAmount < categoryMinimumSpending) {
      const shortfall = categoryMinimumSpending - totalAmount;
      Alert.alert(
        '未達到最低消費',
        `此類別的最低消費為 HKD$ ${categoryMinimumSpending}，您目前的購物車總額為 HKD$ ${totalAmount}。\n還需要添加 HKD$ ${shortfall} 的商品才能結帳。`,
        [{ text: '確定', style: 'cancel' }]
      );
      return;
    }

    // Test API connectivity first using a stable endpoint
    try {
      const baseEndpoint = await getBestApiEndpoint();
      console.log('Testing API connectivity before checkout:', baseEndpoint);
      
      // Use /api/points-plans instead of /api/test because it is always available
      // and returns JSON even for demo/unauthenticated users.
      const testUrl = `${baseEndpoint}/api/points-plans`;
      console.log('Connectivity test URL:', testUrl);

      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        console.warn('API connectivity test non-OK status:', testResponse.status);
        // For non-200 statuses, we still allow checkout if we got any response at all,
        // because the server is reachable and other endpoints (like purchase-points)
        // may still work. We only treat network errors as fatal.
      } else {
        console.log('API connectivity test passed');
      }
    } catch (error) {
      console.error('API connectivity test failed:', error);
      Alert.alert(
        '網路連接問題',
        '無法連接到伺服器，請檢查網路連接後重試。',
        [{ text: '確定' }]
      );
      return;
    }

    // Check if user has enough points
    const requiredPoints = totalAmount;
    const userPoints = currentPoints;

    if (userPoints < requiredPoints) {
      const shortfall = requiredPoints - userPoints;
      Alert.alert(
        '點數不足',
        `需要 ${requiredPoints} 點，您只有 ${userPoints} 點。\n還需要購買 ${shortfall} 點才能完成結帳。`,
        [
          { text: '確定', style: 'cancel' },
          { text: '購買點數', onPress: () => setShowPointsModal(true) }
        ]
      );
      return;
    }

    // Check if user has set up checkout password
    if (!user?.checkoutPassword) {
      Alert.alert(
        '需要設定結帳密碼',
        '請先到個人資料頁面設定結帳密碼',
        [
          { text: '確定', style: 'default' }
        ]
      );
      return;
    }

    // Show checkout password modal
    setShowCheckoutPasswordModal(true);
  };

  const handlePasswordVerified = async () => {
    setShowCheckoutPasswordModal(false);
    setIsProcessing(true);

    // Set an overall timeout for the entire checkout process
    const overallTimeout = setTimeout(() => {
      console.error('Checkout process timed out after 60 seconds');
      setIsProcessing(false);
      Alert.alert(
        '處理超時',
        '結帳處理時間過長，請稍後再試或檢查網路連接。',
        [{ text: '確定' }]
      );
    }, 60000); // 60 second overall timeout

    const requiredPoints = totalAmount;
    const authUser = user || {
      id: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      restaurantName: firebaseUser.displayName || 'Mobile User',
      phone: '',
      address: { 
        street: '', 
        city: '', 
        state: '', 
        zipCode: '' 
      },
      membershipStatus: 'inactive',
      membershipExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Skip connectivity test to avoid AbortSignal issues
    console.log('Skipping connectivity test, proceeding directly to checkout...');
    
    console.log('Proceeding with checkout...');

    // Retry logic for server restarts - reduced for faster checkout
    let retries = 2; // Increased retries for better reliability
    let lastError = null;

    while (retries > 0) {
      try {
        console.log(`Starting checkout attempt ${3 - retries}/2`);
        
        // First, deduct points
        console.log('Deducting points first...');
        // Resolve best base endpoint at runtime (emulator/device friendly)
        const baseEndpoint = await getBestApiEndpoint();
        const deductUrl = `${baseEndpoint}/api/deduct-points`;
        
        console.log('Deducting points from URL:', deductUrl);
        console.log('Deducting points data:', {
          userId: firebaseUser.uid,
          amount: requiredPoints,
          description: `結帳購買商品，總金額 ${requiredPoints} 點`
        });
        
        // Add timeout for deduct points API call
        const deductController = new AbortController();
        const deductTimeout = setTimeout(() => deductController.abort(), 20000); // Increased to 20 second timeout
        
        const deductResponse = await fetch(deductUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: firebaseUser.uid,
            amount: requiredPoints,
            description: `結帳購買商品，總金額 ${requiredPoints} 點`
          }),
          signal: deductController.signal,
        });
        
        clearTimeout(deductTimeout);

        console.log('Deduct points response status:', deductResponse.status);
        console.log('Deduct points response headers:', Object.fromEntries(deductResponse.headers.entries()));

        const deductResult = await parseResponseSafely(deductResponse);
        console.log('Deduct points result:', deductResult);

        if (!deductResponse.ok) {
          const errorMsg = deductResult.error || deductResult.message || '點數扣除失敗';
          console.error('Points deduction failed:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Points deducted successfully:', deductResult);

        // Create order items from cart items
        const orderItems = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          imageUrl: item.imageUrl || '',
          supplier: item.supplier || '',
          unit: item.unit || undefined
        }));

        const deliveryDateISO = selectedDeliveryDate ? `${selectedDeliveryDate}T00:00:00+08:00` : undefined;

        const orderData: any = {
          items: orderItems,
          totalAmount: totalAmount,
          pointsUsed: requiredPoints,
          pointsTransactionId: deductResult.transactionId,
          user: authUser,
          ...(deliveryDateISO ? { deliveryDate: deliveryDateISO } : {}),
          ...(selectedDeliveryTime ? { deliveryTime: selectedDeliveryTime } : {})
        };

        // Send order to API
        console.log('Attempting to create order with data:', JSON.stringify(orderData, null, 2));
        const apiUrl = `${baseEndpoint}${API_CONFIG.ENDPOINTS.CREATE_ORDER}`;
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
        console.log('Response statusText:', response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

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
            // If we can't parse the error, use the status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          
          // Log detailed error information
          console.error('Order creation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorDetails,
            endpoint: API_CONFIG.BASE_URL,
            retryAttempt: API_CONFIG.MAX_RETRIES + 1 - retries
          });
          
          // If it's a 404 or 500, it might be a server restart, so retry
          if (response.status === 404 || response.status === 500) {
            console.log(`Attempt ${3 - retries}/2: Server might be restarting, retrying...`);
            retries--;
            if (retries > 0) {
              Alert.alert('重試中', `訂單創建失敗，正在重試... (${3 - retries}/2)`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
              continue;
            }
          }
          
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }

        const data = await parseResponseSafely(response);

        if (data.success) {
          clearTimeout(overallTimeout); // Clear the overall timeout
          setIsProcessing(false); // Reset loading state before showing alert
          // Update points balance after successful checkout
          setCurrentPoints(deductResult.newBalance);
          Alert.alert(
            '訂單已建立',
            `您的訂單已成功建立！\n訂單編號: ${data.orderId || 'N/A'}\n使用點數: ${requiredPoints} 點\n剩餘點數: ${deductResult.newBalance} 點\n\n可以在訂單頁面查看詳情。`,
            [
              {
                text: '確定',
                onPress: () => {
                  clearCart();
                  // Navigate to orders screen (you can implement navigation here)
                  console.log('Order created successfully, cart cleared');
                }
              }
            ]
          );
          return; // Success, exit the retry loop
        } else {
          throw new Error(data.message || 'Order creation failed');
        }
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${API_CONFIG.MAX_RETRIES + 1 - retries}/${API_CONFIG.MAX_RETRIES} failed:`, error);
        
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
        
        console.error('Error details:', {
          message: errorMessage,
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          endpoint: API_CONFIG.BASE_URL,
          retryAttempt: API_CONFIG.MAX_RETRIES + 1 - retries,
          orderData: {
            itemCount: orderItems.length,
            totalAmount,
            userId: authUser.id,
            userEmail: authUser.email
          }
        });
        
        retries--;
        if (retries > 0 && shouldRetry) {
          Alert.alert('重試中', `訂單創建失敗，正在重試... (${3 - retries}/2)`);
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
    
    Alert.alert(
      '訂單創建失敗', 
      finalErrorMessage,
      [
        { text: '重試', onPress: () => handleCheckout() },
        { text: '取消', style: 'cancel' }
      ]
    );
    setIsProcessing(false);
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemRow}>
        <View style={styles.itemInfoLeft}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Text style={styles.itemPrice}>HKD$ {item.unitPrice} / {item.unit || '單位'}</Text>
        </View>
        <View style={styles.itemActionsRight}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Text style={[styles.quantityButtonText, item.quantity <= 1 && styles.disabledText]}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              keyboardType="number-pad"
              returnKeyType="done"
              value={quantityInputs[item.productId] ?? item.quantity.toString()}
              onChangeText={text => handleQuantityInputChange(item.productId, text)}
              onEndEditing={() => commitQuantityInput(item.productId)}
              onSubmitEditing={() => commitQuantityInput(item.productId)}
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.productId)}
          >
            <Text style={styles.removeButtonText}>移除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>購物車</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearButton}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Banner */}
      {cartBannerImage && (
        <View style={styles.cartBannerContainer}>
          <Image
            source={{ uri: cartBannerImage }}
            style={styles.cartBannerImage}
            resizeMode="cover"
          />
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyText}>購物車是空的</Text>
          <Text style={styles.emptySubtext}>去添加一些商品吧！</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.cartList}
            ListFooterComponent={() => (
              <View style={styles.footer}>
                {/* Delivery Date Selection */}
                <View style={styles.deliveryContainer}>
                  <View style={styles.deliveryHeader}>
                    <Text style={styles.deliveryTitle}>送貨日期</Text>
                    {selectedDeliveryDate ? (
                      <Text style={styles.deliverySelected}>
                        {format(new Date(selectedDeliveryDate), 'yyyy年MM月dd日 (EEE)', { locale: zhTW })}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => setShowCalendar(prev => !prev)} style={styles.calendarToggleButton}>
                    <Text style={styles.calendarToggleText}>{showCalendar ? '收合日曆' : '選擇日期'}</Text>
                  </TouchableOpacity>
                  {showCalendar && (
                    <>
                      {deliverySettingsLoading ? (
                        <View style={styles.deliveryLoading}>
                          <Text style={styles.deliveryLoadingText}>載入供應商送貨日...</Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => setCalendarMonth(prev => subMonths(prev, 1))} style={styles.calendarNavButton}>
                              <Ionicons name="chevron-back" size={16} color="#374151" />
                            </TouchableOpacity>
                            <Text style={styles.calendarMonthText}>{format(calendarMonth, 'yyyy年 MMMM', { locale: zhTW })}</Text>
                            <TouchableOpacity onPress={() => setCalendarMonth(prev => addMonths(prev, 1))} style={styles.calendarNavButton}>
                              <Ionicons name="chevron-forward" size={16} color="#374151" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.weekdaysRow}>
                            {['一','二','三','四','五','六','日'].map(label => (
                              <View key={label} style={styles.weekdayCell}>
                                <Text style={styles.weekdayText}>{label}</Text>
                              </View>
                            ))}
                          </View>
                          {daysMatrix.map((week, idx) => (
                            <View key={idx} style={styles.weekRow}>
                              {week.map((day) => {
                                const inMonth = isSameMonth(day, calendarMonth);
                                const key = format(day, 'yyyy-MM-dd');
                                const isPast = isBefore(day, startOfDay(new Date()));
                                const holidaySet = holidaySets[day.getFullYear()];
                                const baseHoliday = Boolean(deliverySettings?.autoPublicHolidays && holidaySet?.has(key));
                                const holidayBlocked = baseHoliday && !deliverySettings?.holidayOverrides.has(key);
                                const selectable = inMonth && isDateSelectable(day);
                                const isSelected = selectedDeliveryDate === key;
                                const disabled =
                                  !deliverySettings ||
                                  !inMonth ||
                                  isPast ||
                                  !selectable ||
                                  (deliverySettings?.autoPublicHolidays && !holidaySet && inMonth);
                                return (
                                  <TouchableOpacity
                                    key={key}
                                    style={[
                                      styles.dayCell,
                                      !inMonth && styles.dayCellOutMonth,
                                      disabled && styles.dayCellDisabled,
                                      isSelected && styles.dayCellSelected,
                                    ]}
                                    disabled={disabled}
                                    onPress={() => setSelectedDeliveryDate(key)}
                                  >
                                    {holidayBlocked ? (
                                      <Text style={styles.holidayMark}>假</Text>
                                    ) : (
                                      <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                                        {format(day, 'd')}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ))}
                          {!!deliverySettings?.autoPublicHolidays && loadingHolidayYear === calendarMonth.getFullYear() && (
                            <Text style={styles.helpText}>正在載入本年度公眾假期...</Text>
                          )}
                          {!!deliverySettings?.autoPublicHolidays && (
                            <Text style={styles.helpText}>標記「假」代表公眾假期，無法安排送貨。</Text>
                          )}
                          {!!deliverySettingsError && <Text style={styles.errorText}>{deliverySettingsError}</Text>}
                          {!!deliverySettingsMessage && <Text style={styles.noteText}>{deliverySettingsMessage}</Text>}
                          {/* Delivery Time Selection */}
                          {deliveryTimes.length > 0 && (
                            <View style={styles.deliveryTimeContainer}>
                              <Text style={styles.deliveryTimeTitle}>送貨時間</Text>
                              <View style={styles.deliveryTimeOptions}>
                                {deliveryTimes.map((time, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                      styles.deliveryTimeOption,
                                      selectedDeliveryTime === time && styles.deliveryTimeOptionSelected
                                    ]}
                                    onPress={() => setSelectedDeliveryTime(time)}
                                  >
                                    <Text style={[
                                      styles.deliveryTimeOptionText,
                                      selectedDeliveryTime === time && styles.deliveryTimeOptionTextSelected
                                    ]}>
                                      {time}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}
                </View>
                {/* Points Balance Display */}
                <View style={styles.pointsContainer}>
                  <View style={styles.balanceHeader}>
                    <Text style={styles.pointsLabel}>會員點數餘額</Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.pointsAmount}>
                      {loadingBalance ? '載入中...' : `${currentPoints.toLocaleString()} 點`}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.refreshButtonInline,
                        loadingBalance && { opacity: 0.6 },
                      ]}
                      onPress={fetchPointsBalance}
                      disabled={loadingBalance}
                    >
                      {loadingBalance ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                      ) : (
                        <>
                          <Ionicons name="refresh" size={14} color="#2563EB" />
                          <Text style={styles.refreshInlineText}>重新整理</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                {currentPoints < totalAmount && (
                  <View style={styles.insufficientPoints}>
                    <Text style={styles.insufficientText}>
                      點數不足！需要 {totalAmount} 點
                    </Text>
                  </View>
                )}
                
                {/* Purchase Points Button */}
                <TouchableOpacity 
                  style={styles.purchasePointsButton}
                  onPress={() => setShowPointsModal(true)}
                >
                  <Text style={styles.purchasePointsButtonText}>購買點數</Text>
                </TouchableOpacity>
                
                {categoryMinimumSpending && categoryMinimumSpending > 0 && (
                  <View style={[
                    styles.minimumSpendingContainer,
                    totalAmount < categoryMinimumSpending && styles.minimumSpendingWarning
                  ]}>
                    <Text style={[
                      styles.minimumSpendingLabel,
                      totalAmount < categoryMinimumSpending && styles.minimumSpendingWarningText
                    ]}>
                      最低消費: HKD$ {categoryMinimumSpending}
                    </Text>
                    {totalAmount < categoryMinimumSpending && (
                      <Text style={styles.minimumSpendingShortfall}>
                        還需 HKD$ {categoryMinimumSpending - totalAmount}
                      </Text>
                    )}
                  </View>
                )}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>總計:</Text>
                  <Text style={styles.totalAmount}>HKD$ {totalAmount}</Text>
                </View>
                <Text style={styles.pointsUsage}>將使用 {totalAmount} 點進行結帳</Text>
                {/* Agreement Checkbox */}
                <View style={styles.agreementRow}>
                  <TouchableOpacity
                    onPress={() => setAgreePurchaseAgreement(prev => !prev)}
                    style={[styles.checkbox, agreePurchaseAgreement && styles.checkboxChecked]}
                  >
                    {agreePurchaseAgreement && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                  <Text style={styles.agreementText}>
                    我已閱讀並同意{' '}
                    <Text
                      style={styles.agreementLink}
                      onPress={async () => {
                        try {
                          const baseEndpoint = await getBestApiEndpoint();
                          const url = `${baseEndpoint}/legal/purchase-sale-agreement`;
                          Linking.openURL(url);
                        } catch {
                          Alert.alert('無法開啟連結', '請稍後再試或於網站查看買賣協議');
                        }
                      }}
                    >
                      買賣協議 Purchase and Sale Agreement
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.checkoutButton, (isProcessing || loading || !agreePurchaseAgreement || !selectedDeliveryDate || (deliveryTimes.length > 0 && !selectedDeliveryTime)) && styles.checkoutButtonDisabled]} 
                  onPress={handleCheckout}
                  disabled={isProcessing || loading || !agreePurchaseAgreement || !selectedDeliveryDate || (deliveryTimes.length > 0 && !selectedDeliveryTime)}
                >
                  {isProcessing ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.checkoutButtonText}>處理中...</Text>
                    </View>
                  ) : (
                    <Text style={styles.checkoutButtonText}>進行結帳</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
      
      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        visible={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onPointsPurchased={(newBalance) => {
          if (typeof newBalance === 'number') {
            setCurrentPoints(newBalance);
            console.log('Points updated from purchase:', newBalance);
          } else if (firebaseUser?.uid) {
            // Fallback: refetch balance
            const fetchBalance = async () => {
              try {
                const baseEndpoint = await getBestApiEndpoint();
                const res = await fetch(`${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`, {
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
        visible={showCheckoutPasswordModal}
        onClose={() => setShowCheckoutPasswordModal(false)}
        onPasswordVerified={handlePasswordVerified}
        onPasswordIncorrect={handlePasswordIncorrect}
        userCheckoutPassword={user?.checkoutPassword}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartBannerContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  cartBannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#EF4444',
    fontSize: 16,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  cartList: {
    padding: 20,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
  },
  itemActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#F3F4F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  quantityInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 10,
    paddingVertical: 0,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deliveryContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  deliverySelected: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  deliveryLoading: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryLoadingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarNavButton: {
    padding: 6,
    borderRadius: 8,
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  calendarToggleButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  calendarToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 10,
    color: '#6B7280',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayCell: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  dayCellOutMonth: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  dayCellDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#F3F4F6',
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayNumber: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  holidayMark: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
  helpText: {
    marginTop: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#DC2626',
  },
  noteText: {
    marginTop: 6,
    fontSize: 12,
    color: '#4B5563',
  },
  pointsContainer: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  balanceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  refreshButtonInline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshInlineText: {
    marginLeft: 6,
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  insufficientPoints: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 15,
  },
  insufficientText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
  pointsUsage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 15,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  agreementLink: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  purchasePointsButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  purchasePointsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  minimumSpendingContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  minimumSpendingWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  minimumSpendingLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  minimumSpendingWarningText: {
    color: '#991B1B',
  },
  minimumSpendingShortfall: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  checkoutButton: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTimeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deliveryTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  deliveryTimeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deliveryTimeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  deliveryTimeOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  deliveryTimeOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  deliveryTimeOptionTextSelected: {
    color: '#FFFFFF',
  },
});

export default CartScreen; 