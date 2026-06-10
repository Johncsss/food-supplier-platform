'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, TrendingUp, Store, LogOut, ShoppingCart, Menu, X, AlertCircle, Calendar, User as UserIcon, BarChart3, Home } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface SalesReportData {
  date: string;
  amount: number;
  orders: number;
}

interface ProductSalesData {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalSales: number;
  averagePrice: number;
  unit?: string;
}

export default function SupplierDashboard() {
  const { user, firebaseUser, loading, isSupplier, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingMessages, setPendingMessages] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [salesPeriod, setSalesPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [salesReport, setSalesReport] = useState<SalesReportData[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
  const [loadingProductSales, setLoadingProductSales] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已成功登出');
      router.push('/login');
    } catch (error) {
      toast.error('登出時發生錯誤');
    }
  };

  const sidebarItems = [
    {
      name: '銷售報告',
      href: '/supplier',
      icon: Store,
    },
    {
      name: '訂單',
      href: '/supplier/orders',
      icon: ShoppingCart,
    },
    {
      name: '訊息',
      href: '/supplier/messages',
      icon: AlertCircle,
    },
    {
      name: '送貨日期管理',
      href: '/supplier/delivery-dates',
      icon: Calendar,
    },
    {
      name: '供應商資料',
      href: '/supplier/profile',
      icon: UserIcon,
    },
  ];

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    } else if (!loading && firebaseUser && !isSupplier) {
      // Not a supplier, redirect based on their role
      router.push('/dashboard');
    }
  }, [firebaseUser, loading, router, isSupplier]);

  useEffect(() => {
    const fetchPending = async () => {
      if (!user || !isSupplier || loading) return;
      try {
        const res = await fetch(`/api/complaints?supplierId=${encodeURIComponent(user.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        const list: any[] = Array.isArray(data.complaints) ? data.complaints : [];
        let count = 0;
        for (const c of list) {
          const status = c?.status === 'pending' ? 'pending' : 'processed';
          if (status === 'pending') count += 1;
        }
        setPendingMessages(count);
      } catch {
        // ignore
      }
    };
    fetchPending();
  }, [user, isSupplier, loading]);

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
        setPendingOrdersCount(orders.filter((order: any) => order.status === 'pending').length);
      } catch {
        // ignore errors
      }
    };
    fetchNewOrdersCount();
  }, [user, isSupplier, loading]);

  useEffect(() => {
    const fetchSalesReport = async () => {
      if (!user || !isSupplier || loading) return;
      
      try {
        setLoadingSales(true);
        const supplierIdentifier = user.id;
        const supplierCompanyName = user.companyName;
        if (!supplierIdentifier || !supplierCompanyName) {
          console.warn('Missing supplier identifier or company name');
          return;
        }
        
        console.log('Fetching sales report for supplier:', { supplierIdentifier, supplierCompanyName });
        const response = await fetch(`/api/orders?supplier=${encodeURIComponent(supplierIdentifier)}&companyName=${encodeURIComponent(supplierCompanyName)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch orders:', response.status, errorData);
          toast.error('無法載入訂單資料');
          return;
        }
        
        const data = await response.json();
        const orders = data.orders || [];
        console.log(`Fetched ${orders.length} orders from Firebase`);
        
        // Filter completed orders only
        const completedOrders = orders.filter((order: any) => {
          const status = order.status?.toLowerCase();
          return status === 'completed' || status === 'delivered';
        });
        console.log(`Found ${completedOrders.length} completed/delivered orders`);
        
        // Group orders by period
        const groupedData = new Map<string, { amount: number; orders: number }>();
        
        completedOrders.forEach((order: any) => {
          // Handle createdAt - could be Date object, string, or Firestore timestamp
          let orderDate: Date | null = null;
          
          if (order.createdAt) {
            if (order.createdAt instanceof Date) {
              orderDate = order.createdAt;
            } else if (typeof order.createdAt === 'string') {
              orderDate = new Date(order.createdAt);
            } else if (order.createdAt.toDate && typeof order.createdAt.toDate === 'function') {
              // Firestore timestamp
              orderDate = order.createdAt.toDate();
            } else {
              console.warn('Unexpected createdAt format:', order.createdAt);
              return;
            }
          }
          
          if (!orderDate || isNaN(orderDate.getTime())) {
            console.warn('Invalid date for order:', order.id, order.createdAt);
            return;
          }
          
          let key: string;
          
          if (salesPeriod === 'day') {
            key = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
          } else if (salesPeriod === 'month') {
            const month = String(orderDate.getMonth() + 1).padStart(2, '0');
            key = `${orderDate.getFullYear()}-${month}`; // YYYY-MM
          } else {
            key = String(orderDate.getFullYear()); // YYYY
          }
          
          const existing = groupedData.get(key) || { amount: 0, orders: 0 };
          
          // Calculate order amount - use totalAmount if available, otherwise calculate from items
          let orderAmount = 0;
          if (typeof order.totalAmount === 'number' && order.totalAmount > 0) {
            orderAmount = order.totalAmount;
          } else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            // Fallback: calculate from items
            orderAmount = order.items.reduce((sum: number, item: any) => {
              const itemTotal = typeof item.totalPrice === 'number' 
                ? item.totalPrice 
                : (typeof item.unitPrice === 'number' && typeof item.quantity === 'number'
                  ? item.unitPrice * item.quantity
                  : 0);
              return sum + itemTotal;
            }, 0);
          }
          
          groupedData.set(key, {
            amount: existing.amount + orderAmount,
            orders: existing.orders + 1,
          });
        });
        
        console.log(`Grouped into ${groupedData.size} periods`);
        
        // Convert to array and sort by date descending
        const reportArray: SalesReportData[] = Array.from(groupedData.entries())
          .map(([date, data]) => ({
            date,
            amount: data.amount,
            orders: data.orders,
          }))
          .sort((a, b) => {
            if (salesPeriod === 'day') {
              return b.date.localeCompare(a.date);
            } else if (salesPeriod === 'month') {
              return b.date.localeCompare(a.date);
            } else {
              return parseInt(b.date) - parseInt(a.date);
            }
          });
        
        setSalesReport(reportArray);
        
        // Calculate monthly sales for the stats card
        const currentMonth = new Date();
        const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthData = groupedData.get(currentMonthKey);
        setMonthlySales(currentMonthData?.amount || 0);
        console.log(`Monthly sales for ${currentMonthKey}: $${currentMonthData?.amount || 0}`);
      } catch (error) {
        console.error('Error fetching sales report:', error);
        toast.error('載入銷售報表時發生錯誤');
      } finally {
        setLoadingSales(false);
      }
    };
    
    fetchSalesReport();
  }, [user, isSupplier, loading, salesPeriod]);

  useEffect(() => {
    const fetchProductSalesReport = async () => {
      if (!user || !isSupplier || loading) return;
      
      try {
        setLoadingProductSales(true);
        const supplierIdentifier = user.id;
        const supplierCompanyName = user.companyName;
        if (!supplierIdentifier || !supplierCompanyName) {
          console.warn('Missing supplier identifier or company name for product sales');
          return;
        }
        
        console.log('Fetching product sales report for supplier:', { supplierIdentifier, supplierCompanyName });
        const response = await fetch(`/api/orders?supplier=${encodeURIComponent(supplierIdentifier)}&companyName=${encodeURIComponent(supplierCompanyName)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch orders for product sales:', response.status, errorData);
          toast.error('無法載入訂單資料');
          return;
        }
        
        const data = await response.json();
        const orders = data.orders || [];
        console.log(`Fetched ${orders.length} orders for product sales analysis`);
        
        // Filter completed orders only
        const completedOrders = orders.filter((order: any) => {
          const status = order.status?.toLowerCase();
          return status === 'completed' || status === 'delivered';
        });
        console.log(`Found ${completedOrders.length} completed/delivered orders for product analysis`);
        
        // Group by product
        const productMap = new Map<string, {
          productId: string;
          productName: string;
          totalQuantity: number;
          totalSales: number;
          unit?: string;
        }>();
        
        let totalItemsProcessed = 0;
        completedOrders.forEach((order: any) => {
          if (!order.items || !Array.isArray(order.items)) {
            console.warn('Order missing items array:', order.id);
            return;
          }
          
          order.items.forEach((item: any) => {
            if (!item) return;
            
            const productId = item.productId || `unknown-${totalItemsProcessed}`;
            const productName = item.productName || '未知產品';
            const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
            const itemTotalPrice = typeof item.totalPrice === 'number' 
              ? item.totalPrice 
              : (unitPrice * quantity);
            
            const existing = productMap.get(productId) || {
              productId,
              productName,
              totalQuantity: 0,
              totalSales: 0,
              unit: item.unit || '單位',
            };
            
            productMap.set(productId, {
              ...existing,
              totalQuantity: existing.totalQuantity + quantity,
              totalSales: existing.totalSales + itemTotalPrice,
            });
            
            totalItemsProcessed++;
          });
        });
        
        console.log(`Processed ${totalItemsProcessed} order items, grouped into ${productMap.size} products`);
        
        // Convert to array and calculate average price, sort by total sales descending
        const productSalesArray: ProductSalesData[] = Array.from(productMap.values())
          .map((product) => ({
            ...product,
            averagePrice: product.totalQuantity > 0 ? product.totalSales / product.totalQuantity : 0,
          }))
          .sort((a, b) => b.totalSales - a.totalSales);
        
        console.log(`Product sales report ready with ${productSalesArray.length} products`);
        setProductSales(productSalesArray);
      } catch (error) {
        console.error('Error fetching product sales report:', error);
        toast.error('載入產品銷售報表時發生錯誤');
      } finally {
        setLoadingProductSales(false);
      }
    };
    
    fetchProductSalesReport();
  }, [user, isSupplier, loading]);

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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">供應商系統</h1>
              <p className="text-xs text-gray-500">Supplier Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
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
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  {item.name === '訊息' && pendingMessages > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5 min-w-[1.25rem]">
                      {pendingMessages}
                    </span>
                  )}
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
            <button
              className="p-1 rounded-lg hover:bg-gray-100"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">供應商銷售報告</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">{user?.companyName || '供應商'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待處理訂單</p>
                <p className="text-3xl font-bold text-gray-900">{pendingOrdersCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">本月銷售額</p>
                <p className="text-3xl font-bold text-gray-900">${monthlySales.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">銷售報表</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSalesPeriod('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  salesPeriod === 'day'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                日報表
              </button>
              <button
                onClick={() => setSalesPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  salesPeriod === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                月報表
              </button>
              <button
                onClick={() => setSalesPeriod('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  salesPeriod === 'year'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                年報表
              </button>
            </div>
          </div>

          {loadingSales ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-3 text-gray-600">載入中...</p>
            </div>
          ) : salesReport.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暫無銷售資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {salesPeriod === 'day' ? '日期' : salesPeriod === 'month' ? '月份' : '年份'}
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">訂單數</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">銷售額</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.map((item, index) => {
                    let displayDate = item.date;
                    if (salesPeriod === 'day') {
                      const date = new Date(item.date);
                      displayDate = date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
                    } else if (salesPeriod === 'month') {
                      const [year, month] = item.date.split('-');
                      displayDate = `${year}年${parseInt(month)}月`;
                    } else {
                      displayDate = `${item.date}年`;
                    }
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{displayDate}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{item.orders}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          ${item.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 px-4 text-gray-900">總計</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {salesReport.reduce((sum, item) => sum + item.orders, 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${salesReport.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Product Sales Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">產品銷售報表</h2>
          </div>

          {loadingProductSales ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-3 text-gray-600">載入中...</p>
            </div>
          ) : productSales.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暫無產品銷售資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">產品名稱</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">銷售數量</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">平均單價</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">總銷售額</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.map((product, index) => (
                    <tr key={product.productId || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{product.productName}</td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {product.totalQuantity.toLocaleString()} {product.unit || ''}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${product.averagePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        ${product.totalSales.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 px-4 text-gray-900">總計</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {productSales.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">-</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${productSales.reduce((sum, p) => sum + p.totalSales, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

          </div>
        </main>
      </div>
    </div>
  );
}
