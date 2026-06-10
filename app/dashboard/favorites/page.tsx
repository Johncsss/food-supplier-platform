'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Trash2, Search, Package, ShoppingCart, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/shared/types';

interface FavoriteItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  createdAt?: any;
}

export default function FavoritesPage() {
  const { firebaseUser } = useAuth();
  const { addToCart, getItemQuantity, updateQuantity, state } = useCart();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('所有類別');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const loadFavorites = async () => {
    if (!firebaseUser?.uid) {
      setFavorites([]);
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const favRef = collection(db, 'users', firebaseUser.uid, 'favorites');
      const snap = await getDocs(favRef);
      const list: FavoriteItem[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          productId: data.productId || d.id,
          name: data.name || '',
          price: data.price || 0,
          imageUrl: data.imageUrl || '',
          category: data.category || '',
          createdAt: data.createdAt,
        };
      });
      setFavorites(list);

      // Fetch full product details for favorites
      const productDocs = await Promise.all(
        list.map(async (fav) => {
          try {
            const ref = doc(db, 'products', fav.productId);
            const pSnap = await getDoc(ref);
            if (!pSnap.exists()) return null;
            const data = pSnap.data() as any;
            const product: Product = {
              id: pSnap.id,
              name: data.name || fav.name || '',
              description: data.description || '',
              category: data.category || fav.category || '',
              subcategory: data.subcategory || '',
              price: typeof data.price === 'number' ? data.price : fav.price || 0,
              unit: data.unit || '',
              minOrderQuantity: data.minOrderQuantity || 1,
              stockQuantity: data.stockQuantity || 0,
              imageUrl: data.imageUrl || fav.imageUrl || '',
              isAvailable: data.isAvailable ?? true,
              supplier: data.supplier || '',
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
            };
            return product;
          } catch (e) {
            return null;
          }
        })
      );
      const validProducts = productDocs.filter((p): p is Product => !!p);
      setProducts(validProducts);
    } catch (err) {
      console.error('Failed to load favorites', err);
      toast.error('無法載入收藏清單');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [firebaseUser?.uid]);

  const removeFavorite = async (favId: string) => {
    if (!firebaseUser?.uid) return;
    try {
      await deleteDoc(doc(db, 'users', firebaseUser.uid, 'favorites', favId));
      setFavorites((prev) => prev.filter((x) => x.id !== favId));
      setProducts((prev) => prev.filter((x) => x.id !== favId));
      toast.success('已從收藏移除');
    } catch (err) {
      console.error('Failed to remove favorite', err);
      toast.error('移除失敗');
    }
  };

  // Derived categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filters and sorting
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, products.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Cart helpers
  const cartCategory = state.items.length > 0 ? state.items[0].category : null;
  const handleAddToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      category: product.category,
      supplier: product.supplier,
      quantity: product.minOrderQuantity,
      unitPrice: product.price,
      imageUrl: product.imageUrl,
      unit: product.unit,
    });
  };
  const handleQuantityChange = (product: Product, newQuantity: number) => {
    if (newQuantity <= 0) {
      updateQuantity(product.id, 0);
      return;
    }

    if (newQuantity < product.minOrderQuantity) {
      updateQuantity(product.id, 0);
      return;
    }

      updateQuantity(product.id, newQuantity);
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">收藏產品</h1>
        <p className="text-gray-600">管理您已收藏的產品，快速前往下單。</p>
      </div>

        {cartCategory && (
          <div className="mb-2 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                目前購物車包含 <span className="font-semibold">{cartCategory}</span> 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
              </p>
            </div>
          </div>
        )}

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜尋收藏產品..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="所有類別">所有類別</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入收藏中...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="py-16 text-center text-gray-500">尚未有收藏的產品</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => {
                const cartQuantity = getItemQuantity(product.id);
                const fav = favorites.find(f => f.productId === product.id);
                const favId = fav?.id || product.id;
                return (
                  <div key={product.id} className="card p-4 hover:shadow-lg transition-shadow">
                    <div className="relative mb-4">
                      <Link href={`/products/${encodeURIComponent(product.id)}`}>
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
                      </Link>
                    </div>

                    <div className="mb-4">
                      <Link href={`/products/${encodeURIComponent(product.id)}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <Link href={`/products/${encodeURIComponent(product.id)}`}>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary-600">HKD$ {product.price} / {product.unit}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {cartQuantity > 0 ? (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleQuantityChange(product, cartQuantity - 1)}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            disabled={cartQuantity <= 0}
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
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.isAvailable || !!(cartCategory && product.category !== cartCategory)}
                          className="w-full text-white py-2 px-4 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-opacity flex items-center justify-center space-x-2 hover:opacity-90"
                          style={{ backgroundColor: '#0B8628' }}
                          title={cartCategory && product.category !== cartCategory ? `只能選擇 ${cartCategory} 類別的產品` : ''}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>訂貨</span>
                        </button>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <p>最低訂購量: {product.minOrderQuantity} {product.unit}</p>
                          <p>庫存: {product.stockQuantity} {product.unit}</p>
                        </div>
                    <button
                          onClick={() => removeFavorite(favId)}
                      className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      移除
                    </button>
                  </div>
                </div>
              </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8">
              <p className="text-sm text-gray-600">
                顯示第{' '}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, sortedProducts.length)}
                </span>{' '}
                筆，共 <span className="font-medium">{sortedProducts.length}</span> 筆收藏產品
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                <span className="text-sm text-gray-600">
                  第 <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages} 頁
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

