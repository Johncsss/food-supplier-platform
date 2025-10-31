'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  Package,
  Activity,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface Member {
  id: string;
  name: string;
  restaurantName: string;
  email: string;
  phone: string;
  membershipStatus: 'active' | 'inactive' | 'expired';
  membershipPlan: string;
  joinDate: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    restaurantName: '',
    email: '',
    phone: '',
    membershipStatus: 'active' as 'active' | 'inactive' | 'expired',
    membershipPlan: '',
    address: ''
  });
  const [addForm, setAddForm] = useState({
    name: '',
    restaurantName: '',
    email: '',
    password: '',
    phone: '',
    membershipStatus: 'active' as 'active' | 'inactive' | 'expired',
    membershipPlan: '基本方案',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const fetchedMembers: Member[] = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            // Hide admin users from the members list
            return data.role !== 'admin';
          })
          .map((doc) => {
            const data = doc.data();
            return {
              id: data.id || doc.id,
              name: data.name || '',
              restaurantName: data.restaurantName || '',
              email: data.email || '',
              phone: data.phone || '',
              membershipStatus: data.membershipStatus || 'inactive',
              membershipPlan: data.membershipPlan || '基本方案',
              joinDate: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
              address: typeof data.address === 'string' ? data.address : 
                       data.address ? `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.zipCode}` : '',
              totalOrders: data.totalOrders || 0,
              totalSpent: data.totalSpent || 0,
            };
          });
        setMembers(fetchedMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.membershipStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'inactive':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'expired':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活躍';
      case 'inactive':
        return '非活躍';
      case 'expired':
        return '已過期';
      default:
        return '未知';
    }
  };

  const membershipStats = {
    total: members.length,
    active: members.filter(m => m.membershipStatus === 'active').length,
    inactive: members.filter(m => m.membershipStatus === 'inactive').length,
    expired: members.filter(m => m.membershipStatus === 'expired').length,
  };

  const totalRevenue = members.reduce((sum, member) => sum + member.totalSpent, 0);
  const totalOrders = members.reduce((sum, member) => sum + member.totalOrders, 0);

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      restaurantName: member.restaurantName,
      email: member.email,
      phone: member.phone,
      membershipStatus: member.membershipStatus,
      membershipPlan: member.membershipPlan,
      address: member.address
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (selectedMember && editForm.name && editForm.restaurantName && editForm.email && editForm.phone && editForm.membershipPlan && editForm.address) {
      try {
        setIsSubmitting(true);
        setError(null);

        // Update in Firestore
        const userRef = doc(db, 'users', selectedMember.id);
        await updateDoc(userRef, {
          name: editForm.name,
          restaurantName: editForm.restaurantName,
          email: editForm.email,
          phone: editForm.phone,
          membershipStatus: editForm.membershipStatus,
          membershipPlan: editForm.membershipPlan,
          address: editForm.address,
          updatedAt: serverTimestamp()
        });

        // Update local state
        const updatedMembers = members.map(member =>
          member.id === selectedMember.id
            ? {
                ...member,
                name: editForm.name,
                restaurantName: editForm.restaurantName,
                email: editForm.email,
                phone: editForm.phone,
                membershipStatus: editForm.membershipStatus,
                membershipPlan: editForm.membershipPlan,
                address: editForm.address
              }
            : member
        );
        setMembers(updatedMembers);
        setShowEditModal(false);
        setSelectedMember(null);
      } catch (error: any) {
        console.error('Error updating member:', error);
        setError(error.message || '更新會員失敗');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAddMember = async () => {
    if (!addForm.name || !addForm.restaurantName || !addForm.email || !addForm.password || !addForm.phone || !addForm.membershipPlan) {
      setError('請填寫所有必填欄位');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, addForm.email, addForm.password);
      const firebaseUid = userCredential.user.uid;

      // Generate custom user ID
      const customUserId = `USER-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Create user document in Firestore
      const newMember = {
        id: customUserId,
        firebaseUid,
        name: addForm.name,
        restaurantName: addForm.restaurantName,
        email: addForm.email,
        phone: addForm.phone,
        membershipStatus: addForm.membershipStatus,
        membershipPlan: addForm.membershipPlan,
        address: addForm.address,
        totalOrders: 0,
        totalSpent: 0,
        membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', customUserId), newMember);

      // Add to local state
      const memberForDisplay: Member = {
        id: customUserId,
        name: addForm.name,
        restaurantName: addForm.restaurantName,
        email: addForm.email,
        phone: addForm.phone,
        membershipStatus: addForm.membershipStatus,
        membershipPlan: addForm.membershipPlan,
        joinDate: new Date().toISOString().split('T')[0],
        address: addForm.address,
        totalOrders: 0,
        totalSpent: 0
      };

      setMembers([memberForDisplay, ...members]);
      setShowAddModal(false);
      
      // Reset form
      setAddForm({
        name: '',
        restaurantName: '',
        email: '',
        password: '',
        phone: '',
        membershipStatus: 'active',
        membershipPlan: '基本方案',
        address: ''
      });
    } catch (error: any) {
      console.error('Error adding member:', error);
      setError(error.message || '新增會員失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mockMemberStats = {
    recentOrders: [
      { id: 'ORD-001', date: '2024-01-15', amount: 450.00, status: 'delivered' },
      { id: 'ORD-002', date: '2024-01-12', amount: 320.00, status: 'delivered' },
      { id: 'ORD-003', date: '2024-01-08', amount: 280.00, status: 'delivered' },
    ],
    membershipHistory: [
      { date: '2023-12-15', action: '方案升級', from: '基本方案', to: '專業方案' },
      { date: '2023-09-20', action: '付款', amount: 599.00 },
      { date: '2023-06-10', action: '會員續費', amount: 599.00 },
    ]
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入會員資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">會員管理</h1>
            <p className="text-gray-600">查看和管理所有食品供應商專業會員</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              新增會員
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="flex justify-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full md:w-96">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">總會員數</p>
                <p className="text-3xl font-bold text-gray-900">{membershipStats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋會員</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="按姓名、餐廳或電子郵件搜尋..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              會員 ({filteredMembers.length})
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>最後更新：{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  會員資訊
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡詳情
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  會員資格
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活動
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">ID: {member.id}</div>
                        <div className="text-sm text-gray-500">{member.restaurantName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{member.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 truncate max-w-xs">{member.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">{member.membershipPlan}</div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.membershipStatus)}`}>
                        {getStatusIcon(member.membershipStatus)}
                        <span className="ml-1">{getStatusText(member.membershipStatus)}</span>
                      </span>
                      <div className="text-sm text-gray-500">加入日期：{member.joinDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">{member.totalOrders} 訂單</div>
                      <div className="text-sm text-gray-500">消費 ${member.totalSpent.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">平均：${(member.totalSpent / member.totalOrders).toFixed(2)}/訂單</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewMember(member)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                        title="查看詳情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditMember(member)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                        title="編輯會員"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">未找到會員</h3>
          <p className="text-gray-600">
            請調整搜尋條件或篩選器來找到您要找的內容。
          </p>
        </div>
      )}

      {/* View Member Modal */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">會員詳情</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Member Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">會員資訊</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">會員姓名</label>
                      <p className="text-lg font-medium text-gray-900">{selectedMember.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">會員ID</label>
                      <p className="text-sm text-gray-600">{selectedMember.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">餐廳名稱</label>
                      <p className="text-sm text-gray-900">{selectedMember.restaurantName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                      <p className="text-sm text-gray-900">{selectedMember.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">電話</label>
                      <p className="text-sm text-gray-900">{selectedMember.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">地址</label>
                      <p className="text-sm text-gray-900">{selectedMember.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">加入日期</label>
                      <p className="text-sm text-gray-900">{selectedMember.joinDate}</p>
                    </div>
                  </div>
                </div>

                {/* Membership & Activity */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">會員資格與活動</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">會員方案</label>
                      <p className="text-lg font-medium text-gray-900">{selectedMember.membershipPlan}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">狀態</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedMember.membershipStatus)}`}>
                        {getStatusIcon(selectedMember.membershipStatus)}
                        <span className="ml-1">{getStatusText(selectedMember.membershipStatus)}</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">總訂單數</label>
                      <p className="text-lg font-bold text-gray-900">{selectedMember.totalOrders}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">總消費</label>
                      <p className="text-lg font-bold text-gray-900">${selectedMember.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">平均訂單金額</label>
                      <p className="text-sm text-gray-900">${(selectedMember.totalSpent / selectedMember.totalOrders).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">最近訂單</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {mockMemberStats.recentOrders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.id}</p>
                            <p className="text-xs text-gray-500">{order.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${order.amount.toFixed(2)}</p>
                          <p className="text-xs text-green-600 capitalize">{order.status === 'delivered' ? '已送達' : order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Membership History */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">會員歷史</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {mockMemberStats.membershipHistory.map((history, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{history.action}</p>
                            <p className="text-xs text-gray-500">{history.date}</p>
                            {history.from && (
                              <p className="text-xs text-gray-500">{history.from} → {history.to}</p>
                            )}
                          </div>
                        </div>
                        {history.amount && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">${history.amount.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">新增會員</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">會員姓名 *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="請輸入會員姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">餐廳名稱 *</label>
                  <input
                    type="text"
                    value={addForm.restaurantName}
                    onChange={(e) => setAddForm({...addForm, restaurantName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="請輸入餐廳名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件 *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="example@restaurant.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密碼 *</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="至少6個字元"
                  />
                  <p className="text-xs text-gray-500 mt-1">密碼至少需要6個字元</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電話 *</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">會員方案 *</label>
                  <select
                    value={addForm.membershipPlan}
                    onChange={(e) => setAddForm({...addForm, membershipPlan: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="專業方案">專業方案</option>
                    <option value="高級方案">高級方案</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">會員狀態</label>
                  <select
                    value={addForm.membershipStatus}
                    onChange={(e) => setAddForm({...addForm, membershipStatus: e.target.value as 'active' | 'inactive' | 'expired'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">活躍</option>
                    <option value="inactive">非活躍</option>
                    <option value="expired">已過期</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                  <textarea
                    value={addForm.address}
                    onChange={(e) => setAddForm({...addForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="請輸入完整地址"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '新增中...' : '新增會員'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">編輯會員</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">會員姓名</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">餐廳名稱</label>
                  <input
                    type="text"
                    value={editForm.restaurantName}
                    onChange={(e) => setEditForm({...editForm, restaurantName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電話</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">會員方案</label>
                  <select
                    value={editForm.membershipPlan}
                    onChange={(e) => setEditForm({...editForm, membershipPlan: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">選擇方案</option>
                    <option value="專業方案">專業方案</option>
                    <option value="高級方案">高級方案</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">會員狀態</label>
                  <select
                    value={editForm.membershipStatus}
                    onChange={(e) => setEditForm({...editForm, membershipStatus: e.target.value as 'active' | 'inactive' | 'expired'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">活躍</option>
                    <option value="inactive">非活躍</option>
                    <option value="expired">已過期</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '儲存中...' : '儲存變更'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 