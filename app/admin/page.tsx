'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { t } from '@/lib/translate';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Order {
  id: string;
  restaurantName?: string;
  status: string;
  totalAmount: number;
  items: any[];
  createdAt: any;
}

export default function AdminDashboard() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total members
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const membersCount = usersSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.role !== 'admin' && data.role !== 'supplier'; // Only count regular members
        }).length;
        setTotalMembers(membersCount);

        // Fetch recent orders
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        const allOrders = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            restaurantName: data.restaurantName || data.userEmail || 'Unknown',
            status: data.status || 'pending',
            totalAmount: data.totalAmount || 0,
            items: data.items || [],
            createdAt: data.createdAt
          };
        });
        
        // Sort by createdAt descending and take first 3
        const sortedOrders = allOrders.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        }).slice(0, 3);
        
        setRecentOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: t('Total Members'),
      value: totalMembers.toLocaleString(),
      change: '-',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: 'up',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <div className="flex items-center">
                  <TrendingUp className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('Recent Orders')}</h2>
              <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                {t('View All Orders →')}
              </Link>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{t('Loading...')}</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('No recent orders')}</p>
                </div>
              ) : (
                recentOrders.map((order) => {
                  const orderDate = order.createdAt?.toDate?.() ? 
                    order.createdAt.toDate().toLocaleDateString() : 
                    '-';
                  const itemsCount = order.items?.length || 0;
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.id.substring(0, 12)}...</p>
                          <p className="text-sm text-gray-600">{order.restaurantName}</p>
                          <p className="text-sm text-gray-500">{orderDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{itemsCount} {t('items')}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {t(order.status)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
} 