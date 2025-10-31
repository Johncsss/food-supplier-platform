'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Edit, Trash2, X, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';

interface PerformanceData {
  date: string;
  amount: number;
  commission: number;
  orders: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  commissionRate: number;
  totalSales: number;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export default function SalesTeamMembersPage() {
  const { firebaseUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performancePeriod, setPerformancePeriod] = useState<'day' | 'month' | 'year'>('month');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    commissionRate: 0,
    password: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Fetch members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      if (!firebaseUser) return;
      
      setIsLoading(true);
      try {
        const membersQuery = query(
          collection(db, 'salesMembers'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(membersQuery);
        const membersData: Member[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Member));
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members:', error);
        alert('載入成員資料失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [firebaseUser]);

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      if (editingMember) {
        // Update existing member (TODO: implement update API)
        alert('更新功能即將推出');
      } else {
        // Create new member with Firebase Auth and Firestore
        const response = await fetch('/api/create-sales-member', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            position: formData.position,
            commissionRate: formData.commissionRate,
            password: formData.password,
            salesTeamId: firebaseUser?.uid || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create sales member');
        }

        const result = await response.json();
        
        // Add to local state
        const newMember: Member = {
          id: result.memberId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          commissionRate: formData.commissionRate,
          totalSales: 0,
          status: formData.status,
          joinedDate: new Date().toISOString().split('T')[0],
        };
        setMembers([newMember, ...members]);
        
        alert('銷售員已成功建立！');
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        commissionRate: 0,
        password: '',
        status: 'active',
      });
      setEditingMember(null);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error creating sales member:', error);
      alert('建立銷售員失敗: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      position: member.position,
      commissionRate: member.commissionRate,
      password: '',
      status: member.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('確定要刪除此成員嗎？')) {
      setMembers(members.filter(member => member.id !== memberId));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      commissionRate: 0,
      password: '',
      status: 'active',
    });
  };

  const handleViewPerformance = (member: Member) => {
    setSelectedMember(member);
    setShowPerformanceModal(true);
  };

  // Mock performance data - replace with real data from your database
  const getPerformanceData = (period: 'day' | 'month' | 'year'): PerformanceData[] => {
    if (period === 'day') {
      return [
        { date: '2025-10-10', amount: 5000, commission: 250, orders: 3 },
        { date: '2025-10-09', amount: 8000, commission: 400, orders: 5 },
        { date: '2025-10-08', amount: 3000, commission: 150, orders: 2 },
      ];
    } else if (period === 'month') {
      return [
        { date: '2025-10', amount: 50000, commission: 2500, orders: 35 },
        { date: '2025-09', amount: 45000, commission: 2250, orders: 30 },
        { date: '2025-08', amount: 55000, commission: 2750, orders: 40 },
      ];
    } else {
      return [
        { date: '2025', amount: 150000, commission: 7500, orders: 105 },
        { date: '2024', amount: 120000, commission: 6000, orders: 85 },
      ];
    }
  };

  const performanceData = getPerformanceData(performancePeriod);
  const totalEarnings = performanceData.reduce((sum, data) => sum + data.commission, 0);
  const totalSales = performanceData.reduce((sum, data) => sum + data.amount, 0);
  const totalOrders = performanceData.reduce((sum, data) => sum + data.orders, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">團隊成員</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理您的團隊成員
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增銷售員
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總成員數</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{members.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">活躍成員</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {members.filter(m => m.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總銷售額</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                HKD ${members.reduce((sum, m) => sum + m.totalSales, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <input
          type="text"
          placeholder="搜尋成員姓名、電子郵件或電話..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  成員姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  職位
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  佣金率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  銷售額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加入日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">暫無成員資料</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      新增第一位銷售員
                    </button>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr 
                    key={member.id} 
                    onClick={() => handleViewPerformance(member)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {member.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-600">{member.commissionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">HKD ${member.totalSales.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status === 'active' ? '活躍' : '停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.joinedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMember(member);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(member.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMember ? '編輯銷售員' : '新增銷售員'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="請輸入姓名"
                />
              </div>

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  職位 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="position"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例如：銷售專員、銷售經理"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="example@company.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  聯絡電話 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1234-5678"
                />
              </div>

              {/* Commission Rate */}
              <div>
                <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-2">
                  佣金率 (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="commissionRate"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例如：5 或 10.5"
                />
                <p className="mt-1 text-xs text-gray-500">設定此銷售員的佣金百分比</p>
              </div>

              {/* Password - Only show when creating new member */}
              {!editingMember && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    登入密碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    required={!editingMember}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="至少6個字符"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">此密碼用於銷售員登入個人頁面</p>
                </div>
              )}

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  狀態
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">活躍</option>
                  <option value="inactive">停用</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '處理中...' : (editingMember ? '更新' : '新增')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedMember.name} 的業績報告
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedMember.position} | 佣金率: {selectedMember.commissionRate}%
                </p>
              </div>
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Period Selector */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPerformancePeriod('day')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      performancePeriod === 'day'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    按日
                  </button>
                  <button
                    onClick={() => setPerformancePeriod('month')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      performancePeriod === 'month'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    按月
                  </button>
                  <button
                    onClick={() => setPerformancePeriod('year')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      performancePeriod === 'year'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
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

              {/* Performance Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      {performanceData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{data.date}</span>
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
                            <div className="text-sm text-gray-900">
                              HKD ${(data.amount / data.orders).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
