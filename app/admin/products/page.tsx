'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, X, Package, DollarSign, Trash2, Tag, Settings } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { Product, Category } from '@/shared/types';
import { categories as defaultCategories } from '@/shared/products';
import ImageUploader from '@/components/ui/ImageUploader';
import MultipleImageUploader from '@/components/ui/MultipleImageUploader';

interface Supplier {
  id: string;
  companyName: string;
  name: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    unit: '',
    minOrderQuantity: '1',
    stockQuantity: '',
    imageUrl: '',
    isAvailable: true,
    supplier: ''
  });
  const [addForm, setAddForm] = useState({
    name: '',
    productCode: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    unit: '',
    minOrderQuantity: '1',
    stockQuantity: '',
    imageUrls: [] as string[],
    imageUrl: '', // Keep for backward compatibility
    isAvailable: true,
    supplier: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    subcategories: ''
  });
  const [newSubcategory, setNewSubcategory] = useState('');

  // Helper functions for subcategory management
  const getSubcategoriesArray = (subcategoriesString: string): string[] => {
    return subcategoriesString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const addSubcategory = () => {
    if (newSubcategory.trim()) {
      const currentSubcategories = getSubcategoriesArray(categoryForm.subcategories);
      if (!currentSubcategories.includes(newSubcategory.trim())) {
        const updatedSubcategories = [...currentSubcategories, newSubcategory.trim()];
        setCategoryForm({
          ...categoryForm,
          subcategories: updatedSubcategories.join(', ')
        });
      }
      setNewSubcategory('');
    }
  };

  const removeSubcategory = (subcategoryToRemove: string) => {
    const currentSubcategories = getSubcategoriesArray(categoryForm.subcategories);
    const updatedSubcategories = currentSubcategories.filter(s => s !== subcategoryToRemove);
    setCategoryForm({
      ...categoryForm,
      subcategories: updatedSubcategories.join(', ')
    });
  };

  // Helper function to get subcategories for a selected category
  const getSubcategoriesForCategory = (categoryName: string): string[] => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  };

  // Fetch suppliers from Firestore
  const fetchSuppliers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const fetchedSuppliers: Supplier[] = snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.role === 'supplier';
        })
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            companyName: data.companyName || data.name || '',
            name: data.name || '',
          };
        });
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Fetch products and categories from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products - get all products first to ensure none are missed
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const fetchedProducts: Product[] = productsSnapshot.docs.map((doc) => {
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
        
        // Sort products by createdAt (newest first), with products without createdAt at the end
        fetchedProducts.sort((a, b) => {
          const aTime = a.createdAt.getTime();
          const bTime = b.createdAt.getTime();
          return bTime - aTime;
        });
        
        console.log('Fetched products:', fetchedProducts.length, 'products');
        console.log('Product names:', fetchedProducts.map(p => p.name));
        setProducts(fetchedProducts);

        // Fetch categories
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
        
        // If no categories in Firestore, use default categories
        if (fetchedCategories.length === 0) {
          setCategories(defaultCategories);
        } else {
          setCategories(fetchedCategories);
        }

        // Fetch suppliers
        await fetchSuppliers();
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to default categories if Firestore fails
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    // Try to find supplier by ID first, then by name (for backward compatibility)
    const supplierId = suppliers.find(s => s.id === product.supplier)?.id || 
                      suppliers.find(s => s.companyName === product.supplier)?.id || 
                      product.supplier || '';
    setEditForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      subcategory: product.subcategory || '',
      price: product.price.toString(),
      unit: product.unit || '',
      minOrderQuantity: product.minOrderQuantity?.toString() || '1',
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl || '',
      isAvailable: product.isAvailable,
      supplier: supplierId
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct || !editForm.name || !editForm.category || !editForm.price || !editForm.stockQuantity) {
      setError('請填寫所有必填欄位');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const productRef = doc(db, 'products', selectedProduct.id);
      await updateDoc(productRef, {
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        subcategory: editForm.subcategory,
        price: parseFloat(editForm.price),
        unit: editForm.unit,
        minOrderQuantity: parseInt(editForm.minOrderQuantity),
        stockQuantity: parseInt(editForm.stockQuantity),
        imageUrl: editForm.imageUrl,
        isAvailable: editForm.isAvailable,
        supplier: editForm.supplier,
        updatedAt: serverTimestamp()
      });

      const updatedProducts = products.map(product =>
        product.id === selectedProduct.id
          ? {
              ...product,
              name: editForm.name,
              description: editForm.description,
              category: editForm.category,
              subcategory: editForm.subcategory,
              price: parseFloat(editForm.price),
              unit: editForm.unit,
              minOrderQuantity: parseInt(editForm.minOrderQuantity),
              stockQuantity: parseInt(editForm.stockQuantity),
              imageUrl: editForm.imageUrl,
              isAvailable: editForm.isAvailable,
              supplier: editForm.supplier,
              updatedAt: new Date()
            }
          : product
      );
      setProducts(updatedProducts);
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Error updating product:', error);
      setError(error.message || '更新產品失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = async () => {
    if (!addForm.name || !addForm.category || !addForm.price || !addForm.stockQuantity) {
      setError('請填寫所有必填欄位');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const newProduct = {
        name: addForm.name,
        productCode: addForm.productCode || '',
        description: addForm.description,
        category: addForm.category,
        subcategory: addForm.subcategory,
        price: parseFloat(addForm.price),
        unit: addForm.unit,
        minOrderQuantity: parseInt(addForm.minOrderQuantity),
        stockQuantity: parseInt(addForm.stockQuantity),
        imageUrl: addForm.imageUrls.length > 0 ? addForm.imageUrls[0] : '', // First image for backward compatibility
        imageUrls: addForm.imageUrls || [], // All images
        isAvailable: addForm.isAvailable,
        supplier: addForm.supplier,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'products'), newProduct);

      const productForDisplay: Product = {
        id: docRef.id,
        name: addForm.name,
        productCode: addForm.productCode || '',
        description: addForm.description,
        category: addForm.category,
        subcategory: addForm.subcategory,
        price: parseFloat(addForm.price),
        unit: addForm.unit,
        minOrderQuantity: parseInt(addForm.minOrderQuantity),
        stockQuantity: parseInt(addForm.stockQuantity),
        imageUrl: addForm.imageUrls.length > 0 ? addForm.imageUrls[0] : '',
        imageUrls: addForm.imageUrls || [],
        isAvailable: addForm.isAvailable,
        supplier: addForm.supplier,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setProducts([productForDisplay, ...products]);
      setShowAddModal(false);
      
      // Reset form
      setAddForm({
        name: '',
        productCode: '',
        description: '',
        category: '',
        subcategory: '',
        price: '',
        unit: '',
        minOrderQuantity: '1',
        stockQuantity: '',
        imageUrls: [],
        imageUrl: '',
        isAvailable: true,
        supplier: ''
      });
    } catch (error: any) {
      console.error('Error adding product:', error);
      setError(error.message || '新增產品失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('確定要刪除此產品嗎？')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('刪除產品失敗');
    }
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!categoryForm.name || !categoryForm.description) {
      setError('請填寫類別名稱和描述');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const subcategoriesArray = categoryForm.subcategories
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const newCategory = {
        name: categoryForm.name,
        description: categoryForm.description,
        imageUrl: categoryForm.imageUrl,
        subcategories: subcategoriesArray,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'categories'), newCategory);

      const categoryForDisplay: Category = {
        id: docRef.id,
        name: categoryForm.name,
        description: categoryForm.description,
        imageUrl: categoryForm.imageUrl,
        subcategories: subcategoriesArray,
      };

      setCategories([...categories, categoryForDisplay]);
      setShowAddCategoryModal(false);
      
      // Reset form
      setCategoryForm({
        name: '',
        description: '',
        imageUrl: '',
        subcategories: ''
      });
      setNewSubcategory('');
    } catch (error: any) {
      console.error('Error adding category:', error);
      setError(error.message || '新增類別失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      subcategories: category.subcategories.join(', ')
    });
    setNewSubcategory('');
    setShowEditCategoryModal(true);
  };

  const handleSaveCategoryEdit = async () => {
    if (!selectedCategory || !categoryForm.name || !categoryForm.description) {
      setError('請填寫類別名稱和描述');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const subcategoriesArray = categoryForm.subcategories
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const categoryRef = doc(db, 'categories', selectedCategory.id);
      await updateDoc(categoryRef, {
        name: categoryForm.name,
        description: categoryForm.description,
        imageUrl: categoryForm.imageUrl,
        subcategories: subcategoriesArray,
        updatedAt: serverTimestamp()
      });

      const updatedCategories = categories.map(category =>
        category.id === selectedCategory.id
          ? {
              ...category,
              name: categoryForm.name,
              description: categoryForm.description,
              imageUrl: categoryForm.imageUrl,
              subcategories: subcategoriesArray,
            }
          : category
      );
      setCategories(updatedCategories);
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
    } catch (error: any) {
      console.error('Error updating category:', error);
      setError(error.message || '更新類別失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('確定要刪除此類別嗎？這可能會影響使用此類別的產品。')) return;

    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('刪除類別失敗');
    }
  };

  const mockProductStats = {
    totalOrders: 156,
    totalRevenue: 2847.50,
    lastOrderDate: '2024-01-15'
  };

  if (loading) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入產品資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">產品管理</h1>
            <p className="text-gray-600">管理目錄中的所有產品</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCategoryModal(true)}
              className="btn-secondary"
            >
              <Tag className="w-4 h-4 mr-2" />
              管理類別
            </button>
            <Link 
              href="/admin/products/add"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增產品
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋產品</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜尋產品名稱或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">類別篩選</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">所有類別</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              產品 ({filteredProducts.length})
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>最後更新：{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  產品名稱
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類別 / 供應商
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  價格
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  庫存
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description?.substring(0, 40)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category}</div>
                    <div className="text-sm text-gray-500">
                      {product.supplier 
                        ? (suppliers.find(s => s.id === product.supplier)?.companyName || suppliers.find(s => s.companyName === product.supplier)?.companyName || product.supplier)
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${product.price} / {product.unit || '單位'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stockQuantity > 100 ? 'text-green-600 bg-green-100' :
                      product.stockQuantity > 0 ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {product.stockQuantity} 庫存
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isAvailable ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {product.isAvailable ? '可購買' : '不可購買'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewProduct(product)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                        title="查看詳情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                        title="編輯產品"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="刪除產品"
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
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">未找到產品</h3>
          <p className="text-gray-600">
            請調整搜尋條件來找到您要找的內容。
          </p>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">產品詳情</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="mb-6">
                  {selectedProduct.imageUrl && (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Product Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">產品資訊</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">產品名稱</label>
                      <p className="text-lg font-medium text-gray-900">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">產品描述</label>
                      <p className="text-sm text-gray-900">{selectedProduct.description || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">類別</label>
                      <p className="text-sm text-gray-900">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">子類別</label>
                      <p className="text-sm text-gray-900">{selectedProduct.subcategory || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">供應商</label>
                      <p className="text-sm text-gray-900">
                        {selectedProduct.supplier 
                          ? (suppliers.find(s => s.id === selectedProduct.supplier)?.companyName || suppliers.find(s => s.companyName === selectedProduct.supplier)?.companyName || selectedProduct.supplier)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">價格</label>
                      <p className="text-lg font-bold text-gray-900">${selectedProduct.price} / {selectedProduct.unit || '單位'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">庫存數量</label>
                      <p className="text-sm text-gray-900">{selectedProduct.stockQuantity} {selectedProduct.unit || '單位'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">最小訂購量</label>
                      <p className="text-sm text-gray-900">{selectedProduct.minOrderQuantity || 1} {selectedProduct.unit || '單位'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">狀態</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedProduct.isAvailable ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {selectedProduct.isAvailable ? '可購買' : '不可購買'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Statistics */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">產品統計</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-blue-600">總訂單</p>
                          <p className="text-xl font-bold text-blue-900">{mockProductStats.totalOrders}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm text-green-600">總收入</p>
                          <p className="text-xl font-bold text-green-900">${mockProductStats.totalRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm text-purple-600">最後訂單</p>
                          <p className="text-xl font-bold text-purple-900">{mockProductStats.lastOrderDate}</p>
                        </div>
                      </div>
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 max-h-[90vh] overflow-y-auto shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">新增產品</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品名稱 *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入產品名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品編號</label>
                  <input
                    type="text"
                    value={addForm.productCode}
                    onChange={(e) => setAddForm({...addForm, productCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="#10111"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品描述</label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({...addForm, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入產品描述"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別 *</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({...addForm, category: e.target.value, subcategory: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">選擇類別</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">子類別</label>
                  <select
                    value={addForm.subcategory}
                    onChange={(e) => setAddForm({...addForm, subcategory: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={!addForm.category}
                  >
                    <option value="">{addForm.category ? '選擇子類別' : '請先選擇主類別'}</option>
                    {getSubcategoriesForCategory(addForm.category).map(subcategory => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                  {!addForm.category && (
                    <p className="text-xs text-gray-500 mt-1">請先選擇主類別以查看可用的子類別</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">價格 *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.price}
                      onChange={(e) => setAddForm({...addForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">單位</label>
                    <select
                      value={addForm.unit}
                      onChange={(e) => setAddForm({...addForm, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">選擇單位</option>
                      <option value="斤">斤</option>
                      <option value="公斤">公斤</option>
                      <option value="磅">磅</option>
                      <option value="包">包</option>
                      <option value="盒">盒</option>
                      <option value="箱">箱</option>
                      <option value="個">個</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">庫存數量 *</label>
                    <input
                      type="number"
                      value={addForm.stockQuantity}
                      onChange={(e) => setAddForm({...addForm, stockQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">最小訂購量</label>
                    <input
                      type="number"
                      value={addForm.minOrderQuantity}
                      onChange={(e) => setAddForm({...addForm, minOrderQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">供應商</label>
                  <select
                    value={addForm.supplier}
                    onChange={(e) => setAddForm({...addForm, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">選擇供應商</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.companyName || supplier.name}
                      </option>
                    ))}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">目前沒有註冊的供應商</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品圖片</label>
                  <MultipleImageUploader
                    value={addForm.imageUrls}
                    onChange={(urls) => setAddForm({...addForm, imageUrls: urls, imageUrl: urls.length > 0 ? urls[0] : ''})}
                    onError={(error) => setError(error)}
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addForm.isAvailable}
                      onChange={(e) => setAddForm({...addForm, isAvailable: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">可購買</span>
                  </label>
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
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '新增中...' : '新增產品'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 max-h-[90vh] overflow-y-auto shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">編輯產品</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品名稱 *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品描述</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別 *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value, subcategory: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">選擇類別</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">子類別</label>
                  <select
                    value={editForm.subcategory}
                    onChange={(e) => setEditForm({...editForm, subcategory: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={!editForm.category}
                  >
                    <option value="">{editForm.category ? '選擇子類別' : '請先選擇主類別'}</option>
                    {getSubcategoriesForCategory(editForm.category).map(subcategory => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                  {!editForm.category && (
                    <p className="text-xs text-gray-500 mt-1">請先選擇主類別以查看可用的子類別</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">價格 *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">單位</label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">選擇單位</option>
                      <option value="斤">斤</option>
                      <option value="公斤">公斤</option>
                      <option value="磅">磅</option>
                      <option value="包">包</option>
                      <option value="盒">盒</option>
                      <option value="箱">箱</option>
                      <option value="個">個</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">庫存數量 *</label>
                    <input
                      type="number"
                      value={editForm.stockQuantity}
                      onChange={(e) => setEditForm({...editForm, stockQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">最小訂購量</label>
                    <input
                      type="number"
                      value={editForm.minOrderQuantity}
                      onChange={(e) => setEditForm({...editForm, minOrderQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">供應商</label>
                  <select
                    value={editForm.supplier}
                    onChange={(e) => setEditForm({...editForm, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">選擇供應商</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.companyName || supplier.name}
                      </option>
                    ))}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">目前沒有註冊的供應商</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">產品圖片</label>
                  <ImageUploader
                    value={editForm.imageUrl}
                    onChange={(url) => setEditForm({...editForm, imageUrl: url})}
                    onError={(error) => setError(error)}
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.isAvailable}
                      onChange={(e) => setEditForm({...editForm, isAvailable: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">可購買</span>
                  </label>
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">類別管理</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    新增類別
                  </button>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium">子類別 ({category.subcategories.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {category.subcategories.slice(0, 4).map((sub, index) => (
                              <span key={index} className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded border border-primary-200">
                                {sub}
                              </span>
                            ))}
                            {category.subcategories.length > 4 && (
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                +{category.subcategories.length - 4} 更多
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                          title="編輯類別"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="刪除類別"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 max-h-[90vh] overflow-y-auto shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">新增類別</h3>
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別名稱 *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入類別名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別描述 *</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入類別描述"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別圖片</label>
                  <ImageUploader
                    value={categoryForm.imageUrl}
                    onChange={(url) => setCategoryForm({...categoryForm, imageUrl: url})}
                    onError={(error) => setError(error)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">子類別</label>
                  
                  {/* Add new subcategory */}
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSubcategory()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="輸入子類別名稱"
                    />
                    <button
                      type="button"
                      onClick={addSubcategory}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      disabled={!newSubcategory.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Display existing subcategories */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">已添加的子類別:</p>
                    <div className="flex flex-wrap gap-2">
                      {getSubcategoriesArray(categoryForm.subcategories).map((subcategory, index) => (
                        <div key={index} className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                          <span className="text-sm">{subcategory}</span>
                          <button
                            type="button"
                            onClick={() => removeSubcategory(subcategory)}
                            className="ml-2 text-gray-500 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {getSubcategoriesArray(categoryForm.subcategories).length === 0 && (
                        <p className="text-sm text-gray-400 italic">尚未添加任何子類別</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '新增中...' : '新增類別'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 max-h-[90vh] overflow-y-auto shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">編輯類別</h3>
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別名稱 *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別描述 *</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">類別圖片</label>
                  <ImageUploader
                    value={categoryForm.imageUrl}
                    onChange={(url) => setCategoryForm({...categoryForm, imageUrl: url})}
                    onError={(error) => setError(error)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">子類別</label>
                  
                  {/* Add new subcategory */}
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSubcategory()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="輸入子類別名稱"
                    />
                    <button
                      type="button"
                      onClick={addSubcategory}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      disabled={!newSubcategory.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Display existing subcategories */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">已添加的子類別:</p>
                    <div className="flex flex-wrap gap-2">
                      {getSubcategoriesArray(categoryForm.subcategories).map((subcategory, index) => (
                        <div key={index} className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                          <span className="text-sm">{subcategory}</span>
                          <button
                            type="button"
                            onClick={() => removeSubcategory(subcategory)}
                            className="ml-2 text-gray-500 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {getSubcategoriesArray(categoryForm.subcategories).length === 0 && (
                        <p className="text-sm text-gray-400 italic">尚未添加任何子類別</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCategoryEdit}
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