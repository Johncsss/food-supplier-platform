'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Package, Check, X, AlertCircle, Plus, Minus } from 'lucide-react';
import { Product } from '@/shared/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useCart } from '@/components/providers/CartProvider';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

interface Supplier {
  id: string;
  companyName: string;
  name: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { addToCart, state, getItemQuantity, updateQuantity } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Get the category of items in the cart
  const cartCategory = state.items.length > 0 ? state.items[0].category : null;
  const cartQuantity = product ? getItemQuantity(product.id) : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = productSnap.data();
          const imageUrls = data.imageUrls || [];
          const imageUrl = data.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : '');
          
          const productData: Product = {
            id: productSnap.id,
            name: data.name || '',
            description: data.description || '',
            category: data.category || '',
            subcategory: data.subcategory || '',
            price: data.price || 0,
            unit: data.unit || '',
            minOrderQuantity: data.minOrderQuantity || 1,
            stockQuantity: data.stockQuantity || 0,
            imageUrl: imageUrl,
            imageUrls: imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []),
            isAvailable: data.isAvailable ?? true,
            supplier: data.supplier || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          };
          setProduct(productData);
          setSelectedImageIndex(0);
        } else {
          // Product not found - could redirect to products page
        }
        
        // Fetch suppliers
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

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

  const isDifferentCategory = cartCategory && product && product.category !== cartCategory;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入產品資料中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到產品</h2>
            <p className="text-gray-600 mb-6">找不到該產品資料</p>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回產品目錄
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>返回</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="card">
            {/* Main Image */}
            <div className="mb-4">
              <img
                src={product.imageUrls && product.imageUrls.length > 0 
                  ? product.imageUrls[selectedImageIndex] 
                  : product.imageUrl || '/placeholder-product.svg'}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.svg';
                }}
              />
            </div>
            
            {/* Thumbnails */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.svg';
                      }}
                    />
                    {selectedImageIndex === index && (
                      <div className="absolute inset-0 bg-primary-600 bg-opacity-20" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Price */}
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-bold text-primary-600">HKD$ {product.price}</span>
              <span className="text-xl text-gray-600 ml-2">/{product.unit}</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">產品描述</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">產品資訊</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">類別</span>
                  <span className="font-medium text-gray-900">{product.category}</span>
                </div>
                
                {product.subcategory && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">子類別</span>
                    <span className="font-medium text-gray-900">{product.subcategory}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">供應商</span>
                  <span className="font-medium text-gray-900">
                    {product.supplier 
                      ? (suppliers.find(s => s.id === product.supplier)?.companyName || suppliers.find(s => s.companyName === product.supplier)?.companyName || product.supplier)
                      : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">庫存數量</span>
                  <span className="font-medium text-gray-900">{product.stockQuantity} {product.unit}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">最小訂購量</span>
                  <span className="font-medium text-gray-900">{product.minOrderQuantity} {product.unit}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">狀態</span>
                  <span className={`flex items-center font-medium ${product.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {product.isAvailable ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        有庫存
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        缺貨
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Restriction Warning */}
            {cartCategory && isDifferentCategory && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    目前購物車包含 <span className="font-semibold">{cartCategory}</span> 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
                  </p>
                </div>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {cartQuantity > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">數量</span>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleQuantityChange(product, cartQuantity - 1)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        disabled={cartQuantity <= product.minOrderQuantity}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-lg w-12 text-center">{cartQuantity}</span>
                      <button
                        onClick={() => handleQuantityChange(product, cartQuantity + 1)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/cart')}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      <span>查看購物車</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.isAvailable || isDifferentCategory}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title={isDifferentCategory ? `只能選擇 ${cartCategory} 類別的產品` : ''}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span>
                    {isDifferentCategory 
                      ? '不同類別不能加入' 
                      : !product.isAvailable 
                      ? '暫時缺貨' 
                      : '加入購物車'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

