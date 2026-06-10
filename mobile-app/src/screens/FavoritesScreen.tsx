import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { db } from '../../../shared/firebase';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useCart } from '../hooks/useCart';
import { Product } from '../../../shared/types';

interface FavoriteItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  createdAt?: any;
}

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { firebaseUser } = useAuth();
  const { addToCart, items: cartItems, updateQuantity } = useCart();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [unitById, setUnitById] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  // Identify the current cart's category (if any) to enforce single-category flow like Category screen
  const cartCategory = cartItems.length > 0 ? cartItems[0].category : null;

  const loadFavorites = async () => {
    if (!firebaseUser?.uid) {
      setItems([]);
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
      setItems(list);
    } catch (err) {
      console.error('Failed to load favorites', err);
      Alert.alert('錯誤', '無法載入收藏清單');
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
      setItems((prev) => prev.filter((x) => x.id !== favId));
      Alert.alert('已移除', '已從收藏移除');
    } catch (err) {
      console.error('Failed to remove favorite', err);
      Alert.alert('錯誤', '移除失敗');
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];
  const filteredItems = items.filter((i) => {
    const matchesTag = !selectedTag || i.category === selectedTag;
    const matchesSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  // Enrich favorites with unit from product docs
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const entries = await Promise.all(
          items.map(async (fav) => {
            try {
              const snap = await getDoc(doc(db, 'products', fav.productId));
              const unit = (snap.exists() && (snap.data() as any).unit) || '';
              return [fav.productId, unit] as [string, string];
            } catch {
              return [fav.productId, ''] as [string, string];
            }
          })
        );
        const map: Record<string, string> = {};
        entries.forEach(([pid, unit]) => {
          map[pid] = unit || '';
        });
        setUnitById(map);
      } catch {}
    };
    if (items.length > 0) {
      fetchUnits();
    } else {
      setUnitById({});
    }
  }, [items]);

  const getCartQuantity = (productId: string): number => {
    const found = cartItems.find((x) => x.productId === productId);
    return found ? found.quantity : 0;
  };

  const handleAddToCart = async (fav: FavoriteItem) => {
    try {
      const productRef = doc(db, 'products', fav.productId);
      const snap = await getDoc(productRef);
      if (!snap.exists()) {
        Alert.alert('錯誤', '找不到產品資料');
        return;
      }
      const data = snap.data() as any;
      const product: Product = {
        id: fav.productId,
        name: data.name || fav.name || '',
        description: data.description || '',
        category: data.category || fav.category || '',
        subcategory: data.subcategory || '',
        price: data.price ?? fav.price ?? 0,
        unit: data.unit || '',
        minOrderQuantity: data.minOrderQuantity || 1,
        stockQuantity: data.stockQuantity || 0,
        imageUrl: data.imageUrl || fav.imageUrl || '',
        isAvailable: data.isAvailable ?? true,
        supplier: data.supplier || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
      addToCart(product);
    } catch (e) {
      console.error('Failed to add to cart from favorites', e);
      Alert.alert('錯誤', '加入購物車失敗');
    }
  };

  const renderItem = ({ item }: { item: FavoriteItem }) => {
    const isDifferentCategory = !!cartCategory && item.category !== cartCategory;
    const currentQty = getCartQuantity(item.productId);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.thumbnailWrap}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="image-outline" size={22} color="#9CA3AF" />
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductDetail' as never, { productId: item.productId } as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
            <Text style={styles.category}>{item.category || ''}</Text>
            <View style={styles.productFooter}>
              <Text style={styles.price}>
                HKD ${item.price} {unitById[item.productId] ? `/ ${unitById[item.productId]}` : ''}
              </Text>
              <View style={styles.cartSection}>
                {currentQty > 0 && (
                  <>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => {
                        const nextQty = Math.max(0, currentQty - 1);
                        updateQuantity(item.productId, nextQty);
                      }}
                    >
                      <Ionicons name="remove" size={20} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>{currentQty}</Text>
                    </View>
                  </>
                )}
                <TouchableOpacity
                  style={[styles.addButton, isDifferentCategory && styles.addButtonDisabled]}
                  onPress={() => {
                    if (!isDifferentCategory) {
                      handleAddToCart(item);
                    }
                  }}
                  disabled={isDifferentCategory}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="actions" style={styles.actions}>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFavorite(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.removeText}>移除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>收藏產品</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>尚未有收藏的產品</Text>
        </View>
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="搜尋產品..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          </View>

          {/* Category Restriction Warning */}
          {cartCategory && (
            <View style={styles.warningBanner}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
              <Text style={styles.warningText}>
                目前購物車包含 {cartCategory} 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
              </Text>
            </View>
          )}

          {/* Tags filter */}
          <View style={styles.tagsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScroll}
            >
              <TouchableOpacity
                style={[styles.tag, !selectedTag && styles.tagActive]}
                onPress={() => setSelectedTag('')}
              >
                <Text style={[styles.tagText, !selectedTag && styles.tagTextActive]}>全部</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tag, selectedTag === cat && styles.tagActive]}
                  onPress={() => setSelectedTag(cat)}
                >
                  <Text style={[styles.tagText, selectedTag === cat && styles.tagTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  tagsWrap: { marginHorizontal: 20, marginBottom: 15 },
  tagsScroll: { paddingRight: 20 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tagText: { color: '#666', fontSize: 14, fontWeight: '500' },
  tagTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardRow: { flexDirection: 'row', padding: 12 },
  thumbnailWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  category: { marginTop: 2, fontSize: 12, color: '#666' },
  productFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  cartSection: { flexDirection: 'row', alignItems: 'center' },
  quantityBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quantityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#10B981',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  removeButton: {
    backgroundColor: '#F3F4F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { color: '#2563EB', fontSize: 14 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeText: { marginLeft: 6, color: '#EF4444', fontSize: 14 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default FavoritesScreen;

