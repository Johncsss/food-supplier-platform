'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/translate';
import { Users, Mail, Phone, Award, Plus, Search, Edit, Trash2, X, TrendingUp, DollarSign, Package, Calendar, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';

interface SalesTeam {
  id: string;
  teamName: string;
  teamLeader: string;
  phone: string;
  email: string;
  memberCount: number;
  status: 'active' | 'inactive';
  createdDate: string;
  totalSales: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  commissionRate: number;
  totalSales: number;
  status: 'active' | 'inactive';
}

export default function SalesTeamPage() {
  const { firebaseUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<SalesTeam[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<SalesTeam | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SalesTeam | null>(null);
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberPerformanceModal, setShowMemberPerformanceModal] = useState(false);
  const [memberPerformancePeriod, setMemberPerformancePeriod] = useState<'day' | 'month' | 'year'>('month');
  const [showMemberTransactions, setShowMemberTransactions] = useState(false);
  const [selectedPeriodData, setSelectedPeriodData] = useState<any>(null);
  const [formData, setFormData] = useState({
    teamName: '',
    teamLeader: '',
    phone: '',
    email: '',
    password: '',
    newPassword: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Fetch sales teams from Firestore
  useEffect(() => {
    const fetchTeams = async () => {
      if (!firebaseUser) return;
      
      setIsLoading(true);
      try {
        const teamsQuery = query(
          collection(db, 'salesTeams'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(teamsQuery);
        const teamsData: SalesTeam[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            teamName: data.teamName || '',
            teamLeader: data.teamLeader || '',
            phone: data.phone || '',
            email: data.email || '',
            memberCount: data.memberCount || 0,
            status: data.status || 'active',
            createdDate: data.createdAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            totalSales: data.totalSales || 0,
          } as SalesTeam;
        });
        setTeams(teamsData);
        console.log('Fetched sales teams:', teamsData);
      } catch (error) {
        console.error('Error fetching sales teams:', error);
        alert('載入銷售團隊資料失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [firebaseUser]);

  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.teamLeader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `HKD$ ${amount.toLocaleString()}`;
  };

  const totalTeamSales = teams.reduce((sum, team) => sum + team.totalSales, 0);
  const activeTeams = teams.filter(t => t.status === 'active').length;
  const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      if (editingTeam) {
        // Update existing team
        const updateData: any = {
          teamName: formData.teamName,
          teamLeader: formData.teamLeader,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
        };

        // If password change is requested, include new password
        if (showPasswordChange && formData.newPassword) {
          updateData.newPassword = formData.newPassword;
        }

        const response = await fetch('/api/update-sales-team', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: editingTeam.id,
            ...updateData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update sales team');
        }

        setTeams(teams.map(team => 
          team.id === editingTeam.id
            ? {
                ...team,
                teamName: formData.teamName,
                teamLeader: formData.teamLeader,
                phone: formData.phone,
                email: formData.email,
                status: formData.status,
                // Keep existing memberCount
              }
            : team
        ));

        if (showPasswordChange && formData.newPassword) {
          alert('銷售團隊已更新，密碼已更改！');
        } else {
          alert('銷售團隊已更新！');
        }
      } else {
        // Create new team with Firebase Auth account
        const response = await fetch('/api/create-sales-team', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamName: formData.teamName,
            teamLeader: formData.teamLeader,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            status: formData.status,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create sales team');
        }

        const result = await response.json();

        const newTeam: SalesTeam = {
          id: result.teamId,
          teamName: formData.teamName,
          teamLeader: formData.teamLeader,
          phone: formData.phone,
          email: formData.email,
          memberCount: 0, // Will be updated when members are added
          status: formData.status,
          createdDate: new Date().toISOString().split('T')[0],
          totalSales: 0,
        };

        setTeams([newTeam, ...teams]); // Add to beginning of list
        alert('銷售團隊已成功建立！');
      }
      
      // Reset form and close modal
      setFormData({
        teamName: '',
        teamLeader: '',
        phone: '',
        email: '',
        password: '',
        newPassword: '',
        status: 'active',
      });
      setEditingTeam(null);
      setShowPasswordChange(false);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error creating sales team:', error);
      alert('建立銷售團隊失敗: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTeam = (team: SalesTeam) => {
    setEditingTeam(team);
    setFormData({
      teamName: team.teamName,
      teamLeader: team.teamLeader,
      phone: team.phone,
      email: team.email,
      password: '',
      newPassword: '',
      status: team.status,
    });
    setShowPasswordChange(false);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('確定要刪除此團隊嗎？此操作將同時刪除該團隊的 Firebase 帳戶，且無法復原。')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-sales-team', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete sales team');
      }

      // Remove from local state
      setTeams(teams.filter(team => team.id !== teamId));
      alert('銷售團隊已成功刪除！');
    } catch (error: any) {
      console.error('Error deleting sales team:', error);
      alert('刪除銷售團隊失敗: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    setShowPasswordChange(false);
    setFormData({
      teamName: '',
      teamLeader: '',
      phone: '',
      email: '',
      password: '',
      newPassword: '',
      status: 'active',
    });
  };

  const handleViewTeamDetails = async (team: SalesTeam) => {
    setSelectedTeam(team);
    setShowTeamDetailsModal(true);
    setLoadingMembers(true);
    
    try {
      // Fetch team members from Firestore
      const membersQuery = query(
        collection(db, 'salesMembers'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(membersQuery);
      
      // Filter members by team's Firebase UID
      const teamFirebaseUid = team.id; // This might need to be the firebaseUid field
      
      // First, get the team's firebaseUid from the document
      const teamDoc = await getDocs(query(collection(db, 'salesTeams')));
      let actualFirebaseUid = '';
      teamDoc.forEach(doc => {
        if (doc.id === team.id) {
          actualFirebaseUid = doc.data().firebaseUid;
        }
      });
      
      const membersData: TeamMember[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.salesTeamId === actualFirebaseUid) {
          membersData.push({
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            position: data.position || '',
            commissionRate: data.commissionRate || 0,
            totalSales: data.totalSales || 0,
            status: data.status || 'active',
          });
        }
      });
      
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Error fetching team members:', error);
      alert('載入團隊成員失敗');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewMemberPerformance = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberPerformanceModal(true);
  };

  // Mock performance data for selected member
  const getMemberPerformanceData = (period: 'day' | 'month' | 'year') => {
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

  const memberPerformanceData = getMemberPerformanceData(memberPerformancePeriod);
  const memberTotalEarnings = memberPerformanceData.reduce((sum, data) => sum + data.commission, 0);
  const memberTotalSales = memberPerformanceData.reduce((sum, data) => sum + data.amount, 0);
  const memberTotalOrders = memberPerformanceData.reduce((sum, data) => sum + data.orders, 0);

  const handleViewPeriodTransactions = (data: any) => {
    setSelectedPeriodData(data);
    setShowMemberTransactions(true);
  };

  // Mock transaction data
  const getTransactionsForPeriod = () => {
    return [
      { id: '1', date: '2025-10-10', customerName: '餐廳 A', amount: 2000, commission: 100, status: 'completed' },
      { id: '2', date: '2025-10-10', customerName: '餐廳 B', amount: 1500, commission: 75, status: 'completed' },
      { id: '3', date: '2025-10-10', customerName: '餐廳 C', amount: 1500, commission: 75, status: 'pending' },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">銷售團隊</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理您的銷售團隊成員和業績
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          建立團隊
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">團隊數量</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{activeTeams}</p>
              <p className="mt-1 text-sm text-gray-500">活躍團隊</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總銷售額</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalTeamSales > 0 ? formatCurrency(totalTeamSales) : 'HKD$ 0'}
              </p>
              <p className="mt-1 text-sm text-gray-500">所有團隊</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">團隊成員總數</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalMembers}</p>
              <p className="mt-1 text-sm text-gray-500">所有成員</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋團隊名稱或團隊負責人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Sales Teams Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  團隊名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  團隊負責人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  成員數量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建立日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總銷售額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <tr 
                    key={team.id} 
                    onClick={() => handleViewTeamDetails(team)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {team.teamName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="text-sm font-medium text-gray-900">{team.teamLeader}</div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone className="w-3 h-3 mr-1" />
                          {team.phone}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          {team.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{team.memberCount} 人</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{team.createdDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(team.totalSales)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          team.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {team.status === 'active' ? '活躍' : '停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTeam(team);
                          }}
                          className="text-primary-600 hover:text-primary-900" 
                          title="編輯"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    目前沒有任何銷售團隊
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateTeam}>
                {/* Modal Header */}
                <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingTeam ? '編輯團隊' : '建立新團隊'}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="bg-white px-6 py-6 space-y-4">
                  {/* Team Name */}
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                      團隊名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      required
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="例如：台北團隊、香港團隊"
                    />
                  </div>

                  {/* Team Leader */}
                  <div>
                    <label htmlFor="teamLeader" className="block text-sm font-medium text-gray-700 mb-2">
                      團隊負責人 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="teamLeader"
                      required
                      value={formData.teamLeader}
                      onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="輸入負責人姓名"
                    />
                  </div>

                  {/* Phone Number */}
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
                      disabled={!!editingTeam}
                    />
                    {editingTeam && (
                      <p className="mt-1 text-xs text-gray-500">電子郵件不可修改</p>
                    )}
                  </div>

                  {/* Password - Only show when creating new team */}
                  {!editingTeam && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        登入密碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        required={!editingTeam}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="至少6個字符"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">此密碼用於團隊登入系統</p>
                    </div>
                  )}

                  {/* Password Change - Only show when editing team */}
                  {editingTeam && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          更改密碼
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPasswordChange(!showPasswordChange)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {showPasswordChange ? '取消更改' : '更改密碼'}
                        </button>
                      </div>
                      
                      {showPasswordChange && (
                        <input
                          type="password"
                          id="newPassword"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="新密碼 (至少6個字符)"
                          minLength={6}
                        />
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {showPasswordChange ? '輸入新密碼以更改團隊登入密碼' : '點擊「更改密碼」來更新登入密碼'}
                      </p>
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
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-transparent rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? '處理中...' : (editingTeam ? '更新團隊' : '建立團隊')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamDetailsModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTeam.teamName} - 團隊詳情
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  團隊負責人: {selectedTeam.teamLeader}
                </p>
              </div>
              <button
                onClick={() => setShowTeamDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Team Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">團隊資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">電子郵件:</span>
                    <span className="text-sm text-gray-900">{selectedTeam.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">聯絡電話:</span>
                    <span className="text-sm text-gray-900">{selectedTeam.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">成員數量:</span>
                    <span className="text-sm text-gray-900">{selectedTeam.memberCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">總銷售額:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(selectedTeam.totalSales)}</span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">團隊成員</h3>
                {loadingMembers ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">載入中...</p>
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            姓名
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            職位
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            聯絡方式
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            佣金率
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            總銷售額
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teamMembers.map((member) => (
                          <tr 
                            key={member.id} 
                            onClick={() => handleViewMemberPerformance(member)}
                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{member.position}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900 flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {member.email}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {member.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-primary-600">{member.commissionRate}%</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">HKD ${member.totalSales.toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                member.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {member.status === 'active' ? '活躍' : '停用'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">此團隊暫無成員</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Performance Modal */}
      {showMemberPerformanceModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
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
                onClick={() => setShowMemberPerformanceModal(false)}
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
                    onClick={() => setMemberPerformancePeriod('day')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      memberPerformancePeriod === 'day'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    按日
                  </button>
                  <button
                    onClick={() => setMemberPerformancePeriod('month')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      memberPerformancePeriod === 'month'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    按月
                  </button>
                  <button
                    onClick={() => setMemberPerformancePeriod('year')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      memberPerformancePeriod === 'year'
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
                        HKD ${memberTotalEarnings.toLocaleString()}
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
                        HKD ${memberTotalSales.toLocaleString()}
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
                      <p className="text-2xl font-bold text-gray-900 mt-1">{memberTotalOrders}</p>
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
                      {memberPerformanceData.map((data, index) => (
                        <tr 
                          key={index} 
                          onClick={() => handleViewPeriodTransactions(data)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
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
                            HKD ${memberTotalSales.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            HKD ${memberTotalEarnings.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{memberTotalOrders}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            HKD ${memberTotalOrders > 0 ? (memberTotalSales / memberTotalOrders).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
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

      {/* Transaction Details Modal (Third Level) */}
      {showMemberTransactions && selectedPeriodData && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                交易明細 - {selectedMember.name} - {selectedPeriodData.date}
              </h2>
              <button
                onClick={() => setShowMemberTransactions(false)}
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
                      {getTransactionsForPeriod().map((transaction) => (
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
  );
}

