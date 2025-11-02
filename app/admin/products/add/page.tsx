'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import MultipleImageUploader from '@/components/ui/MultipleImageUploader';
import { categories as defaultCategories } from '@/shared/products';
import { Category } from '@/shared/types';

interface Supplier {
  id: string;
  companyName: string;
  name: string;
}

interface ProductFormData {
  name: string;
  productCode: string;
  category: string;
  subcategory: string;
  price: number;
  unit: string;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  stockQuantity: number;
  supplier: string;
  description: string;
  imageUrls: string[];
}

export default function AddProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      productCode: '',
      imageUrls: [],
      stockQuantity: 0,
      minOrderQuantity: 1,
      maxOrderQuantity: 0,
    }
  });

  // Helper function to get subcategories for a selected category
  const getSubcategoriesForCategory = (categoryName: string): string[] => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  };

  // Fetch categories from Firestore
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
      // Fallback to default categories on error
      setCategories(defaultCategories);
    }
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

  // Fetch data on component mount
  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Reset subcategory when category changes
  const watchedCategory = watch('category');
  useEffect(() => {
    if (watchedCategory) {
      setValue('subcategory', '');
    }
  }, [watchedCategory, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);

    try {
      // Validate order quantities
      if (data.maxOrderQuantity > 0) {
        if (data.maxOrderQuantity > 100) {
          toast.error('最多訂貨量不能超過100');
          setIsLoading(false);
          return;
        }
        if (data.maxOrderQuantity < data.minOrderQuantity) {
          toast.error('最多訂貨量必須大於或等於最低訂貨量');
          setIsLoading(false);
          return;
        }
      }

      if (data.minOrderQuantity <= 0) {
        toast.error('最低訂貨量必須大於0');
        setIsLoading(false);
        return;
      }

      // Save to Firestore
      const productData = {
        name: data.name,
        productCode: data.productCode || '',
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        price: Number(data.price),
        unit: data.unit,
        minOrderQuantity: Number(data.minOrderQuantity),
        maxOrderQuantity: data.maxOrderQuantity > 0 ? Number(data.maxOrderQuantity) : undefined,
        stockQuantity: Number(data.stockQuantity),
        imageUrl: data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : '', // Keep first image for backward compatibility
        imageUrls: data.imageUrls || [], // Store all images
        isAvailable: true,
        supplier: data.supplier,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);
      
      toast.success('產品新增成功！');
      router.back();
    } catch (error: any) {
      toast.error(error.message || '新增產品時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/admin/products" className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">新增產品</h1>
                <p className="text-gray-600">新增產品到目錄</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                產品名稱
              </label>
              <input
                type="text"
                {...register('name', { required: '產品名稱為必填項目' })}
                className="input-field"
                placeholder="例如：新鮮有機番茄"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                產品編號
              </label>
              <input
                type="text"
                {...register('productCode')}
                className="input-field"
                placeholder="#10111"
              />
              {errors.productCode && (
                <p className="text-red-500 text-sm mt-1">{errors.productCode.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  類別
                </label>
                <select
                  {...register('category', { required: '類別為必填項目' })}
                  className="input-field"
                >
                  <option value="">選擇類別</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                子類別
              </label>
              <select
                {...register('subcategory')}
                className="input-field"
                disabled={!watch('category')}
              >
                <option value="">{watch('category') ? '選擇子類別' : '請先選擇主類別'}</option>
                {getSubcategoriesForCategory(watch('category')).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
              {!watch('category') && (
                <p className="text-xs text-gray-500 mt-1">請先選擇主類別以查看可用的子類別</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  價格
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', {
                      required: '價格為必填項目',
                      min: { value: 0, message: '價格不能為負數' },
                      valueAsNumber: true
                    })}
                    className="input-field pl-8"
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  計量單位
                </label>
                <select
                  {...register('unit', { required: '計量單位為必填項目' })}
                  className="input-field"
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
                {errors.unit && (
                  <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  庫存數量
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('stockQuantity', {
                    required: '庫存數量為必填項目',
                    min: { value: 0, message: '庫存數量不能為負數' },
                    valueAsNumber: true
                  })}
                  className="input-field"
                  placeholder="0"
                />
                {errors.stockQuantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.stockQuantity.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最低訂貨量 *
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('minOrderQuantity', {
                    required: '最低訂貨量為必填項目',
                    min: { value: 1, message: '最低訂貨量必須大於0' },
                    valueAsNumber: true
                  })}
                  className="input-field"
                  placeholder="1"
                />
                {errors.minOrderQuantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.minOrderQuantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最多訂貨量
                </label>
                <input
                  type="number"
                  step="1"
                  max="100"
                  {...register('maxOrderQuantity', {
                    min: { value: 0, message: '最多訂貨量不能為負數' },
                    max: { value: 100, message: '最多訂貨量不能超過100' },
                    valueAsNumber: true
                  })}
                  className="input-field"
                  placeholder="0 (無限制)"
                />
                {errors.maxOrderQuantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxOrderQuantity.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">最多100，留空或設為0表示無限制</p>
              </div>
            </div>

                          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  供應商
                </label>
                <select
                  {...register('supplier', { required: '供應商為必填項目' })}
                  className="input-field"
                >
                  <option value="">選擇供應商</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.companyName || supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplier && (
                  <p className="text-red-500 text-sm mt-1">{errors.supplier.message}</p>
                  )}
                {suppliers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">目前沒有註冊的供應商</p>
                )}
              </div>

                          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  {...register('description', { required: '描述為必填項目' })}
                  rows={4}
                  className="input-field"
                  placeholder="描述產品..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  產品圖片
                </label>
                <MultipleImageUploader
                  value={watch('imageUrls') || []}
                  onChange={(urls) => setValue('imageUrls', urls)}
                  onError={(error) => toast.error(error)}
                />
                <input
                  {...register('imageUrls')}
                  type="hidden"
                />
              </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/admin/products" className="btn-outline">
                取消
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '新增產品中...' : '新增產品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 