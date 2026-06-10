'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, format, getDay } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';
import { Menu, X, Store, ShoppingCart, AlertCircle, Calendar, User as UserIcon, LogOut, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { fetchHongKongPublicHolidays } from '@/lib/hkPublicHolidays';
import toast from 'react-hot-toast';

export default function SupplierDeliveryDates() {
  const { user, firebaseUser, loading, isSupplier, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [weeklyOffDays, setWeeklyOffDays] = useState<Set<number>>(new Set());
  const [holidayOverrides, setHolidayOverrides] = useState<Set<string>>(new Set());
  const [deliveryTimes, setDeliveryTimes] = useState<string[]>(['']);
  const [deliverySettings, setDeliverySettings] = useState<{
    offDates: Set<string>;
    weeklyOffDays: Set<number>;
    autoPublicHolidays: boolean;
    holidayOverrides: Set<string>;
  } | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoPublicHolidays, setAutoPublicHolidays] = useState(false);
  const [holidaySets, setHolidaySets] = useState<Record<number, Set<string>>>({});
  const [loadingHolidayYear, setLoadingHolidayYear] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    } else if (!loading && firebaseUser && !isSupplier) {
      router.push('/dashboard');
    }
  }, [firebaseUser, loading, router, isSupplier]);

  const sidebarItems = [
    { name: '銷售報告', href: '/supplier', icon: Store },
    { name: '訂單', href: '/supplier/orders', icon: ShoppingCart },
    { name: '訊息', href: '/supplier/messages', icon: AlertCircle },
    { name: '送貨日期管理', href: '/supplier/delivery-dates', icon: Calendar },
    { name: '供應商資料', href: '/supplier/profile', icon: UserIcon },
  ];

  const monthLabel = useMemo(() => format(currentMonth, 'yyyy年 MMMM', { locale: zhTW }), [currentMonth]);

  // Load saved off-dates for this supplier
  useEffect(() => {
    const load = async () => {
      if (!user?.id || !isSupplier || loading) return;
      setLoadingDates(true);
      try {
        const response = await fetch(
          `/api/supplier/delivery-settings?supplierId=${encodeURIComponent(user.id)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '無法載入供應商送貨設定');
        }

        const data = await response.json();
        const list: string[] = Array.isArray(data?.offDates) ? data.offDates : [];
        const weekly: number[] = Array.isArray(data?.weeklyOffDays) ? data.weeklyOffDays : [];
        const autoHolidays = Boolean(data?.autoPublicHolidays);
        const overrides: string[] = Array.isArray(data?.holidayOverrides) ? data.holidayOverrides : [];
        const times: string[] = Array.isArray(data?.deliveryTimes) ? data.deliveryTimes : 
                               (typeof data?.deliveryTime === 'string' && data.deliveryTime ? [data.deliveryTime] : ['']);

        const offSet = new Set(list);
        const weeklySet = new Set(weekly);
        const overrideSet = new Set(overrides);

        setSelectedDates(offSet);
        setWeeklyOffDays(weeklySet);
        setAutoPublicHolidays(autoHolidays);
        setDeliveryTimes(times.length > 0 ? times : ['']);
        setDeliverySettings({
          offDates: offSet,
          weeklyOffDays: weeklySet,
          autoPublicHolidays: autoHolidays,
          holidayOverrides: overrideSet,
        });
        setHolidayOverrides(overrideSet);
      } catch (e) {
        console.error('Failed to load off dates', e);
        toast.error(
          e instanceof Error ? e.message : '無法載入供應商送貨設定，已套用預設值',
        );
        const defaults = {
          offDates: new Set<string>(),
          weeklyOffDays: new Set<number>(),
          autoPublicHolidays: false,
          holidayOverrides: new Set<string>(),
        };
        setSelectedDates(defaults.offDates);
        setWeeklyOffDays(defaults.weeklyOffDays);
        setAutoPublicHolidays(defaults.autoPublicHolidays);
        setDeliverySettings(defaults);
        setHolidayOverrides(defaults.holidayOverrides);
      } finally {
        setLoadingDates(false);
      }
    };
    load();
  }, [user?.id, isSupplier, loading]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    if (holidaySets[year]) return;

    let active = true;
    setLoadingHolidayYear(year);
    fetchHongKongPublicHolidays(year)
      .then((set) => {
        if (!active) return;
        setHolidaySets((prev) => ({
          ...prev,
          [year]: new Set(set),
        }));
      })
      .catch((error) => {
        console.error('Failed to ensure holiday data', error);
      })
      .finally(() => {
        if (active) {
          setLoadingHolidayYear(null);
        }
      });

    return () => {
      active = false;
    };
  }, [currentMonth, holidaySets]);

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      if (!user || !isSupplier || loading) return;
      try {
        const supplierIdentifier = user.id;
        const supplierCompanyName = user.companyName;
        if (!supplierIdentifier || !supplierCompanyName) return;
        
        const response = await fetch(`/api/orders?supplier=${encodeURIComponent(supplierIdentifier)}&companyName=${encodeURIComponent(supplierCompanyName)}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const orders = data.orders || [];
        const newOrders = orders.filter((order: any) => 
          order.status === 'pending' || order.status === 'confirmed'
        );
        setNewOrdersCount(newOrders.length);
      } catch {
        // ignore errors
      }
    };
    fetchNewOrdersCount();
  }, [user, isSupplier, loading]);

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      const payload = {
        supplierId: user.id,
        offDates: Array.from(selectedDates),
        weeklyOffDays: Array.from(weeklyOffDays),
        autoPublicHolidays,
        holidayOverrides: Array.from(holidayOverrides),
        deliveryTimes: deliveryTimes.filter(time => time.trim() !== ''),
      };
      const response = await fetch('/api/supplier/delivery-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '儲存失敗，請稍後再試');
      }

      toast.success('已儲存休息日設定');
      setDeliverySettings({
        offDates: new Set(payload.offDates),
        weeklyOffDays: new Set(payload.weeklyOffDays),
        autoPublicHolidays: payload.autoPublicHolidays,
        holidayOverrides: new Set(payload.holidayOverrides),
      });
      setHolidayOverrides(new Set(payload.holidayOverrides));
    } catch (e: any) {
      console.error('Failed to save off dates', e);
      toast.error(e?.message || '儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const daysMatrix = useMemo(() => {
    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
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
  }, [currentMonth]);

  const toggleDate = (d: Date) => {
    if (!isSameMonth(d, currentMonth)) return;
    const key = format(d, 'yyyy-MM-dd');
    const isBaseHoliday = autoPublicHolidays && publicHolidaySet.has(key);
    if (isBaseHoliday) {
      setHolidayOverrides((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
      return;
    }
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleWeeklyOffDay = (weekday: number) => {
    setWeeklyOffDays((prev) => {
      const next = new Set(prev);
      if (next.has(weekday)) {
        next.delete(weekday);
      } else {
        next.add(weekday);
      }
      return next;
    });
  };

  const weekdayOptions = [
    { label: '週一', value: 1 },
    { label: '週二', value: 2 },
    { label: '週三', value: 3 },
    { label: '週四', value: 4 },
    { label: '週五', value: 5 },
    { label: '週六', value: 6 },
    { label: '週日', value: 0 },
  ];

  const publicHolidaySet = useMemo(() => {
    const year = currentMonth.getFullYear();
    return holidaySets[year] ? new Set(holidaySets[year]) : new Set<string>();
  }, [currentMonth, holidaySets]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !isSupplier) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div>
            <h1 className="text-lg font-bold text-gray-900">供應商系統</h1>
            <p className="text-xs text-gray-500">Supplier Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-6 px-3 flex-1">
          <div className="space-y-1">
            {/* Back to Home Link */}
            <Link
              href="/"
              className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900 mb-2"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
              <span className="flex-1">返回首頁</span>
            </Link>
            
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.name === '訂單' && newOrdersCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5 min-w-[1.25rem]">
                      {newOrdersCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Supplier Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name || '供應商'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button className="p-1 rounded-lg hover:bg-gray-100" onClick={async () => { await signOut(); router.push('/login'); }}>
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">送貨日期管理</h1>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Calendar Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-lg font-semibold text-gray-900">{monthLabel}</div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Public Holiday Toggle */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">香港公眾假期自動休息</p>
                  <p className="text-xs text-gray-500">開啟後，系統會自動標記當月份的香港公眾假期為休息日。</p>
                </div>
                <button
                  onClick={() => setAutoPublicHolidays((prev) => !prev)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                    autoPublicHolidays
                      ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {autoPublicHolidays ? '已開啟' : '未開啟'}
                </button>
              </div>

              {/* Weekly Off Controls */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">每週固定休息日</p>
                <div className="flex flex-wrap gap-2">
                  {weekdayOptions.map(({ label, value }) => {
                    const active = weeklyOffDays.has(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleWeeklyOffDay(value)}
                        className={[
                          'px-3 py-2 rounded-lg text-sm border transition-colors',
                          active
                            ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Times Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送貨時間
                </label>
                <div className="space-y-2">
                  {deliveryTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...deliveryTimes];
                          newTimes[index] = e.target.value;
                          setDeliveryTimes(newTimes);
                        }}
                        placeholder="例如：9:00am - 12:00pm"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                      {deliveryTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTimes = deliveryTimes.filter((_, i) => i !== index);
                            setDeliveryTimes(newTimes.length > 0 ? newTimes : ['']);
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDeliveryTimes([...deliveryTimes, ''])}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors text-sm font-medium"
                  >
                    + 新增送貨時間
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  請輸入送貨時間範圍，例如：9:00am - 12:00pm 或 3:00pm - 6:00pm
                </p>
              </div>

              {/* Instructions */}
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  點擊當月日期以切換<span className="font-medium text-red-600">休息日</span>，或透過上方按鈕設定每週固定休息日；
                  <br />
                  標記「假」的公眾假期也可以點擊解除休息
                </p>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
                {['一','二','三','四','五','六','日'].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {daysMatrix.flat().map((d, idx) => {
                  const inMonth = isSameMonth(d, currentMonth);
                  const key = format(d, 'yyyy-MM-dd');
                  const selected = selectedDates.has(key);
                  const weeklyOff = weeklyOffDays.has(getDay(d));
                  const baseHoliday = autoPublicHolidays && publicHolidaySet.has(key);
                  const holidayBlocked = baseHoliday && !holidayOverrides.has(key);
                  const isOff = inMonth && (selected || weeklyOff || holidayBlocked);
                  const today = isToday(d);
                  return (
                    <button
                      key={`${key}-${idx}`}
                      className={[
                        'relative h-10 rounded-lg border text-sm',
                        inMonth ? 'bg-white hover:bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400',
                        isOff ? 'ring-2 ring-red-500 bg-red-50' : '',
                        today ? 'border-primary-300' : '',
                      ].join(' ')}
                      onClick={() => toggleDate(d)}
                      disabled={!inMonth}
                    >
                      <span className="block text-center leading-9 font-medium">
                        {format(d, 'd')}
                      </span>
                      {holidayBlocked && (
                        <span className="absolute top-1 right-1 text-base font-semibold text-red-500">
                          假
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded border border-red-300 bg-red-50"></span>
                  <span>休息日</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-red-400 text-[9px] text-red-500">假</span>
                  <span>公眾假期</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded border border-gray-200"></span>
                  <span>非選取日期</span>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  className="w-full px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  onClick={handleSave}
                  disabled={saving || loadingDates}
                >
                  {saving ? '儲存中...' : '儲存更改'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



