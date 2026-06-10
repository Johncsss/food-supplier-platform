'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Calendar, DollarSign, MapPin, Clock, CheckCircle, Truck, Download, Search, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import ComplaintModal from '@/components/ui/ComplaintModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { generateInvoicePDF, InvoiceData } from '@/lib/pdf-generator';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
  unit?: string;
}

interface Order {
  id: string;
  userId: string;
  firebaseUid?: string;
  userEmail?: string;
  restaurantName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate: Date;
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  notes?: string;
  source?: string;
  supplier?: string;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: '待處理',
  confirmed: '已確認',
  processing: '處理中',
  shipped: '已出貨',
  delivered: '已送達',
  completed: '已完成',
  cancelled: '已取消'
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  completed: CheckCircle,
  cancelled: Package
};

export default function UserOrders() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});
  const [supplierLogos, setSupplierLogos] = useState<Record<string, string>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Authentication protection
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch supplier display data (name + logo) by supplier identifier.
  // Note: supplier identifier may be supplier doc id OR companyName.
  const fetchSupplierMeta = useCallback(async (supplierRefs: string[]) => {
    if (supplierRefs.length === 0) return { nameMap: {}, logoMap: {} };
    
    try {
      const uniqueIds = Array.from(new Set(supplierRefs.filter(id => id)));
      if (uniqueIds.length === 0) return { nameMap: {}, logoMap: {} };
      
      const nameMap: Record<string, string> = {};
      const logoMap: Record<string, string> = {};
      
      // Fetch each supplier individually (since we might have company names instead of IDs)
      for (const supplierId of uniqueIds) {
        try {
          // First try to get by document ID
          const supplierDoc = await getDoc(doc(db, 'users', supplierId));
          if (supplierDoc.exists()) {
            const data = supplierDoc.data();
            if (data.companyName) {
              nameMap[supplierId] = data.companyName;
              if ((data as any).logo) {
                logoMap[supplierId] = (data as any).logo;
              }
              continue;
            }
          }
          
          // If not found by ID, try searching by companyName
          const usersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'supplier'),
            where('companyName', '==', supplierId)
          );
          const snapshot = await getDocs(usersQuery);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.companyName) {
              nameMap[supplierId] = data.companyName;
              if ((data as any).logo) {
                logoMap[supplierId] = (data as any).logo;
              }
            }
          } else {
            // If still not found, use the supplierId as the name
            nameMap[supplierId] = supplierId;
          }
        } catch (error) {
          console.error(`Error fetching supplier ${supplierId}:`, error);
          // Fallback to using the supplierId as the name
          nameMap[supplierId] = supplierId;
        }
      }
      
      return { nameMap, logoMap };
    } catch (error) {
      console.error('Error fetching supplier names from Firestore:', error);
      return { nameMap: {}, logoMap: {} };
    }
  }, []);

  const fetchOrders = useCallback(async (showLoading = true) => {
    console.log('fetchOrders called, showLoading:', showLoading);
    console.log('Current user state:', { 
      firebaseUser: firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null,
      user: user ? { id: user.id, email: user.email, memberPoints: user.memberPoints } : null,
      loading: authLoading
    });
    
    // If still loading, don't fetch orders yet
    if (authLoading) {
      console.log('Still loading user data, skipping order fetch');
      return;
    }
    
    if (showLoading) {
      setLoading(true);
      setIsUpdating(true);
    }
    
    try {
      let fetchedOrders: Order[] = [];

      // Only fetch real orders from Firestore if user is authenticated
      if (firebaseUser?.uid && !authLoading) {
        console.log('Fetching real orders for user:', firebaseUser.uid);
        console.log('User authentication state:', {
          isAuthenticated: !!firebaseUser,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          userData: user ? { id: user.id, firebaseUid: user.firebaseUid } : null
        });
        
        try {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', firebaseUser.uid)
          );
          
          console.log('Executing Firestore query for orders...');
          const querySnapshot = await getDocs(ordersQuery);
          console.log('Query completed. Found', querySnapshot.docs.length, 'orders with userId:', firebaseUser.uid);
          
          // If no orders found with Firebase UID, try searching with user's custom ID
          if (querySnapshot.docs.length === 0 && user?.id && user.id !== firebaseUser.uid) {
            console.log('No orders found with Firebase UID, trying with user custom ID:', user.id);
            const alternateQuery = query(
              collection(db, 'orders'),
              where('userId', '==', user.id)
            );
            const alternateSnapshot = await getDocs(alternateQuery);
            console.log('Alternate query found', alternateSnapshot.docs.length, 'orders with userId:', user.id);
            
            if (alternateSnapshot.docs.length > 0) {
              const alternateOrders: Order[] = alternateSnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Processing alternate order:', doc.id, 'userId:', data.userId);
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate?.() || new Date(),
                  updatedAt: data.updatedAt?.toDate?.() || new Date(),
                  deliveryDate: data.deliveryDate?.toDate?.() || new Date()
                } as Order;
              });
              console.log('Using alternate orders:', alternateOrders.length);
              fetchedOrders = [...alternateOrders];
            } else {
              console.log('No orders found with either user ID');
            }
          } else {
            // Process orders found with Firebase UID
            const firestoreOrders: Order[] = querySnapshot.docs.map(doc => {
              const data = doc.data();
              console.log('Processing order:', doc.id, 'userId:', data.userId);
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
                deliveryDate: data.deliveryDate?.toDate?.() || new Date()
              } as Order;
            });

            console.log('Firestore orders loaded:', firestoreOrders.length);
            console.log('Order details:', firestoreOrders.map(o => ({ id: o.id, userId: o.userId, status: o.status })));
            fetchedOrders = [...firestoreOrders];
          }
        } catch (firestoreError) {
          console.error('Error fetching orders from Firestore:', firestoreError);
          console.error('Firestore error details:', {
            code: firestoreError instanceof Error ? (firestoreError as any).code : undefined,
            message: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
            stack: firestoreError instanceof Error ? firestoreError.stack : undefined
          });
          // If Firestore fails, show empty orders
          fetchedOrders = [];
        }
      } else {
        console.log('No authenticated user, showing empty orders');
        fetchedOrders = [];
      }

      console.log('Total orders to display:', fetchedOrders.length);
      // Sort newest first
      fetchedOrders.sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
      setLastUpdate(new Date());

      // Fetch supplier names for all orders
      const supplierIds = fetchedOrders
        .map(order => (order as any).supplierCompanyName || (order as any).supplierName || order.supplier || order.supplierId)
        .filter(Boolean);
      
      if (supplierIds.length > 0) {
        const meta = await fetchSupplierMeta(supplierIds);
        setSupplierNames(meta.nameMap);
        setSupplierLogos(meta.logoMap);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Show empty orders on error
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      setIsUpdating(false);
    }
  }, [firebaseUser, user, authLoading, fetchSupplierMeta]);

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Filter orders based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleDownloadInvoice = async (order: Order) => {
    if (!order) return;

    setDownloadingInvoice(order.id);
    try {
      const resolvedAddress = getResolvedAddress(order);
      const normalizedAddress = {
        street: resolvedAddress?.street || '',
        city: resolvedAddress?.city || '',
        state: resolvedAddress?.state || '',
        zipCode: resolvedAddress?.zipCode || '',
      };
      const invoiceData: InvoiceData = {
        orderId: order.id,
        orderDate: order.createdAt,
        customerName: order.userEmail || 'Customer',
        customerEmail: order.userEmail || '',
        items: order.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        subtotal: order.totalAmount,
        tax: 0,
        total: order.totalAmount,
        deliveryAddress: normalizedAddress
      };

      await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleComplaintClick = (order: Order) => {
    setSelectedOrder(order);
    setComplaintModalOpen(true);
  };

  const handleComplaintSubmit = async (message: string) => {
    if (!selectedOrder || !user) return;

    try {
      const supplierIdentifier =
        (selectedOrder as any).supplierId ||
        (selectedOrder as any).supplier ||
        (selectedOrder.items.find((item) => (item as any).supplierId || (item as any).supplier) as any)?.supplierId ||
        (selectedOrder.items.find((item) => (item as any).supplier) as any)?.supplier ||
        '';

      if (!supplierIdentifier) {
        throw new Error('無法判定供應商資訊，請聯絡客服協助');
      }

      const supplierCompanyName =
        (selectedOrder as any).supplierCompanyName ||
        (selectedOrder as any).supplierName ||
        selectedOrder.restaurantName ||
        supplierIdentifier;

      const response = await fetch('/api/create-complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          message,
          userId: user.id,
          userEmail: user.email,
          restaurantName: user.restaurantName || '',
          supplierId: supplierIdentifier,
          supplierCompanyName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '提交失敗' }));
        throw new Error(data.error || '提交失敗');
      }

      setComplaintModalOpen(false);
      setSelectedOrder(null);
      toast.success('訊息已送出');
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast.error(error?.message || '提交時發生錯誤');
      throw error;
    }
  };

  const formatDate = (date: Date) => {
    // Use a simple, consistent format that works the same on server and client
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${month} ${day}, ${year} at ${displayHours}:${minutes} ${ampm}`;
  };

const formatDeliveryDate = (date: Date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdayNames[d.getDay()];
  return `${month}-${day}-${year}, ${weekday}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || Package;
    return <IconComponent className="w-4 h-4" />;
  };

  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const getResolvedAddress = useCallback(
    (order: Order) => {
      const orderAddress = order.deliveryAddress || {};
      const hasOrderAddress = orderAddress && Object.values(orderAddress).some(Boolean);
      if (hasOrderAddress) {
        return orderAddress;
      }
      const userAddress = user?.address || {};
      const hasUserAddress = userAddress && Object.values(userAddress).some(Boolean);
      return hasUserAddress ? userAddress : null;
    },
    [user?.address]
  );

  const formatAddress = useCallback((address: any | null) => {
    if (!address) return '未填寫';
    const lines = [];
    if (address.street) lines.push(address.street);
    const cityLine = [address.city, address.state, address.zipCode].filter(Boolean).join(' ');
    if (cityLine) lines.push(cityLine);
    return lines.length > 0 ? lines.join('\n') : '未填寫';
  }, []);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的訂單</h1>
          <p className="text-gray-600">追蹤和管理您的食材供應訂單</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">總訂單數</p>
                <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">總消費</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜尋訂單：訂單編號、產品名稱或狀態..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchOrders(true)}
                disabled={isUpdating}
                className="px-4 py-2 text-white rounded-lg flex items-center space-x-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#0B8628' }}
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Package className="w-4 h-4" />
                )}
                <span>重新整理</span>
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            最後更新：{formatDate(lastUpdate)}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">找不到訂單</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? '沒有符合搜尋條件的訂單。' : '您尚未下任何訂單。'}
            </p>
            {!searchTerm && (
              <a
                href="/products"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                瀏覽產品
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">訂單 #{order.id}</h3>
                          <p className="text-sm text-gray-600">下單時間：{formatDate(order.createdAt)}</p>
                          {(() => {
                            const supplierId = (order as any).supplierCompanyName || (order as any).supplierName || order.supplier || order.supplierId;
                            const supplierName = supplierId ? (supplierNames[supplierId] || supplierId) : null;
                            return supplierName ? (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="inline-flex items-center gap-2">
                                  {supplierId && supplierLogos[supplierId] ? (
                                    <img
                                      src={supplierLogos[supplierId]}
                                      alt="Supplier logo"
                                      className="w-20 h-20 rounded-full object-cover border border-gray-200 bg-white"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="w-20 h-20 rounded-full bg-gray-200 border border-gray-200 inline-block" />
                                  )}
                                  <span>{supplierName}</span>
                                </span>
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-sm text-gray-600">{order.items.length} 項商品</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleComplaintClick(order)}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center space-x-2"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>聯絡供應商</span>
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingInvoice === order.id}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {downloadingInvoice === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span>收據</span>
                          </button>
                          <button
                            onClick={() =>
                              setExpandedOrderId((current) => (current === order.id ? null : order.id))
                            }
                            className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                <span className="text-sm">收合</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                <span className="text-sm">查看詳情</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        {/* Order Items */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">商品清單</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                                    <p className="text-xs text-gray-600">
                                      數量：{item.quantity} / {item.unit || '單位'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.totalPrice)}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    單價：{formatCurrency(item.unitPrice)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Information */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            送貨地址
                          </h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {formatAddress(getResolvedAddress(order))}
                          </p>
                          <div className="mt-3 flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              送貨日期：
                              {order.deliveryDate
                                ? formatDeliveryDate(new Date(order.deliveryDate as any))
                                : '未指定'}
                            </span>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">備註</h4>
                            <p className="text-sm text-gray-600">{order.notes}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complaint Modal */}
      {selectedOrder && (
        <ComplaintModal
          orderId={selectedOrder.id}
          supplierId={(selectedOrder as any).supplier || selectedOrder.supplierId || ''}
          supplierCompanyName={(selectedOrder as any).supplier || selectedOrder.supplierId || ''}
          isOpen={complaintModalOpen}
          onClose={() => {
            setComplaintModalOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleComplaintSubmit}
        />
      )}
    </div>
  );
}