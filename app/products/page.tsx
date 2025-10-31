'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Search, Filter, ShoppingCart, Star, Package, Plus, Minus } from 'lucide-react';
import { Product, Category } from '@/shared/types';
import { t } from '@/lib/translate';
import { useCart } from '@/components/providers/CartProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { categories as defaultCategories } from '@/shared/products';

export default function Products() {
  const router = useRouter();
  const { addToCart, getItemQuantity, updateQuantity, state } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('所有類別');
  const [sortBy, setSortBy] = useState('name');

  // Get category from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);
  
  // Get the category of items in the cart
  const cartCategory = state.items.length > 0 ? state.items[0].category : null;

  // Fetch products and categories from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const fetchedProducts: Product[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            category: data.category || '',
            subcategory: data.subcategory || '',
            price: data.price || 0,
            unit: data.unit || '',
            minOrderQuantity: data.minOrderQuantity || 1,
            stockQuantity: data.stockQuantity || 0,
            imageUrl: data.imageUrl || '',
            isAvailable: data.isAvailable ?? true,
            supplier: data.supplier || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          };
        });
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

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '所有類別' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleAddToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      category: product.category,
      supplier: product.supplier,
      quantity: product.minOrderQuantity,
      unitPrice: product.price,
      imageUrl: product.imageUrl,
      unit: product.unit
    });
  };

  const handleQuantityChange = (product: Product, newQuantity: number) => {
    if (newQuantity >= product.minOrderQuantity) {
      updateQuantity(product.id, newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">產品目錄</h1>
          <p className="text-gray-600">
            瀏覽我們豐富的優質食品產品，為您的餐廳提供最佳選擇。
          </p>
        </div>

        {/* Category Restriction Warning */}
        {cartCategory && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  目前購物車包含 <span className="font-semibold">{cartCategory}</span> 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜尋產品..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="所有類別">所有類別</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">按名稱排序</option>
                <option value="price-low">價格從低到高</option>
                <option value="price-high">價格從高到低</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入產品中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => {
            const cartQuantity = getItemQuantity(product.id);
            
            return (
              <div key={product.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div 
                  className="relative mb-4 cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <img
                    src={product.imageUrl || '/placeholder-product.svg'}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <span className="text-white font-semibold">缺貨</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h3 
                    className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {product.name}
                  </h3>
                  <p 
                    className="text-gray-600 text-sm mb-2 cursor-pointer line-clamp-2"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-600">HKD$ {product.price} / {product.unit}</span>
                  </div>
                </div>

                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  {cartQuantity > 0 ? (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleQuantityChange(product, cartQuantity - 1)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        disabled={cartQuantity <= product.minOrderQuantity}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold">{cartQuantity}</span>
                      <button
                        onClick={() => handleQuantityChange(product, cartQuantity + 1)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={!product.isAvailable || !!(cartCategory && product.category !== cartCategory)}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                      title={cartCategory && product.category !== cartCategory ? `只能選擇 ${cartCategory} 類別的產品` : ''}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>訂貨</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <p>最低訂購量: {product.minOrderQuantity} {product.unit}</p>
                  <p>庫存: {product.stockQuantity} {product.unit}</p>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {!loading && sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">沒有找到產品</h3>
            <p className="text-gray-600">請嘗試調整搜尋條件或類別篩選。</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
} 