'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Calendar, Package, LogOut, X, Eye } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface SalesData {
  date: string;
  amount: number;
  commission: number;
  orders: number;
}

interface SalesPerson {
  name: string;
  email: string;
  phone: string;
  position: string;
  commissionRate: number;
  totalSales: number;
  joinedDate: string;
}

interface Transaction {
  id: string;
  date: string;
  customerName: string;
  productName: string;
  amount: number;
  commission: number;
  status: 'completed' | 'pending';
}

export default function SalesPersonProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { signOut } = useAuth();
  const salesName = decodeURIComponent(params.name as string);
  
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [selectedPeriodData, setSelectedPeriodData] = useState<SalesData | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已成功登出');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('登出失敗');
    }
  };

  // Fetch real sales person data from database
  useEffect(() => {
    const fetchSalesPersonData = async () => {
      try {
        setLoading(true);
        
        // Find the sales member by name
        const salesMembersRef = collection(db, 'salesMembers');
        const q = query(salesMembersRef, where('name', '==', salesName));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const memberData = querySnapshot.docs[0].data();
          setSalesPerson({
            name: memberData.name,
            email: memberData.email,
            phone: memberData.phone || 'N/A',
            position: memberData.position,
            commissionRate: memberData.commissionRate,
            totalSales: memberData.totalSales || 0,
            joinedDate: memberData.joinedDate || memberData.createdAt?.toDate?.()?.toISOString().split('T')[0] || 'N/A',
          });
        } else {
          // Fallback to mock data if not found
          setSalesPerson({
            name: salesName,
            email: `${salesName.toLowerCase()}@company.com`,
            phone: 'N/A',
            position: '銷售專員',
            commissionRate: 5,
            totalSales: 0,
            joinedDate: 'N/A',
          });
        }
      } catch (error) {
        console.error('Error fetching sales person data:', error);
        toast.error('載入資料失敗');
        // Fallback to mock data
        setSalesPerson({
          name: salesName,
          email: `${salesName.toLowerCase()}@company.com`,
          phone: 'N/A',
          position: '銷售專員',
          commissionRate: 5,
          totalSales: 0,
          joinedDate: 'N/A',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalesPersonData();
  }, [salesName]);

  // Mock sales data - will show $0 until real sales are recorded
  const salesDataByDay: SalesData[] = [
    { date: '2025-10-10', amount: 0, commission: 0, orders: 0 },
  ];

  const salesDataByMonth: SalesData[] = [
    { date: '2025-10', amount: 0, commission: 0, orders: 0 },
  ];

  const salesDataByYear: SalesData[] = [
    { date: '2025', amount: 0, commission: 0, orders: 0 },
  ];

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'day':
        return salesDataByDay;
      case 'month':
        return salesDataByMonth;
      case 'year':
        return salesDataByYear;
      default:
        return salesDataByMonth;
    }
  };

  const currentData = getCurrentData();
  const totalEarnings = currentData.reduce((sum, data) => sum + data.commission, 0);
  const totalSales = currentData.reduce((sum, data) => sum + data.amount, 0);
  const totalOrders = currentData.reduce((sum, data) => sum + data.orders, 0);

  // Mock transaction data - replace with real data from your database
  const getTransactionsForPeriod = (periodData: SalesData): Transaction[] => {
    // Mock transactions for the selected period
    return [
      { id: '1', date: '2025-10-10', customerName: '餐廳 A', productName: '食材套餐', amount: 2000, commission: 100, status: 'completed' },
      { id: '2', date: '2025-10-10', customerName: '餐廳 B', productName: '肉類產品', amount: 1500, commission: 75, status: 'completed' },
      { id: '3', date: '2025-10-10', customerName: '餐廳 C', productName: '蔬菜水果', amount: 1500, commission: 75, status: 'pending' },
    ];
  };

  const handleRowClick = (data: SalesData) => {
    setSelectedPeriodData(data);
    setShowTransactionModal(true);
  };

  const formatDate = (date: string) => {
    if (selectedPeriod === 'day') {
      return new Date(date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    } else if (selectedPeriod === 'month') {
      return date.substring(0, 7); // YYYY-MM
    } else {
      return date; // YYYY
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!salesPerson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">找不到銷售人員資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{salesPerson.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{salesPerson.position}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">佣金率</div>
                <div className="text-2xl font-bold text-primary-600">{salesPerson.commissionRate}%</div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">電子郵件</div>
              <div className="text-sm font-medium text-gray-900">{salesPerson.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">聯絡電話</div>
              <div className="text-sm font-medium text-gray-900">{salesPerson.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">加入日期</div>
              <div className="text-sm font-medium text-gray-900">{salesPerson.joinedDate}</div>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === 'day'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按日
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按月
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按年
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總收入（佣金）</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  HKD ${totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總銷售額</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  HKD ${totalSales.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">訂單數量</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Report Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">銷售報告</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    銷售額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    佣金收入
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單數量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平均訂單額
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((data, index) => (
                  <tr 
                    key={index} 
                    onClick={() => handleRowClick(data)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{formatDate(data.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">HKD ${data.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        HKD ${data.commission.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{data.orders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">
                          HKD ${(data.amount / data.orders).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">總計</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      HKD ${totalSales.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      HKD ${totalEarnings.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{totalOrders}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      HKD ${totalOrders > 0 ? (totalSales / totalOrders).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Transaction Details Modal */}
        {showTransactionModal && selectedPeriodData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  交易明細 - {formatDate(selectedPeriodData.date)}
                </h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Period Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">總銷售額</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      HKD ${selectedPeriodData.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">總佣金</div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      HKD ${selectedPeriodData.commission.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">訂單數量</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">
                      {selectedPeriodData.orders}
                    </div>
                  </div>
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">平均訂單額</div>
                    <div className="text-lg font-bold text-primary-600 mt-1">
                      HKD ${(selectedPeriodData.amount / selectedPeriodData.orders).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            日期
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            客戶名稱
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            交易額
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            佣金
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getTransactionsForPeriod(selectedPeriodData).map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(transaction.date).toLocaleDateString('zh-TW')}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{transaction.customerName}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">HKD ${transaction.amount.toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                HKD ${transaction.commission.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.status === 'completed' ? '已完成' : '處理中'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

