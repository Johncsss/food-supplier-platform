'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Mail,
  Phone,
  MapPin,
  Store,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Calendar,
  Package,
  Trash2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { Category, Product } from '@/shared/types';
import { categories as defaultCategories } from '@/shared/products';

interface Supplier {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  address: string;
  category?: string;
}

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productCountToDelete, setProductCountToDelete] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    address: '',
    category: ''
  });
  const [addForm, setAddForm] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    address: '',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(query(categoriesRef, orderBy('name')));
        const fetchedCategories: Category[] = categoriesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            subcategories: data.subcategories || [],
          };
        });
        
        // Use Firestore categories if available, otherwise fallback to default categories
        const categoriesToUse = fetchedCategories.length > 0 ? fetchedCategories : defaultCategories;
        setCategories(categoriesToUse);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(defaultCategories);
      }
    };

    fetchCategories();
  }, []);

  // Fetch suppliers from Firestore
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const fetchedSuppliers: Supplier[] = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            // Only show users with role 'supplier'
            return data.role === 'supplier';
          })
          .map((doc) => {
            const data = doc.data();
            return {
              id: data.id || doc.id,
              name: data.name || '',
              companyName: data.companyName || '',
              email: data.email || '',
              phone: data.phone || '',
              status: data.status || 'pending',
              joinDate: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
              address: typeof data.address === 'string' ? data.address : 
                       data.address ? `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.zipCode}` : '',
              category: data.category || '',
            };
          });
        setSuppliers(fetchedSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'inactive':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活躍';
      case 'inactive':
        return '停用';
      case 'pending':
        return '待審核';
      default:
        return '未知';
    }
  };

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleViewProducts = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowProductsModal(true);
    setLoadingProducts(true);
    
    try {
      // Fetch products for this supplier
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('supplier', '==', supplier.id));
      const snapshot = await getDocs(q);
      
      const products: Product[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          productCode: data.productCode || '',
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          price: data.price || 0,
          unit: data.unit || '',
          minOrderQuantity: data.minOrderQuantity || 1,
          stockQuantity: data.stockQuantity || 0,
          imageUrl: data.imageUrl || '',
          imageUrls: data.imageUrls || [],
          isAvailable: data.isAvailable ?? true,
          supplier: data.supplier || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      });
      
      setSupplierProducts(products);
    } catch (error) {
      console.error('Error fetching supplier products:', error);
      setError('載入產品失敗');
      setSupplierProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    // First, fetch product count
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('supplier', '==', supplier.id));
      const snapshot = await getDocs(q);
      setProductCountToDelete(snapshot.docs.length);
      setSelectedSupplier(supplier);
      setShowDeleteModal(true);
    } catch (error) {
      console.error('Error fetching product count:', error);
      setProductCountToDelete(0);
      setSelectedSupplier(supplier);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch('/api/delete-supplier', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supplierId: selectedSupplier.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '刪除供應商失敗');
      }

      // Remove from local state
      setSuppliers(suppliers.filter(supplier => supplier.id !== selectedSupplier.id));
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      alert(`供應商已成功刪除！已同時刪除 ${result.deletedProducts || productCountToDelete} 個產品。`);
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      setError(error.message || '刪除供應商失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditForm({
      name: supplier.name,
      companyName: supplier.companyName,
      email: supplier.email,
      phone: supplier.phone,
      status: supplier.status,
      address: supplier.address,
      category: supplier.category || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (selectedSupplier && editForm.name && editForm.companyName && editForm.email && editForm.phone && editForm.address) {
      try {
        setIsSubmitting(true);
        setError(null);

        // Update in Firestore
        const supplierRef = doc(db, 'users', selectedSupplier.id);
        await updateDoc(supplierRef, {
          name: editForm.name,
          companyName: editForm.companyName,
          email: editForm.email,
          phone: editForm.phone,
          status: editForm.status,
          address: editForm.address,
          category: editForm.category || '',
          updatedAt: serverTimestamp()
        });

        // Update local state
        const updatedSuppliers = suppliers.map(supplier =>
          supplier.id === selectedSupplier.id
            ? {
                ...supplier,
                name: editForm.name,
                companyName: editForm.companyName,
                email: editForm.email,
                phone: editForm.phone,
                status: editForm.status,
                address: editForm.address,
                category: editForm.category || ''
              }
            : supplier
        );
        setSuppliers(updatedSuppliers);
        setShowEditModal(false);
        setSelectedSupplier(null);
      } catch (error: any) {
        console.error('Error updating supplier:', error);
        setError(error.message || '更新供應商失敗');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAddSupplier = async () => {
    if (!addForm.name || !addForm.companyName || !addForm.email || !addForm.password || !addForm.phone) {
      setError('請填寫所有必填欄位');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Call API endpoint to create supplier using Admin SDK
      const response = await fetch('/api/create-supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addForm.name,
          companyName: addForm.companyName,
          email: addForm.email,
          password: addForm.password,
          phone: addForm.phone,
          status: addForm.status,
          address: addForm.address,
          category: addForm.category || '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '新增供應商失敗');
      }

      // Add to local state
      const supplierForDisplay: Supplier = {
        id: result.supplier.id,
        name: result.supplier.name,
        companyName: result.supplier.companyName,
        email: result.supplier.email,
        phone: result.supplier.phone,
        status: result.supplier.status,
        joinDate: new Date().toISOString().split('T')[0],
        address: result.supplier.address,
        category: result.supplier.category || ''
      };

      setSuppliers([supplierForDisplay, ...suppliers]);
      setShowAddModal(false);
      
      // Reset form
      setAddForm({
        name: '',
        companyName: '',
        email: '',
        password: '',
        phone: '',
        status: 'active',
        address: '',
        category: ''
      });
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      setError(error.message || '新增供應商失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入供應商資料中...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">供應商管理</h1>
            <p className="text-gray-600">查看和管理所有供應商</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              新增供應商
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
                <Store className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">總供應商數</p>
                <p className="text-3xl font-bold text-gray-900">{totalSuppliers}</p>
                <p className="text-sm text-gray-500">活躍: {activeSuppliers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋供應商</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="按姓名、公司或電子郵件搜尋..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              供應商 ({filteredSuppliers.length})
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
                  供應商資訊
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡詳情
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Store className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">ID: {supplier.id}</div>
                        <div className="text-sm text-gray-500">{supplier.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{supplier.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{supplier.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 truncate max-w-xs">{supplier.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(supplier.status)}`}>
                        {getStatusIcon(supplier.status)}
                        <span className="ml-1">{getStatusText(supplier.status)}</span>
                      </span>
                      <div className="text-sm text-gray-500">加入日期：{supplier.joinDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewSupplier(supplier)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                        title="查看詳情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewProducts(supplier)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="查看產品"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditSupplier(supplier)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                        title="編輯供應商"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="刪除供應商"
                      >
                        <Trash2 className="w-4 h-4" />
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
      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">未找到供應商</h3>
          <p className="text-gray-600">
            請調整搜尋條件或新增供應商。
          </p>
        </div>
      )}

      {/* View Supplier Modal */}
      {showViewModal && selectedSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">供應商詳情</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">供應商資訊</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">供應商姓名</label>
                      <p className="text-lg font-medium text-gray-900">{selectedSupplier.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">供應商ID</label>
                      <p className="text-sm text-gray-600">{selectedSupplier.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">公司名稱</label>
                      <p className="text-sm text-gray-900">{selectedSupplier.companyName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                      <p className="text-sm text-gray-900">{selectedSupplier.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">電話</label>
                      <p className="text-sm text-gray-900">{selectedSupplier.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">地址</label>
                      <p className="text-sm text-gray-900">{selectedSupplier.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">類別</label>
                      <p className="text-sm text-gray-900">{selectedSupplier.category || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">加入日期</label>
                      <p className="text-sm text-gray-900">{selectedSupplier.joinDate}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">狀態</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">狀態</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSupplier.status)}`}>
                        {getStatusIcon(selectedSupplier.status)}
                        <span className="ml-1">{getStatusText(selectedSupplier.status)}</span>
                      </span>
                    </div>
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

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">新增供應商</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">供應商姓名 *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="請輸入供應商姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱 *</label>
                  <input
                    type="text"
                    value={addForm.companyName}
                    onChange={(e) => setAddForm({...addForm, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="請輸入公司名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件 *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="example@company.com"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({...addForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">選擇類別</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">供應商狀態</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({...addForm, status: e.target.value as 'active' | 'inactive' | 'pending'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">活躍</option>
                    <option value="inactive">停用</option>
                    <option value="pending">待審核</option>
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
                  onClick={handleAddSupplier}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '新增中...' : '新增供應商'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && selectedSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">編輯供應商</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">供應商姓名</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">選擇類別</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">供應商狀態</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as 'active' | 'inactive' | 'pending'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">活躍</option>
                    <option value="inactive">停用</option>
                    <option value="pending">待審核</option>
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

      {/* View Supplier Products Modal */}
      {showProductsModal && selectedSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedSupplier.companyName} - 產品列表
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">供應商：{selectedSupplier.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSupplierProducts([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingProducts ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">載入產品中...</p>
                </div>
              ) : supplierProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">尚無產品</h3>
                  <p className="text-gray-600">此供應商尚未添加任何產品</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          產品圖片
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          產品名稱
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          類別
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          價格
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          庫存
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          狀態
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supplierProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-16 w-16">
                              {product.imageUrl || (product.imageUrls && product.imageUrls.length > 0) ? (
                                <img
                                  src={product.imageUrls?.[0] || product.imageUrl}
                                  alt={product.name}
                                  className="h-16 w-16 rounded-lg object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-product.svg';
                                  }}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.productCode && (
                              <div className="text-sm text-gray-500">編號：{product.productCode}</div>
                            )}
                            {product.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.category}</div>
                            {product.subcategory && (
                              <div className="text-xs text-gray-500">{product.subcategory}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${product.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">/{product.unit}</div>
                            {product.minOrderQuantity > 1 && (
                              <div className="text-xs text-gray-500">最少訂購：{product.minOrderQuantity}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.stockQuantity}</div>
                            <div className="text-xs text-gray-500">{product.unit}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.isAvailable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.isAvailable ? '可用' : '不可用'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    共 {supplierProducts.length} 個產品
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSupplierProducts([]);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Supplier Confirmation Modal */}
      {showDeleteModal && selectedSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">確認刪除供應商</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSupplier(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isDeleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-red-100">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4 text-center">
                  確定要刪除供應商 <strong>{selectedSupplier.companyName}</strong> 嗎？
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 font-medium mb-2">⚠️ 警告</p>
                  <p className="text-sm text-red-700">
                    此操作將同時刪除此供應商的所有產品（<strong>{productCountToDelete} 個產品</strong>），且無法復原。
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSupplier(null);
                    setError(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteSupplier}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>刪除中...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>確認刪除</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
