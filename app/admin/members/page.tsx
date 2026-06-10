'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Package,
  UserPlus,
  Coins,
  Trash2,
  PackagePlus,
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

interface Member {
  id: string;
  name: string;
  restaurantName: string;
  email: string;
  phone: string;
  membershipStatus: 'active' | 'inactive' | 'expired';
  membershipPlan?: string;
  joinDate: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  role?: string | null;
  firebaseUid?: string | null;
  // Optional nested info used throughout this page
  companyInfo?: {
    nameEn?: string;
    nameZh?: string;
    addressEn?: string;
    addressZh?: string;
  };
  shopInfo?: {
    nameEn?: string;
    nameZh?: string;
    addressEn?: string;
    addressZh?: string;
  };
  contactInfo?: {
    name?: string;
    title?: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  accountingContact?: {
    name?: string;
    title?: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  businessInfo?: {
    registrationNumber?: string;
    nature?: string;
    companyStatus?: string;
    propertyStatus?: string;
  };
  businessRegistrationFileUrl?: string;
  staffName?: string;
}

interface OrderSummary {
  id: string;
  createdAt: Date | null;
  totalAmount: number;
  status: string;
}

interface PointTransactionSummary {
  id: string;
  createdAt: Date | null;
  points: number;
  amount?: number;
  type?: string;
  status?: string;
  description?: string;
  newBalance?: number;
  previousBalance?: number;
  receiptUrl?: string;
  planId?: string | null;
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
    companyNameEn: '',
    companyNameZh: '',
    companyAddressEn: '',
    companyAddressZh: '',
    shopNameEn: '',
    shopNameZh: '',
    shopAddressEn: '',
    shopAddressZh: '',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactFax: '',
    contactEmail: '',
    accountingName: '',
    accountingTitle: '',
    accountingPhone: '',
    accountingFax: '',
    accountingEmail: '',
    businessRegNumber: '',
    businessNature: '',
    companyStatus: '',
    propertyStatus: '',
    membershipStatus: 'active' as 'active' | 'inactive',
    password: '',
    confirmPassword: '',
    businessRegistrationFile: null as File | null,
    businessRegistrationFileUrl: '',
    staffName: '',
  });
  const [addForm, setAddForm] = useState({
    companyNameEn: '',
    companyNameZh: '',
    companyAddressEn: '',
    companyAddressZh: '',
    shopNameEn: '',
    shopNameZh: '',
    shopAddressEn: '',
    shopAddressZh: '',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactFax: '',
    contactEmail: '',
    accountingName: '',
    accountingTitle: '',
    accountingPhone: '',
    accountingFax: '',
    accountingEmail: '',
    businessRegNumber: '',
    businessNature: '',
    companyStatus: '',
    propertyStatus: '',
    password: '',
    membershipStatus: 'active' as 'active' | 'inactive',
    businessRegistrationFile: null as File | null,
    staffName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberOrdersLoading, setMemberOrdersLoading] = useState(false);
  const [memberOrderStats, setMemberOrderStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
  });
  const [memberRecentOrders, setMemberRecentOrders] = useState<OrderSummary[]>([]);
  const [memberPointsLoading, setMemberPointsLoading] = useState(false);
  const [memberPointTransactions, setMemberPointTransactions] = useState<PointTransactionSummary[]>([]);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [salesNames, setSalesNames] = useState<string[]>([]);
  const [loadingSalesNames, setLoadingSalesNames] = useState(false);

  // Fetch sales names from Firestore
  const fetchSalesNames = async () => {
    try {
      setLoadingSalesNames(true);
      const salesMembersRef = collection(db, 'salesMembers');
      const snapshot = await getDocs(salesMembersRef);
      const names: string[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const name = data.name;
        if (name && typeof name === 'string' && name.trim() && !names.includes(name.trim())) {
          names.push(name.trim());
        }
      });
      // Sort names alphabetically
      names.sort();
      setSalesNames(names);
    } catch (error) {
      console.error('Error fetching sales names:', error);
    } finally {
      setLoadingSalesNames(false);
    }
  };

  // Fetch members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        // Order by createdAt so newest members appear first
        const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(usersQuery);
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
              joinDate:
                data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] ||
                new Date().toISOString().split('T')[0],
              address:
                typeof data.address === 'string'
                  ? data.address
                  : data.address
                  ? `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.zipCode}`
                  : '',
              totalOrders: data.totalOrders || 0,
              totalSpent: data.totalSpent || 0,
              role: data.role || null,
              firebaseUid: data.firebaseUid || data.firebaseUserId || null,
              // Include nested data structures
              companyInfo: data.companyInfo || undefined,
              shopInfo: data.shopInfo || undefined,
              contactInfo: data.contactInfo || undefined,
              accountingContact: data.accountingContact || undefined,
              businessInfo: data.businessInfo || undefined,
              businessRegistrationFileUrl: data.businessRegistrationFileUrl && data.businessRegistrationFileUrl.trim() ? data.businessRegistrationFileUrl : undefined,
              staffName: data.staffName || '',
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
    fetchSalesNames();
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && member.membershipStatus === 'active') ||
      (statusFilter === 'inactive' && member.membershipStatus !== 'active');

    const isRestaurantMember =
      !member.role ||
      member.role === 'restaurant' ||
      member.role === 'member' ||
      member.role === 'customer';

    return matchesSearch && matchesStatus && isRestaurantMember;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
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
        return '有效';
      case 'inactive':
        return '未啟用';
      case 'expired':
        return '已到期';
      default:
        return '未知';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'confirmed':
        return '已確認';
      case 'processing':
        return '處理中';
      case 'shipped':
        return '已出貨';
      case 'delivered':
        return '已送達';
      case 'cancelled':
        return '已取消';
      default:
        return status || '未知';
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return '--';
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '--';
    }
    return `HK$ ${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPointsStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'pending':
        return '處理中';
      case 'rejected':
        return '已拒絕';
      case 'cancelled':
        return '已取消';
      case 'approved':
        return '已審核';
      default:
        return status || '未知';
    }
  };

  const membershipStats = {
    total: members.length,
    active: members.filter(m => m.membershipStatus === 'active').length,
    inactive: members.filter(m => m.membershipStatus === 'inactive').length,
    expired: members.filter(m => m.membershipStatus === 'expired').length,
  };

  const getRoleText = (role?: string | null) => {
    if (!role) return '餐廳';
    switch (role) {
      case 'admin':
        return '管理員';
      case 'supplier':
        return '供應商';
      case 'salesTeam':
        return '銷售團隊';
      case 'salesMember':
        return '銷售成員';
      default:
        return role || '餐廳';
    }
  };

  const totalRevenue = members.reduce((sum, member) => sum + member.totalSpent, 0);
  const totalOrders = members.reduce((sum, member) => sum + member.totalOrders, 0);

  useEffect(() => {
    if (!showViewModal || !selectedMember) {
      return;
    }

    const identifiers = Array.from(
      new Set(
        [selectedMember.id, selectedMember.firebaseUid].filter(
          (value): value is string => typeof value === 'string' && value.trim().length > 0,
        ),
      ),
    );

    const fetchMemberOrders = async () => {
      setMemberOrdersLoading(true);
      try {
        const ordersMap = new Map<string, OrderSummary>();
        let totalSpentAccumulator = 0;

        await Promise.all(
          identifiers.map(async (uid) => {
            const ordersQuery = query(collection(db, 'orders'), where('userId', '==', uid));
            const snapshot = await getDocs(ordersQuery);
            snapshot.docs.forEach((docSnap) => {
              if (ordersMap.has(docSnap.id)) {
                return;
              }
              const data = docSnap.data() as any;
              const createdAt =
                data.createdAt?.toDate?.() ||
                data.transactionDate?.toDate?.() ||
                data.deliveryDate?.toDate?.() ||
                null;
              const amount =
                typeof data.totalAmount === 'number'
                  ? data.totalAmount
                  : Number(data.totalAmount || 0);
              ordersMap.set(docSnap.id, {
                id: docSnap.id,
                createdAt,
                totalAmount: amount,
                status: data.status || 'pending',
              });
              totalSpentAccumulator += amount;
            });
          }),
        );

        const orders = Array.from(ordersMap.values()).sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });

        const derivedTotalSpent =
          orders.length > 0 ? totalSpentAccumulator : selectedMember.totalSpent || 0;

        setMemberOrderStats({
          totalOrders: orders.length > 0 ? orders.length : selectedMember.totalOrders || 0,
          totalSpent: Number(derivedTotalSpent.toFixed(2)),
        });
        setMemberRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch member orders:', error);
        setMemberOrderStats({
          totalOrders: selectedMember.totalOrders || 0,
          totalSpent: selectedMember.totalSpent || 0,
        });
        setMemberRecentOrders([]);
      } finally {
        setMemberOrdersLoading(false);
      }
    };

    const fetchPointTransactions = async () => {
      setMemberPointsLoading(true);
      try {
        const transactionMap = new Map<string, PointTransactionSummary>();

        await Promise.all(
          identifiers.map(async (uid) => {
            const transactionsQuery = query(
              collection(db, 'point_transactions'),
              where('userId', '==', uid),
            );
            const snapshot = await getDocs(transactionsQuery);
            snapshot.docs.forEach((docSnap) => {
              if (transactionMap.has(docSnap.id)) {
                return;
              }
              const data = docSnap.data() as any;
              const createdAt =
                data.transactionDate?.toDate?.() ||
                data.createdAt?.toDate?.() ||
                data.purchaseDate?.toDate?.() ||
                null;
              const points =
                typeof data.pointsPurchased === 'number'
                  ? data.pointsPurchased
                  : typeof data.points === 'number'
                    ? data.points
                    : typeof data.pointsAmount === 'number'
                      ? data.pointsAmount
                      : 0;
              const amount =
                typeof data.paymentAmount === 'number'
                  ? data.paymentAmount
                  : typeof data.amount === 'number'
                    ? data.amount
                    : undefined;
              transactionMap.set(docSnap.id, {
                id: docSnap.id,
                createdAt,
                points,
                amount,
                type: data.type || '',
                status: data.status || '',
                description: data.description || '',
                newBalance:
                  typeof data.newBalance === 'number' ? data.newBalance : undefined,
                previousBalance:
                  typeof data.previousBalance === 'number'
                    ? data.previousBalance
                    : undefined,
                receiptUrl: data.receiptUrl || '',
                planId: data.planId || null,
              });
            });
          }),
        );

        const transactions = Array.from(transactionMap.values()).sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });

        setMemberPointTransactions(transactions.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch point transactions:', error);
        setMemberPointTransactions([]);
      } finally {
        setMemberPointsLoading(false);
      }
    };

    fetchMemberOrders();
    fetchPointTransactions();
  }, [showViewModal, selectedMember]);

  const handleViewMember = async (member: Member) => {
    setShowViewModal(true);
    setMemberOrdersLoading(true);
    setMemberPointsLoading(true);
    
    // Fetch full member data from Firestore to ensure we have all fields including businessRegistrationFileUrl
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let fullMemberData: Member | null = null;
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const userId = userData.id || doc.id;
        const firebaseUid = userData.firebaseUid || userId;
        
        if (userId === member.id || firebaseUid === member.firebaseUid || firebaseUid === member.id) {
          fullMemberData = {
            ...member,
            businessRegistrationFileUrl:
              userData.businessRegistrationFileUrl && userData.businessRegistrationFileUrl.trim()
                ? userData.businessRegistrationFileUrl
                : undefined,
            businessInfo: userData.businessInfo || member.businessInfo,
            companyInfo: userData.companyInfo || member.companyInfo,
            shopInfo: userData.shopInfo || member.shopInfo,
            contactInfo: userData.contactInfo || member.contactInfo,
            accountingContact: userData.accountingContact || member.accountingContact,
            staffName: userData.staffName || member.staffName,
          };
        }
      });
      
      // Use full member data if found, otherwise use the member from list
      const memberToDisplay = fullMemberData || member;
      
      // Debug: log the member data to see if businessRegistrationFileUrl is present
      console.log('Viewing member:', {
        id: memberToDisplay.id,
        name: memberToDisplay.name,
        businessRegistrationFileUrl: memberToDisplay.businessRegistrationFileUrl,
        businessInfo: memberToDisplay.businessInfo,
      });
      
      setSelectedMember(memberToDisplay);
      setMemberOrderStats({
        totalOrders: memberToDisplay.totalOrders || 0,
        totalSpent: memberToDisplay.totalSpent || 0,
      });
      setMemberRecentOrders([]);
      setMemberPointTransactions([]);
    } catch (error) {
      console.error('Error fetching full member data:', error);
      // Fallback to using member from list if fetch fails
      setSelectedMember(member);
      setMemberOrderStats({
        totalOrders: member.totalOrders || 0,
        totalSpent: member.totalSpent || 0,
      });
      setMemberRecentOrders([]);
      setMemberPointTransactions([]);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    const confirmed = window.confirm(`確定要刪除「${member.name || '此會員'}」嗎？此操作無法復原。`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingMemberId(member.id);
      const isSelectedMember = selectedMember?.id === member.id;
      const isEditing = showEditModal && selectedMember?.id === member.id;
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '刪除會員失敗');
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));

      if (isSelectedMember) {
        setShowViewModal(false);
        setSelectedMember(null);
      }
      if (isEditing) {
        setShowEditModal(false);
      }
    } catch (error: any) {
      console.error('Error deleting member:', error);
      window.alert(error?.message || '刪除會員失敗，請稍後再試。');
    } finally {
      setDeletingMemberId(null);
    }
  };

  const updateEditFormField = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  const getString = (value: unknown): string => (typeof value === 'string' ? value : '');
  const handleEditMember = async (member: Member) => {
    setSelectedMember(member);
    // Fetch sales names when opening edit modal
    await fetchSalesNames();
    
    // Fetch member data to get staffName
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      let memberStaffName = '';
      
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const userId = userData.id || doc.id;
        const firebaseUid = userData.firebaseUid || userId;
        
        if (userId === member.id || firebaseUid === member.firebaseUid || firebaseUid === member.id) {
          memberStaffName = userData.staffName || '';
        }
      });
      
      setEditForm({
        companyNameEn: member.companyInfo?.nameEn || '',
        companyNameZh: member.companyInfo?.nameZh || '',
        companyAddressEn: member.companyInfo?.addressEn || member.address || '',
        companyAddressZh: member.companyInfo?.addressZh || '',
        shopNameEn: member.shopInfo?.nameEn || member.restaurantName || '',
        shopNameZh: member.shopInfo?.nameZh || '',
        shopAddressEn: member.shopInfo?.addressEn || member.address || '',
        shopAddressZh: member.shopInfo?.addressZh || '',
        contactName: member.contactInfo?.name || member.name || '',
        contactTitle: member.contactInfo?.title || '',
        contactPhone: member.contactInfo?.phone || member.phone || '',
        contactFax: member.contactInfo?.fax || '',
        contactEmail: member.contactInfo?.email || member.email || '',
        accountingName: member.accountingContact?.name || '',
        accountingTitle: member.accountingContact?.title || '',
        accountingPhone: member.accountingContact?.phone || '',
        accountingFax: member.accountingContact?.fax || '',
        accountingEmail: member.accountingContact?.email || '',
        businessRegNumber: getString(member.businessInfo?.registrationNumber),
        businessNature: getString(member.businessInfo?.nature),
        companyStatus: getString(member.businessInfo?.companyStatus),
        propertyStatus: getString(member.businessInfo?.propertyStatus),
        membershipStatus: member.membershipStatus === 'active' ? 'active' : 'inactive',
        password: '',
        confirmPassword: '',
        businessRegistrationFile: null,
        businessRegistrationFileUrl: member.businessRegistrationFileUrl || '',
        staffName: memberStaffName,
      });
    } catch (error) {
      console.error('Error fetching member data:', error);
      setEditForm({
        companyNameEn: member.companyInfo?.nameEn || '',
        companyNameZh: member.companyInfo?.nameZh || '',
        companyAddressEn: member.companyInfo?.addressEn || member.address || '',
        companyAddressZh: member.companyInfo?.addressZh || '',
        shopNameEn: member.shopInfo?.nameEn || member.restaurantName || '',
        shopNameZh: member.shopInfo?.nameZh || '',
        shopAddressEn: member.shopInfo?.addressEn || member.address || '',
        shopAddressZh: member.shopInfo?.addressZh || '',
        contactName: member.contactInfo?.name || member.name || '',
        contactTitle: member.contactInfo?.title || '',
        contactPhone: member.contactInfo?.phone || member.phone || '',
        contactFax: member.contactInfo?.fax || '',
        contactEmail: member.contactInfo?.email || member.email || '',
        accountingName: member.accountingContact?.name || '',
        accountingTitle: member.accountingContact?.title || '',
        accountingPhone: member.accountingContact?.phone || '',
        accountingFax: member.accountingContact?.fax || '',
        accountingEmail: member.accountingContact?.email || '',
        businessRegNumber: getString(member.businessInfo?.registrationNumber),
        businessNature: getString(member.businessInfo?.nature),
        companyStatus: getString(member.businessInfo?.companyStatus),
        propertyStatus: getString(member.businessInfo?.propertyStatus),
        membershipStatus: member.membershipStatus === 'active' ? 'active' : 'inactive',
        password: '',
        confirmPassword: '',
        businessRegistrationFile: null,
        businessRegistrationFileUrl: '',
        staffName: '',
      });
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (selectedMember) {
      if (editForm.password || editForm.confirmPassword) {
        if (editForm.password.length < 6) {
          setError('新密碼至少需要 6 個字元');
          return;
        }
        if (editForm.password !== editForm.confirmPassword) {
          setError('新密碼與確認密碼不一致');
          return;
        }
      }

      try {
        setIsSubmitting(true);
        setError(null);

        // Upload new business registration file if provided
        let businessRegistrationFileUrl = editForm.businessRegistrationFileUrl;
        if (editForm.businessRegistrationFile) {
          try {
            const { uploadDocument } = await import('@/lib/image-upload');
            const uploadResult = await uploadDocument(editForm.businessRegistrationFile, 'business_registrations');
            if (!uploadResult.success || !uploadResult.url) {
              throw new Error(uploadResult.error || '商業登記證上傳失敗');
            }
            businessRegistrationFileUrl = uploadResult.url;
          } catch (uploadError: any) {
            setError(uploadError?.message || '商業登記證上傳失敗');
            setIsSubmitting(false);
            return;
          }
        }

        const response = await fetch(`/api/admin/members/${selectedMember.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editForm.contactName,
            restaurantName: editForm.shopNameEn || editForm.shopNameZh,
            email: editForm.contactEmail,
            phone: editForm.contactPhone,
            address: editForm.shopAddressEn || editForm.shopAddressZh,
            companyInfo: {
              nameEn: editForm.companyNameEn,
              nameZh: editForm.companyNameZh,
              addressEn: editForm.companyAddressEn,
              addressZh: editForm.companyAddressZh,
            },
            shopInfo: {
              nameEn: editForm.shopNameEn,
              nameZh: editForm.shopNameZh,
              addressEn: editForm.shopAddressEn,
              addressZh: editForm.shopAddressZh,
            },
            contactInfo: {
              name: editForm.contactName,
              title: editForm.contactTitle,
              phone: editForm.contactPhone,
              fax: editForm.contactFax,
              email: editForm.contactEmail,
            },
            accountingContact: {
              name: editForm.accountingName,
              title: editForm.accountingTitle,
              phone: editForm.accountingPhone,
              fax: editForm.accountingFax,
              email: editForm.accountingEmail,
            },
            businessInfo: {
              registrationNumber: editForm.businessRegNumber,
              nature: editForm.businessNature,
              companyStatus: editForm.companyStatus,
              propertyStatus: editForm.propertyStatus,
            },
            membershipStatus: editForm.membershipStatus,
            password: editForm.password ? editForm.password : undefined,
            staffName: editForm.staffName,
            businessRegistrationFileUrl: businessRegistrationFileUrl,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || '更新會員失敗');
        }

        const updatedMembers = members.map((member) =>
          member.id === selectedMember.id
            ? {
                ...member,
                name: editForm.contactName,
                restaurantName: editForm.shopNameEn || editForm.shopNameZh,
                email: editForm.contactEmail,
                phone: editForm.contactPhone,
                membershipStatus: editForm.membershipStatus,
                address: editForm.shopAddressEn || editForm.shopAddressZh,
                companyInfo: {
                  nameEn: editForm.companyNameEn,
                  nameZh: editForm.companyNameZh,
                  addressEn: editForm.companyAddressEn,
                  addressZh: editForm.companyAddressZh,
                },
                shopInfo: {
                  nameEn: editForm.shopNameEn,
                  nameZh: editForm.shopNameZh,
                  addressEn: editForm.shopAddressEn,
                  addressZh: editForm.shopAddressZh,
                },
                contactInfo: {
                  name: editForm.contactName,
                  title: editForm.contactTitle,
                  phone: editForm.contactPhone,
                  fax: editForm.contactFax,
                  email: editForm.contactEmail,
                },
                accountingContact: {
                  name: editForm.accountingName,
                  title: editForm.accountingTitle,
                  phone: editForm.accountingPhone,
                  fax: editForm.accountingFax,
                  email: editForm.accountingEmail,
                },
                businessInfo: {
                  registrationNumber: editForm.businessRegNumber,
                  nature: editForm.businessNature,
                  companyStatus: editForm.companyStatus,
                  propertyStatus: editForm.propertyStatus,
                },
                businessRegistrationFileUrl: businessRegistrationFileUrl,
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

  const updateAddFormField = (field: keyof typeof addForm, value: string) => {
    setAddForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddMember = async () => {
    const requiredFields: Array<keyof typeof addForm> = [
      'companyNameEn',
      'companyAddressEn',
      'shopNameEn',
      'shopAddressEn',
      'contactName',
      'contactTitle',
      'contactPhone',
      'contactEmail',
      'businessRegNumber',
      'businessNature',
      'propertyStatus',
      'password',
      'staffName',
    ];

    const missingField = requiredFields.find((field) => {
      const value = addForm[field];
      if (field === 'businessRegistrationFile') {
        return false; // File is optional
      }
      return !value || (typeof value === 'string' && !value.trim());
    });
    if (missingField) {
      setError('請填寫所有標示為 * 的必填欄位');
      return;
    }

    // Validate password length
    if (addForm.password.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Call API endpoint to create member using Admin SDK
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyNameEn: addForm.companyNameEn,
          companyNameZh: addForm.companyNameZh,
          companyAddressEn: addForm.companyAddressEn,
          companyAddressZh: addForm.companyAddressZh,
          shopNameEn: addForm.shopNameEn,
          shopNameZh: addForm.shopNameZh,
          shopAddressEn: addForm.shopAddressEn,
          shopAddressZh: addForm.shopAddressZh,
          contactName: addForm.contactName,
          contactTitle: addForm.contactTitle,
          contactPhone: addForm.contactPhone,
          contactFax: addForm.contactFax,
          contactEmail: addForm.contactEmail,
          accountingName: addForm.accountingName,
          accountingTitle: addForm.accountingTitle,
          accountingPhone: addForm.accountingPhone,
          accountingFax: addForm.accountingFax,
          accountingEmail: addForm.accountingEmail,
          businessRegNumber: addForm.businessRegNumber,
          businessNature: addForm.businessNature,
          propertyStatus: addForm.propertyStatus,
          password: addForm.password,
          membershipStatus: addForm.membershipStatus,
          staffName: addForm.staffName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '新增餐廳失敗');
      }

      // Add to local state
      const memberForDisplay: Member = {
        id: result.member.id,
        name: result.member.name,
        restaurantName: result.member.restaurantName,
        email: result.member.email,
        phone: result.member.phone,
        membershipStatus: result.member.membershipStatus,
        joinDate: result.member.joinDate,
        address: result.member.address,
        totalOrders: result.member.totalOrders,
        totalSpent: result.member.totalSpent,
        firebaseUid: result.member.firebaseUid,
        companyInfo: result.member.companyInfo,
        shopInfo: result.member.shopInfo,
        contactInfo: result.member.contactInfo,
        accountingContact: result.member.accountingContact,
        businessInfo: result.member.businessInfo,
      };

      setMembers([memberForDisplay, ...members]);
      setShowAddModal(false);
      
      // Reset form
      setAddForm({
        companyNameEn: '',
        companyNameZh: '',
        companyAddressEn: '',
        companyAddressZh: '',
        shopNameEn: '',
        shopNameZh: '',
        shopAddressEn: '',
        shopAddressZh: '',
        contactName: '',
        contactTitle: '',
        contactPhone: '',
        contactFax: '',
        contactEmail: '',
        accountingName: '',
        accountingTitle: '',
        accountingPhone: '',
        accountingFax: '',
        accountingEmail: '',
        businessRegNumber: '',
        businessNature: '',
        companyStatus: '',
        propertyStatus: '',
        password: '',
        membershipStatus: 'active',
        businessRegistrationFile: null,
        staffName: '',
      });
    } catch (error: any) {
      console.error('Error adding member:', error);
      setError(error.message || '新增餐廳失敗');
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">餐廳管理</h1>
            <p className="text-gray-600">查看和管理所有食品供應商專業會員</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                fetchSalesNames(); // Refresh sales names when opening modal
                setShowAddModal(true);
              }}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#0B8628' }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              新增餐廳
              <span className="ml-2 text-xs font-normal text-primary-100">建立會員</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-2">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">會員狀態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">全部狀態</option>
              <option value="active">有效</option>
              <option value="inactive">未啟用</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              餐廳 ({filteredMembers.length})
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
                  會員狀態
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用者角色
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
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">ID: {member.id}</div>
                      <div className="text-sm text-gray-500">{member.restaurantName}</div>
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.membershipStatus)}`}>
                        {getStatusIcon(member.membershipStatus)}
                        <span className="ml-1">{getStatusText(member.membershipStatus)}</span>
                      </span>
                      <div className="text-sm text-gray-500">加入日期：{member.joinDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                      {getRoleText(member.role)}
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
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="刪除會員"
                        disabled={deletingMemberId === member.id}
                      >
                        {deletingMemberId === member.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">會員狀態與活動</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">狀態</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedMember.membershipStatus)}`}>
                        {getStatusIcon(selectedMember.membershipStatus)}
                        <span className="ml-1">{getStatusText(selectedMember.membershipStatus)}</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">使用者角色</label>
                      <p className="text-sm text-gray-900">{getRoleText(selectedMember.role)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">總訂單數</label>
                      <p className="text-lg font-bold text-gray-900">
                        {memberOrdersLoading ? '載入中...' : memberOrderStats.totalOrders}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">總消費</label>
                      <p className="text-lg font-bold text-gray-900">
                        {memberOrdersLoading
                          ? '載入中...'
                          : formatCurrency(memberOrderStats.totalSpent)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Shop Information */}
              {(selectedMember.companyInfo || selectedMember.shopInfo) && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">公司及店舖資料 Company & Shop</h4>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedMember.companyInfo && (
                      <div className="space-y-2">
                        {selectedMember.companyInfo.nameEn && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">公司名稱（英文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.companyInfo.nameEn}</p>
                          </div>
                        )}
                        {selectedMember.companyInfo.nameZh && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">公司名稱（中文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.companyInfo.nameZh}</p>
                          </div>
                        )}
                        {selectedMember.companyInfo.addressEn && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">公司地址（英文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.companyInfo.addressEn}</p>
                          </div>
                        )}
                        {selectedMember.companyInfo.addressZh && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">公司地址（中文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.companyInfo.addressZh}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedMember.shopInfo && (
                      <div className="space-y-2">
                        {selectedMember.shopInfo.nameEn && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">店舖名稱（英文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.shopInfo.nameEn}</p>
                          </div>
                        )}
                        {selectedMember.shopInfo.nameZh && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">店舖名稱（中文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.shopInfo.nameZh}</p>
                          </div>
                        )}
                        {selectedMember.shopInfo.addressEn && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">店舖地址（英文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.shopInfo.addressEn}</p>
                          </div>
                        )}
                        {selectedMember.shopInfo.addressZh && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">店舖地址（中文）</label>
                            <p className="text-sm text-gray-900">{selectedMember.shopInfo.addressZh}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact & Accounting Information */}
              {(selectedMember.contactInfo || selectedMember.accountingContact) && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">聯絡人及會計部資料 Contacts</h4>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedMember.contactInfo && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-gray-800">聯絡人 Contact Person</h5>
                        {selectedMember.contactInfo.name && (
                          <p className="text-sm text-gray-900">姓名：{selectedMember.contactInfo.name}</p>
                        )}
                        {selectedMember.contactInfo.title && (
                          <p className="text-sm text-gray-900">職銜：{selectedMember.contactInfo.title}</p>
                        )}
                        {selectedMember.contactInfo.phone && (
                          <p className="text-sm text-gray-900">電話：{selectedMember.contactInfo.phone}</p>
                        )}
                        {selectedMember.contactInfo.fax && (
                          <p className="text-sm text-gray-900">傳真：{selectedMember.contactInfo.fax}</p>
                        )}
                        {selectedMember.contactInfo.email && (
                          <p className="text-sm text-gray-900">電郵：{selectedMember.contactInfo.email}</p>
                        )}
                      </div>
                    )}
                    {selectedMember.accountingContact && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-gray-800">會計部聯絡人 Accounting Contact</h5>
                        {selectedMember.accountingContact.name && (
                          <p className="text-sm text-gray-900">姓名：{selectedMember.accountingContact.name}</p>
                        )}
                        {selectedMember.accountingContact.title && (
                          <p className="text-sm text-gray-900">職銜：{selectedMember.accountingContact.title}</p>
                        )}
                        {selectedMember.accountingContact.phone && (
                          <p className="text-sm text-gray-900">電話：{selectedMember.accountingContact.phone}</p>
                        )}
                        {selectedMember.accountingContact.fax && (
                          <p className="text-sm text-gray-900">傳真：{selectedMember.accountingContact.fax}</p>
                        )}
                        {selectedMember.accountingContact.email && (
                          <p className="text-sm text-gray-900">電郵：{selectedMember.accountingContact.email}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Information */}
              {(selectedMember.businessInfo || (selectedMember.businessRegistrationFileUrl && selectedMember.businessRegistrationFileUrl.trim())) && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">營運及授信資料 Business Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedMember.businessInfo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {selectedMember.businessInfo.registrationNumber && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">商業登記證號碼</label>
                            <p className="text-sm text-gray-900">{selectedMember.businessInfo.registrationNumber}</p>
                          </div>
                        )}
                        {selectedMember.businessInfo.nature && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">業務性質</label>
                            <p className="text-sm text-gray-900">{selectedMember.businessInfo.nature}</p>
                          </div>
                        )}
                        {selectedMember.businessInfo.companyStatus && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">公司性質</label>
                            <p className="text-sm text-gray-900">{selectedMember.businessInfo.companyStatus}</p>
                          </div>
                        )}
                        {selectedMember.businessInfo.propertyStatus && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">該鋪自置或租用</label>
                            <p className="text-sm text-gray-900">
                              {selectedMember.businessInfo.propertyStatus === 'owned' ? '自置 Owned' : 
                               selectedMember.businessInfo.propertyStatus === 'rented' ? '租用 Rented' : 
                               selectedMember.businessInfo.propertyStatus}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedMember.businessRegistrationFileUrl && selectedMember.businessRegistrationFileUrl.trim() && (
                      <div className={selectedMember.businessInfo ? "pt-4 border-t border-gray-200" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">上傳商業登記證副本</label>
                        <a
                          href={selectedMember.businessRegistrationFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-[#0B8628] text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          查看商業登記證副本
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Follow-up Staff */}
              {selectedMember.staffName && selectedMember.staffName.trim() && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">平台跟進專員</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">
                      工作人員名稱：{selectedMember.staffName}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">最近訂單</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {memberOrdersLoading ? (
                    <div className="p-4 text-sm text-gray-500">訂單資料載入中...</div>
                  ) : memberRecentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {memberRecentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Package className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{order.id}</p>
                              <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <p
                              className={`text-xs font-medium ${
                                order.status === 'delivered'
                                  ? 'text-green-600'
                                  : order.status === 'cancelled'
                                  ? 'text-red-500'
                                  : 'text-gray-500'
                              }`}
                            >
                              {getOrderStatusText(order.status)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">暫無訂單紀錄</p>
                  )}
                </div>
              </div>

              {/* Points Transactions */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">點數交易記錄</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {memberPointsLoading ? (
                    <div className="p-4 text-sm text-gray-500">點數交易載入中...</div>
                  ) : memberPointTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {memberPointTransactions.map((tx) => {
                        const pointsClass =
                          tx.points >= 0 ? 'text-green-600' : 'text-red-600';
                        const statusClass = tx.status
                          ? tx.status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : tx.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          : '';
                        return (
                          <div
                            key={tx.id}
                            className="flex items-start justify-between p-3 bg-white rounded-lg"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-yellow-100 rounded-full">
                                <Coins className="w-4 h-4 text-yellow-600" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {tx.description || (tx.type === 'purchase' ? '購買點數' : '點數交易')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(tx.createdAt)}
                                </p>
                                {tx.planId && (
                                  <p className="text-xs text-gray-400">方案：{tx.planId}</p>
                                )}
                                {tx.status && (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}
                                  >
                                    {getPointsStatusText(tx.status)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className={`text-sm font-semibold ${pointsClass}`}>
                                {`${tx.points >= 0 ? '+' : ''}${tx.points.toLocaleString()} 點`}
                              </p>
                              {typeof tx.amount === 'number' && (
                                <p className="text-xs text-gray-500">
                                  {formatCurrency(tx.amount)}
                                </p>
                              )}
                              {typeof tx.newBalance === 'number' && (
                                <p className="text-xs text-gray-400">
                                  餘額：{tx.newBalance.toLocaleString()} 點
                                </p>
                              )}
                              {tx.receiptUrl && (
                                <a
                                  href={tx.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-primary-600 hover:text-primary-800"
                                >
                                  查看收據
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">暫無點數交易記錄</p>
                  )}
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">新增餐廳</h3>
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
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">公司資料 Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱（英文）*</label>
                  <input
                    type="text"
                        required
                        value={addForm.companyNameEn}
                        onChange={(e) => updateAddFormField('companyNameEn', e.target.value)}
                        placeholder="Company Name (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱（中文）</label>
                  <input
                    type="text"
                        value={addForm.companyNameZh}
                        onChange={(e) => updateAddFormField('companyNameZh', e.target.value)}
                        placeholder="公司名稱"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司地址（英文）*</label>
                      <input
                        type="text"
                        required
                        value={addForm.companyAddressEn}
                        onChange={(e) => updateAddFormField('companyAddressEn', e.target.value)}
                        placeholder="Company Address (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司地址（中文）</label>
                      <input
                        type="text"
                        value={addForm.companyAddressZh}
                        onChange={(e) => updateAddFormField('companyAddressZh', e.target.value)}
                        placeholder="公司地址"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">店舖資料 Shop Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖名稱（英文）*</label>
                  <input
                        type="text"
                        required
                        value={addForm.shopNameEn}
                        onChange={(e) => updateAddFormField('shopNameEn', e.target.value)}
                        placeholder="Shop Name (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖名稱（中文）</label>
                      <input
                        type="text"
                        value={addForm.shopNameZh}
                        onChange={(e) => updateAddFormField('shopNameZh', e.target.value)}
                        placeholder="店舖名稱"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖地址（英文）*</label>
                      <input
                        type="text"
                        required
                        value={addForm.shopAddressEn}
                        onChange={(e) => updateAddFormField('shopAddressEn', e.target.value)}
                        placeholder="Shop Address (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖地址（中文）</label>
                      <input
                        type="text"
                        value={addForm.shopAddressZh}
                        onChange={(e) => updateAddFormField('shopAddressZh', e.target.value)}
                        placeholder="店舖地址"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">聯絡人 Contact Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名 *</label>
                      <input
                        type="text"
                        required
                        value={addForm.contactName}
                        onChange={(e) => updateAddFormField('contactName', e.target.value)}
                        placeholder="Contact Person"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">職銜 Title *</label>
                      <input
                        type="text"
                        required
                        value={addForm.contactTitle}
                        onChange={(e) => updateAddFormField('contactTitle', e.target.value)}
                        placeholder="Title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼 *</label>
                      <input
                        type="tel"
                        required
                        value={addForm.contactPhone}
                        onChange={(e) => updateAddFormField('contactPhone', e.target.value)}
                        placeholder="Telephone"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
                      <input
                        type="text"
                        value={addForm.contactFax}
                        onChange={(e) => updateAddFormField('contactFax', e.target.value)}
                        placeholder="Fax"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">電郵地址 *</label>
                      <input
                        type="email"
                        required
                        value={addForm.contactEmail}
                        onChange={(e) => updateAddFormField('contactEmail', e.target.value)}
                        placeholder="Email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">登入密碼 *</label>
                  <input
                    type="password"
                        required
                    value={addForm.password}
                        onChange={(e) => updateAddFormField('password', e.target.value)}
                    placeholder="至少6個字元"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                  />
                  <p className="text-xs text-gray-500 mt-1">密碼至少需要6個字元</p>
                </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">會計部聯絡人 Accounting Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名</label>
                      <input
                        type="text"
                        value={addForm.accountingName}
                        onChange={(e) => updateAddFormField('accountingName', e.target.value)}
                        placeholder="Accounting Contact Person"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">職銜 Title</label>
                      <input
                        type="text"
                        value={addForm.accountingTitle}
                        onChange={(e) => updateAddFormField('accountingTitle', e.target.value)}
                        placeholder="Title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼</label>
                  <input
                    type="tel"
                        value={addForm.accountingPhone}
                        onChange={(e) => updateAddFormField('accountingPhone', e.target.value)}
                        placeholder="A/C Telephone"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
                      <input
                        type="text"
                        value={addForm.accountingFax}
                        onChange={(e) => updateAddFormField('accountingFax', e.target.value)}
                        placeholder="A/C Fax"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">電郵地址</label>
                      <input
                        type="email"
                        value={addForm.accountingEmail}
                        onChange={(e) => updateAddFormField('accountingEmail', e.target.value)}
                        placeholder="A/C Email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">營運及授信資料 Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">商業登記證號碼 *</label>
                      <input
                        type="text"
                        required
                        value={addForm.businessRegNumber}
                        onChange={(e) => updateAddFormField('businessRegNumber', e.target.value)}
                        placeholder="Business Registration No."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">上傳商業登記證副本</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAddForm(prev => ({ ...prev, businessRegistrationFile: file }));
                        }}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#0B8628] hover:file:bg-green-100"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">業務性質 *</label>
                      <input
                        type="text"
                        required
                        value={addForm.businessNature}
                        onChange={(e) => updateAddFormField('businessNature', e.target.value)}
                        placeholder="Nature of Business"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">該鋪自置或租用 *</label>
                      <select
                        required
                        value={addForm.propertyStatus}
                        onChange={(e) => updateAddFormField('propertyStatus', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      >
                        <option value="">請選擇</option>
                        <option value="owned">自置 Owned</option>
                        <option value="rented">租用 Rented</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">會員設定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">會員狀態</label>
                      <select
                        value={addForm.membershipStatus}
                        onChange={(e) =>
                          updateAddFormField('membershipStatus', e.target.value as 'active' | 'inactive')
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      >
                        <option value="active">有效</option>
                        <option value="inactive">未啟用</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">工作人員名稱 *</label>
                      <input
                        type="text"
                        required
                        value={addForm.staffName}
                        onChange={(e) => updateAddFormField('staffName', e.target.value)}
                        placeholder="請輸入工作人員名稱"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
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
                  className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#0B8628' }}
                >
                  {isSubmitting ? '新增中...' : '新增餐廳'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
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
              
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">公司資料 Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱（英文）*</label>
                      <input
                        type="text"
                        value={editForm.companyNameEn}
                        onChange={(e) => updateEditFormField('companyNameEn', e.target.value)}
                        placeholder="Company Name (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱（中文）</label>
                      <input
                        type="text"
                        value={editForm.companyNameZh}
                        onChange={(e) => updateEditFormField('companyNameZh', e.target.value)}
                        placeholder="公司名稱"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司地址（英文）*</label>
                      <input
                        type="text"
                        value={editForm.companyAddressEn}
                        onChange={(e) => updateEditFormField('companyAddressEn', e.target.value)}
                        placeholder="Company Address (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司地址（中文）</label>
                      <input
                        type="text"
                        value={editForm.companyAddressZh}
                        onChange={(e) => updateEditFormField('companyAddressZh', e.target.value)}
                        placeholder="公司地址"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">店舖資料 Shop Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖名稱（英文）*</label>
                      <input
                        type="text"
                        value={editForm.shopNameEn}
                        onChange={(e) => updateEditFormField('shopNameEn', e.target.value)}
                        placeholder="Shop Name (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖名稱（中文）</label>
                      <input
                        type="text"
                        value={editForm.shopNameZh}
                        onChange={(e) => updateEditFormField('shopNameZh', e.target.value)}
                        placeholder="店舖名稱"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖地址（英文）*</label>
                      <input
                        type="text"
                        value={editForm.shopAddressEn}
                        onChange={(e) => updateEditFormField('shopAddressEn', e.target.value)}
                        placeholder="Shop Address (English)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舖地址（中文）</label>
                      <input
                        type="text"
                        value={editForm.shopAddressZh}
                        onChange={(e) => updateEditFormField('shopAddressZh', e.target.value)}
                        placeholder="店舖地址"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">聯絡人 Contact Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名 *</label>
                      <input
                        type="text"
                        value={editForm.contactName}
                        onChange={(e) => updateEditFormField('contactName', e.target.value)}
                        placeholder="Contact Person"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">職銜 Title *</label>
                      <input
                        type="text"
                        value={editForm.contactTitle}
                        onChange={(e) => updateEditFormField('contactTitle', e.target.value)}
                        placeholder="Title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼 *</label>
                      <input
                        type="tel"
                        value={editForm.contactPhone}
                        onChange={(e) => updateEditFormField('contactPhone', e.target.value)}
                        placeholder="Telephone"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
                      <input
                        type="text"
                        value={editForm.contactFax}
                        onChange={(e) => updateEditFormField('contactFax', e.target.value)}
                        placeholder="Fax"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">電郵地址 *</label>
                      <input
                        type="email"
                        value={editForm.contactEmail}
                        onChange={(e) => updateEditFormField('contactEmail', e.target.value)}
                        placeholder="Email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">會計部聯絡人 Accounting Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名</label>
                      <input
                        type="text"
                        value={editForm.accountingName}
                        onChange={(e) => updateEditFormField('accountingName', e.target.value)}
                        placeholder="Accounting Contact Person"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">職銜 Title</label>
                      <input
                        type="text"
                        value={editForm.accountingTitle}
                        onChange={(e) => updateEditFormField('accountingTitle', e.target.value)}
                        placeholder="Title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼</label>
                      <input
                        type="tel"
                        value={editForm.accountingPhone}
                        onChange={(e) => updateEditFormField('accountingPhone', e.target.value)}
                        placeholder="A/C Telephone"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
                      <input
                        type="text"
                        value={editForm.accountingFax}
                        onChange={(e) => updateEditFormField('accountingFax', e.target.value)}
                        placeholder="A/C Fax"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">電郵地址</label>
                      <input
                        type="email"
                        value={editForm.accountingEmail}
                        onChange={(e) => updateEditFormField('accountingEmail', e.target.value)}
                        placeholder="A/C Email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">營運及授信資料 Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">商業登記證號碼 *</label>
                      <input
                        type="text"
                        value={editForm.businessRegNumber}
                        onChange={(e) => updateEditFormField('businessRegNumber', e.target.value)}
                        placeholder="Business Registration No."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">上傳商業登記證副本</label>
                      {editForm.businessRegistrationFileUrl && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 mb-2">已上傳的檔案：</p>
                          <a
                            href={editForm.businessRegistrationFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-[#0B8628] hover:text-green-700 underline"
                          >
                            查看商業登記證副本
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEditForm(prev => ({ ...prev, businessRegistrationFile: file }));
                        }}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#0B8628] hover:file:bg-green-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">上傳新檔案將取代現有檔案</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">業務性質 *</label>
                      <input
                        type="text"
                        value={editForm.businessNature}
                        onChange={(e) => updateEditFormField('businessNature', e.target.value)}
                        placeholder="Nature of Business"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司性質 *</label>
                      <input
                        type="text"
                        value={editForm.companyStatus}
                        onChange={(e) => updateEditFormField('companyStatus', e.target.value)}
                        placeholder="Company Status"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">該鋪自置或租用 *</label>
                      <select
                        value={editForm.propertyStatus}
                        onChange={(e) => updateEditFormField('propertyStatus', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      >
                        <option value="">請選擇</option>
                        <option value="owned">自置 Owned</option>
                        <option value="rented">租用 Rented</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">帳號設定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">設定新密碼</label>
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => updateEditFormField('password', e.target.value)}
                        placeholder="若不修改請留空"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                      <p className="text-xs text-gray-500 mt-1">密碼至少需 6 個字元</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">確認新密碼</label>
                      <input
                        type="password"
                        value={editForm.confirmPassword}
                        onChange={(e) => updateEditFormField('confirmPassword', e.target.value)}
                        placeholder="再次輸入新密碼"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">會員設定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">會員狀態</label>
                      <select
                        value={editForm.membershipStatus}
                        onChange={(e) =>
                          updateEditFormField('membershipStatus', e.target.value as 'active' | 'inactive')
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                      >
                        <option value="active">有效</option>
                        <option value="inactive">未啟用</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">工作人員名稱 *</label>
                      {loadingSalesNames ? (
                        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                          <span className="text-sm text-gray-500">載入中...</span>
                        </div>
                      ) : (
                        <select
                          required
                          value={editForm.staffName}
                          onChange={(e) => updateEditFormField('staffName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
                        >
                          <option value="">請選擇工作人員</option>
                          {salesNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
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