import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Dimensions, Modal, Linking, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { db } from '../services/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { Product } from '../../../shared/types';
import {
  consumeSuppressHomePopupOnce,
  hasShownPopupBannerThisSession,
  markPopupBannerShownThisSession,
} from '../utils/popupBannerSession';

const { width, height } = Dimensions.get('window');

const DEFAULT_SECTION_VISIBILITY = {
  logo: true,
  banners: true,
  categories: true,
  longBanners: true,
  promotionalBanners: true,
  squareBanners: true,
  popupBanner: true,
};

type SectionKey = keyof typeof DEFAULT_SECTION_VISIBILITY;
type SectionVisibilityState = Record<SectionKey, boolean>;

const resolveSectionVisibility = (
  key: SectionKey,
  sectionData?: any,
  displaySettings?: Record<string, any>,
): boolean => {
  if (sectionData && typeof sectionData.enabled === 'boolean') {
    return sectionData.enabled;
  }
  if (displaySettings && typeof displaySettings[key] === 'boolean') {
    return displaySettings[key];
  }
  return DEFAULT_SECTION_VISIBILITY[key];
};

const HomeScreen: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { addToCart, updateQuantity, items, state } = useCart();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [showPopupBanner, setShowPopupBanner] = useState(false);
  const [popupBannerImage, setPopupBannerImage] = useState<string | null>(null);
  const [mobileAppData, setMobileAppData] = useState<any>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState<string>('iFoodPulse');
  const [welcomeText, setWelcomeText] = useState<string>('歡迎選購');
  const [bannerData, setBannerData] = useState<any[]>([]);
  const [longBannerImage, setLongBannerImage] = useState<string | null>(null);
  const [promotionalBanners, setPromotionalBanners] = useState<any[]>([]);
  const [squareBanners, setSquareBanners] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[] | null>(null); // null = loading, [] = no data, [...] = has data
  const [isLoadingMobileAppData, setIsLoadingMobileAppData] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibilityState>(DEFAULT_SECTION_VISIBILITY);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const isSectionVisible = (key: SectionKey) => sectionVisibility[key] !== false;

  const dismissPopupBanner = () => {
    setShowPopupBanner(false);
    // Consider it "shown" once dismissed, so it won't re-open within the same session.
    markPopupBannerShownThisSession();
  };

  // Show popup banner at most once per session, and suppress once when coming from Cart.
  useFocusEffect(
    React.useCallback(() => {
      // Cart -> Home suppression (one-time)
      if (consumeSuppressHomePopupOnce()) {
        dismissPopupBanner();
        return;
      }

      // Only auto-show if enabled, has image, and hasn't been shown this session.
      if (
        sectionVisibility.popupBanner !== false &&
        popupBannerImage &&
        !hasShownPopupBannerThisSession()
      ) {
        markPopupBannerShownThisSession();
        setShowPopupBanner(true);
      }
    }, [popupBannerImage, sectionVisibility.popupBanner])
  );

  // Auto-slide functionality
  useEffect(() => {
    if (bannerData.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % bannerData.length;
        flatListRef.current?.scrollToIndex({ index: nextSlide, animated: true });
        return nextSlide;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [bannerData.length]);

  const renderBanner = ({ item }: { item: any }) => (
    <View style={styles.heroBanner}>
      <Image
        source={{ uri: item.image }}
        style={styles.heroImage}
        resizeMode="cover"
      />
    </View>
  );

  const renderPromotionalBanner = (banner: any, index: number) => (
    <TouchableOpacity
      key={banner.id}
      style={styles.promoBanner}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate(
          'PromotionBannerDetail' as never,
          { banner } as never
        )
      }
    >
      <Image
        source={{ uri: banner.image }}
        style={styles.promoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderLongBanner = (banner: any, index: number) => (
    <TouchableOpacity key={banner.id} style={styles.longBanner} activeOpacity={0.8}>
      <Image
        source={{ uri: banner.image }}
        style={styles.longBannerImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderSquareBanner = (banner: any, index: number) => {
    const handlePress = async () => {
      if (banner.url) {
        try {
          const canOpen = await Linking.canOpenURL(banner.url);
          if (canOpen) {
            await Linking.openURL(banner.url);
          } else {
            Alert.alert('錯誤', '無法開啟此 URL');
          }
        } catch (error) {
          Alert.alert('錯誤', '開啟連結時發生錯誤');
        }
      }
    };

    return (
      <TouchableOpacity 
        key={banner.id} 
        style={styles.squareBanner} 
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <Image
          source={{ uri: banner.image }}
          style={styles.squareBannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const renderQuickAction = (action: any, index: number) => {
    // Use screenRedirect from admin configuration if available, otherwise fallback to ID-based navigation
    const handleQuickActionPress = () => {
      if (action.screenRedirect) {
        // Use configured screen redirect from admin
        navigation.navigate(action.screenRedirect as never);
      } else {
        // Fallback to ID-based navigation for backward compatibility
        switch (action.id) {
          case 1:
            navigation.navigate('Categories' as never);
            break;
          case 2:
            navigation.navigate('RestaurantConstruction' as never);
            break;
          case 3:
            navigation.navigate('RestaurantFurniture' as never);
            break;
          case 4:
            navigation.navigate('KitchenEquipment' as never);
            break;
          case 5:
            navigation.navigate('Promotion' as never);
            break;
          case 6:
            navigation.navigate('DishesTableware' as never);
            break;
          case 7:
            navigation.navigate('RestaurantMaintenance' as never);
            break;
          case 8:
            navigation.navigate('RestaurantSystems' as never);
            break;
          default:
            console.log('Unknown quick action id:', action.id, 'title:', action.title);
        }
      }
    };

    return (
      <TouchableOpacity 
        key={action.id} 
        style={styles.quickActionItem} 
        activeOpacity={0.7}
        onPress={handleQuickActionPress}
      >
        <View style={styles.quickActionIcon}>
          {action.image ? (
            <Image
              source={{ uri: action.image }}
              style={styles.quickActionImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
      </TouchableOpacity>
    );
  };

  const getCartQuantity = (productId: string) => {
    const cartItem = items.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleIncreaseQuantity = (product: Product) => {
    addToCart(product);
  };

  const handleDecreaseQuantity = (product: Product) => {
    const currentQuantity = getCartQuantity(product.id);
    if (currentQuantity <= 0) return;
    updateQuantity(product.id, currentQuantity - 1);
  };

  const openQuantityModal = (product: Product) => {
    const currentQty = getCartQuantity(product.id);
    const initialQty = currentQty > 0 ? currentQty : product.minOrderQuantity || 1;
    setEditingProduct(product);
    setEditingQuantity(String(initialQty));
    setQuantityModalVisible(true);
  };

  const closeQuantityModal = () => {
    setQuantityModalVisible(false);
    setEditingProduct(null);
    setEditingQuantity('');
  };

  const confirmQuantityChange = () => {
    if (!editingProduct) return;
    const parsed = parseInt(editingQuantity, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateQuantity(editingProduct.id, parsed);
    } else {
      updateQuantity(editingProduct.id, 0);
    }
    closeQuantityModal();
  };

  const renderSearchProduct = ({ item }: { item: Product }) => {
    const quantity = getCartQuantity(item.id);
    const displayImage = item.imageUrl || (item.imageUrls?.[0] ?? '');
    const cartCategory = state.items.length > 0 ? state.items[0].category : null;
    const isDifferentCategory = cartCategory && item.category !== cartCategory;

    return (
      <TouchableOpacity
        style={styles.searchProductCard}
        onPress={() => {
          setSearchQuery('');
          setIsSearching(false);
          setIsSearchModalOpen(false);
          navigation.navigate('ProductDetail' as never, { productId: item.id } as never);
        }}
      >
        <View style={styles.searchProductThumbnailWrapper}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.searchProductThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.searchProductThumbnail, styles.searchProductThumbnailPlaceholder]}>
              <Ionicons name="image" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.searchProductInfo}>
          <Text style={styles.searchProductName}>{item.name}</Text>
          <Text style={styles.searchProductCategory}>{item.category}</Text>
          <View style={styles.searchProductFooter}>
            <Text style={styles.searchProductPrice}>
              HK${item.price.toFixed(2)}{item.unit ? ` / ${item.unit}` : ''}
            </Text>
            <View style={styles.searchProductCartControls}>
              <TouchableOpacity
                style={[styles.searchCartButton, styles.searchCartButtonOutline]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDecreaseQuantity(item);
                }}
                disabled={quantity === 0}
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={quantity === 0 ? '#9CA3AF' : '#0B8628'}
                />
              </TouchableOpacity>
              {quantity > 0 ? (
                <TouchableOpacity
                  style={styles.searchQuantityBadge}
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    openQuantityModal(item);
                  }}
                >
                  <Text style={styles.searchQuantityText}>{quantity}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.searchCartQuantityText}>{quantity}</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.searchCartButton,
                  styles.searchCartButtonFilled,
                  isDifferentCategory && styles.searchCartButtonDisabled
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (!isDifferentCategory) {
                    handleIncreaseQuantity(item);
                  }
                }}
                disabled={isDifferentCategory}
              >
                <Ionicons name="add" size={18} color={isDifferentCategory ? '#9CA3AF' : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentSlide(roundIndex);
  };

  const handleWhatsAppPress = async () => {
    const phoneNumber = '85298636938';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    const whatsappWebUrl = `https://wa.me/${phoneNumber}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web version if WhatsApp app is not installed
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('錯誤', '無法開啟 WhatsApp');
    }
  };

  // Fetch logo from settings (same source as website: settings/site.logoUrl)
  useEffect(() => {
    const fetchLogoFromSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const url = data.logoUrl || '';
          // Validate URL - only accept Firebase Storage URLs or valid HTTPS URLs
          if (url && url.trim() !== '' && 
              (url.startsWith('https://firebasestorage.googleapis.com/') || 
               (url.startsWith('https://') && !url.includes('unsplash.com')))) {
            setLogoImage(url);
          }
        }
      } catch (error: any) {
        // Settings are publicly accessible, but handle gracefully if there's an error
        if (error?.code !== 'permission-denied') {
          console.log('Error fetching logo from settings:', error);
        }
      }
    };
    
    fetchLogoFromSettings();
  }, []); // Only run once on mount

  // Fetch mobile app content from Firestore
  // Allow fetching even without authentication to show popup banner and other public content
  useEffect(() => {
    const fetchMobileAppData = async () => {
      console.log('🔄 Fetching mobile app data (visitor:', !firebaseUser, ')');
      setIsLoadingMobileAppData(true);
      try {
        const pageDoc = await getDoc(doc(db, 'pages', 'mobile-app'));
        if (pageDoc.exists()) {
          const data = pageDoc.data();
          console.log('✅ Successfully fetched mobile app data');
          console.log('Firestore 數據:', JSON.stringify(data, null, 2));
          console.log('longBanners 數據:', data.areas?.longBanners);
          const areasData = data.areas || null;
          setMobileAppData(areasData);

          const displaySettings = areasData?.displaySettings || {};
          const newVisibility: SectionVisibilityState = {
            logo: resolveSectionVisibility('logo', areasData?.logo, displaySettings),
            banners: resolveSectionVisibility('banners', areasData?.banners, displaySettings),
            categories: resolveSectionVisibility('categories', areasData?.categories, displaySettings),
            longBanners: resolveSectionVisibility('longBanners', areasData?.longBanners, displaySettings),
            promotionalBanners: resolveSectionVisibility('promotionalBanners', areasData?.promotionalBanners, displaySettings),
            squareBanners: resolveSectionVisibility('squareBanners', areasData?.squareBanners, displaySettings),
            popupBanner: resolveSectionVisibility('popupBanner', areasData?.popupBanner, displaySettings),
          };
          setSectionVisibility(newVisibility);
          
          // Use same logo source as website: settings/site.logoUrl (set on mount).
          // Only app title and welcome text come from mobile-app page; do not override logo from areasData.
          if (newVisibility.logo && areasData?.logo) {
            if (areasData.logo.appTitle) {
              setAppTitle(areasData.logo.appTitle);
            }
            if (areasData.logo.welcomeText) {
              setWelcomeText(areasData.logo.welcomeText);
            }
          } else if (!newVisibility.logo) {
            setLogoImage(null);
          }
          
          if (newVisibility.banners && areasData?.banners) {
            const banners: any[] = [];
            if (areasData.banners.banner1?.image) {
              banners.push({
                id: 1,
                image: areasData.banners.banner1.image,
                title: areasData.banners.banner1.title || '',
                subtitle: areasData.banners.banner1.subtitle || ''
              });
            }
            if (areasData.banners.banner2?.image) {
              banners.push({
                id: 2,
                image: areasData.banners.banner2.image,
                title: areasData.banners.banner2.title || '',
                subtitle: areasData.banners.banner2.subtitle || ''
              });
            }
            if (areasData.banners.banner3?.image) {
              banners.push({
                id: 3,
                image: areasData.banners.banner3.image,
                title: areasData.banners.banner3.title || '',
                subtitle: areasData.banners.banner3.subtitle || ''
              });
            }
            if (areasData.banners.banner4?.image) {
              banners.push({
                id: 4,
                image: areasData.banners.banner4.image,
                title: areasData.banners.banner4.title || '',
                subtitle: areasData.banners.banner4.subtitle || ''
              });
            }
            console.log('📊 Setting banner data:', banners.length, 'banners');
            setBannerData(banners);
          } else {
            console.log('⚠️ No banners found in data or section disabled');
            setBannerData([]);
          }
          
          if (newVisibility.longBanners && areasData?.longBanners?.long1?.image) {
            console.log('長型 Banner 圖片:', areasData.longBanners.long1.image);
            setLongBannerImage(areasData.longBanners.long1.image);
          } else {
            console.log('長型 Banner 圖片不存在或為空或區塊被隱藏');
            setLongBannerImage(null);
          }
          
          if (newVisibility.promotionalBanners && areasData?.promotionalBanners) {
            const promos: any[] = [];
            if (areasData.promotionalBanners.promo1?.image) {
              promos.push({
                id: 1,
                image: areasData.promotionalBanners.promo1.image,
                detailImage: areasData.promotionalBanners.promo1.detailImage || '',
                detailUrl: areasData.promotionalBanners.promo1.detailUrl || '',
                title: areasData.promotionalBanners.promo1.title || '',
                subtitle: areasData.promotionalBanners.promo1.subtitle || '',
              });
            }
            if (areasData.promotionalBanners.promo2?.image) {
              promos.push({
                id: 2,
                image: areasData.promotionalBanners.promo2.image,
                detailImage: areasData.promotionalBanners.promo2.detailImage || '',
                detailUrl: areasData.promotionalBanners.promo2.detailUrl || '',
                title: areasData.promotionalBanners.promo2.title || '',
                subtitle: areasData.promotionalBanners.promo2.subtitle || '',
              });
            }
            if (areasData.promotionalBanners.promo3?.image) {
              promos.push({
                id: 3,
                image: areasData.promotionalBanners.promo3.image,
                detailImage: areasData.promotionalBanners.promo3.detailImage || '',
                detailUrl: areasData.promotionalBanners.promo3.detailUrl || '',
                title: areasData.promotionalBanners.promo3.title || '',
                subtitle: areasData.promotionalBanners.promo3.subtitle || '',
              });
            }
            setPromotionalBanners(promos);
          } else {
            setPromotionalBanners([]);
          }
          
          if (newVisibility.squareBanners && areasData?.squareBanners) {
            const squares: any[] = [];
            if (Array.isArray(areasData.squareBanners)) {
              areasData.squareBanners.forEach((banner: any, index: number) => {
                if (banner?.image) {
                  squares.push({
                    id: index + 1,
                    image: banner.image,
                    url: banner.url || '',
                  });
                }
              });
            } else {
              if (areasData.squareBanners.square1?.image) {
                squares.push({
                  id: 1,
                  image: areasData.squareBanners.square1.image,
                  url: areasData.squareBanners.square1.url || '',
                });
              }
              if (areasData.squareBanners.square2?.image) {
                squares.push({
                  id: 2,
                  image: areasData.squareBanners.square2.image,
                  url: areasData.squareBanners.square2.url || '',
                });
              }
            }
            setSquareBanners(squares);
          } else {
            setSquareBanners([]);
          }
          
          if (newVisibility.categories && areasData?.categories) {
            const categories: any[] = [];
            if (areasData.categories.category1) {
              categories.push({
                id: 1,
                title: areasData.categories.category1.title || '食材訂購',
                image: areasData.categories.category1.image || '',
                icon: areasData.categories.category1.icon || 'restaurant-outline',
                color: areasData.categories.category1.color || '#10B981',
                screenRedirect: areasData.categories.category1.screenRedirect || 'Categories',
              });
            }
            if (areasData.categories.category2) {
              categories.push({
                id: 2,
                title: areasData.categories.category2.title || '餐廳工程',
                image: areasData.categories.category2.image || '',
                icon: areasData.categories.category2.icon || 'construct-outline',
                color: areasData.categories.category2.color || '#3B82F6',
                screenRedirect: areasData.categories.category2.screenRedirect || 'RestaurantConstruction',
              });
            }
            if (areasData.categories.category3) {
              categories.push({
                id: 3,
                title: areasData.categories.category3.title || '餐廳傢具',
                image: areasData.categories.category3.image || '',
                icon: areasData.categories.category3.icon || 'bed-outline',
                color: areasData.categories.category3.color || '#8B5CF6',
                screenRedirect: areasData.categories.category3.screenRedirect || 'RestaurantFurniture',
              });
            }
            if (areasData.categories.category4) {
              categories.push({
                id: 4,
                title: areasData.categories.category4.title || '廚房設備',
                image: areasData.categories.category4.image || '',
                icon: areasData.categories.category4.icon || 'hardware-chip-outline',
                color: areasData.categories.category4.color || '#F59E0B',
                screenRedirect: areasData.categories.category4.screenRedirect || 'KitchenEquipment',
              });
            }
            if (areasData.categories.category5) {
              categories.push({
                id: 5,
                title: areasData.categories.category5.title || '餐碟餐具',
                image: areasData.categories.category5.image || '',
                icon: areasData.categories.category5.icon || 'megaphone-outline',
                color: areasData.categories.category5.color || '#EF4444',
                screenRedirect: areasData.categories.category5.screenRedirect || 'Promotion',
              });
            }
            if (areasData.categories.category6) {
              categories.push({
                id: 6,
                title: areasData.categories.category6.title || '餐碟餐具',
                image: areasData.categories.category6.image || '',
                icon: areasData.categories.category6.icon || 'restaurant-outline',
                color: areasData.categories.category6.color || '#06B6D4',
                screenRedirect: areasData.categories.category6.screenRedirect || 'DishesTableware',
              });
            }
            if (areasData.categories.category7) {
              categories.push({
                id: 7,
                title: areasData.categories.category7.title || '商業工程',
                image: areasData.categories.category7.image || '',
                icon: areasData.categories.category7.icon || 'construct-outline',
                color: areasData.categories.category7.color || '#8B5A2B',
                screenRedirect: areasData.categories.category7.screenRedirect || 'RestaurantMaintenance',
              });
            }
            if (areasData.categories.category8) {
              categories.push({
                id: 8,
                title: areasData.categories.category8.title || '商業維修',
                image: areasData.categories.category8.image || '',
                icon: areasData.categories.category8.icon || 'laptop-outline',
                color: areasData.categories.category8.color || '#9C27B0',
                screenRedirect: areasData.categories.category8.screenRedirect || 'RestaurantSystems',
              });
            }
            console.log('📊 Setting quick actions:', categories.length, 'actions');
            setQuickActions(categories);
          } else {
            console.log('⚠️ No categories/quick actions found in data or section disabled');
            setQuickActions([]); // Empty array means no data available, show fallback
          }
          setIsLoadingMobileAppData(false);
          
          if (newVisibility.popupBanner && areasData?.popupBanner?.image) {
            setPopupBannerImage(areasData.popupBanner.image);
          } else {
            setPopupBannerImage(null);
            setShowPopupBanner(false);
          }
        } else {
          console.log('⚠️ Document does not exist: pages/mobile-app');
          setQuickActions([]); // No document, show fallback
          setIsLoadingMobileAppData(false);
        }
      } catch (error: any) {
        // Handle offline/unavailable errors gracefully - this is expected when device is offline
        if (error?.code === 'unavailable' || error?.message?.includes('client is offline')) {
          // Client is offline - this is expected behavior, not an error
          // Firestore will use cached data if available, so we don't need to do anything
          console.log('ℹ️ Device is offline. Using cached data if available.');
          // Still mark as loaded so we can show fallback if no cached data
          setIsLoadingMobileAppData(false);
          // If quickActions is still null, set to empty array to show fallback
          if (quickActions === null) {
            setQuickActions([]);
          }
          return; // Exit early, don't log as error or clear data
        }
        
        // Handle permission errors gracefully for unauthenticated users
        if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
          // Permission denied - this should not happen if Firestore rules are deployed correctly
          // Log for debugging but don't clear existing data
          console.error('❌ Firestore permission denied. Make sure Firestore rules allow public read for pages/mobile-app.');
          console.error('Error details:', error);
          console.error('⚠️ Firestore rules may not be deployed. Run: firebase deploy --only firestore:rules');
          // Don't clear data - let default content show
          setShowPopupBanner(false);
          // Mark as loaded and show fallback if no data
          setIsLoadingMobileAppData(false);
          if (quickActions === null) {
            setQuickActions([]);
          }
        } else {
          // Unexpected error - log it but don't clear data unnecessarily
          // Don't log timeout errors as errors either
          if (error?.code === 'deadline-exceeded') {
            console.warn('⚠️ Request timeout. This may be due to slow network connection.');
          } else {
            console.error('❌ Error fetching mobile app data:', error);
            console.error('Error code:', error?.code);
            console.error('Error message:', error?.message);
            // Only clear data on unexpected errors that might indicate data corruption
            setShowPopupBanner(false);
          }
          // Mark as loaded even on error so we can show fallback
          setIsLoadingMobileAppData(false);
          if (quickActions === null) {
            setQuickActions([]);
          }
        }
      }
    };

    // Always try to fetch, even without authentication (Firestore rules allow public read for pages/mobile-app)
    fetchMobileAppData();
  }, []); // Remove firebaseUser dependency so it always fetches on mount, regardless of auth status

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const featuredQuery = query(
          productsRef,
          where('showOnHomepage', '==', true),
          where('isAvailable', '==', true),
          limit(12)
        );
        const snapshot = await getDocs(featuredQuery);
        const products: Product[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '未命名產品',
            productCode: data.productCode || '',
            description: data.description || '',
            category: data.category || '',
            subcategory: data.subcategory || '',
            price: Number(data.price) || 0,
            unit: data.unit || '',
            minOrderQuantity: Number(data.minOrderQuantity) || 1,
            maxOrderQuantity: data.maxOrderQuantity ? Number(data.maxOrderQuantity) : undefined,
            stockQuantity: Number(data.stockQuantity) || 0,
            imageUrl: data.imageUrl || (Array.isArray(data.imageUrls) ? data.imageUrls[0] : '') || '',
            imageUrls: data.imageUrls || [],
            isAvailable: data.isAvailable ?? true,
            showOnHomepage: Boolean(data.showOnHomepage),
            supplier: data.supplier || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          };
        });
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch all products for search
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setSearchLoading(true);
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const products: Product[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '未命名產品',
            productCode: data.productCode || '',
            description: data.description || '',
            category: data.category || '',
            subcategory: data.subcategory || '',
            price: Number(data.price) || 0,
            unit: data.unit || '',
            minOrderQuantity: Number(data.minOrderQuantity) || 1,
            maxOrderQuantity: data.maxOrderQuantity ? Number(data.maxOrderQuantity) : undefined,
            stockQuantity: Number(data.stockQuantity) || 0,
            imageUrl: data.imageUrl || (Array.isArray(data.imageUrls) ? data.imageUrls[0] : '') || '',
            imageUrls: data.imageUrls || [],
            isAvailable: data.isAvailable ?? true,
            showOnHomepage: Boolean(data.showOnHomepage),
            supplier: data.supplier || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          };
        });
        setAllProducts(products.filter(p => p.isAvailable));
      } catch (error) {
        console.error('Error fetching all products:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Filter products based on search query
  const filteredSearchProducts = searchQuery.trim() === '' 
    ? [] 
    : allProducts.filter(product => {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.productCode && product.productCode.toLowerCase().includes(query))
        );
      });

  // Show search results when query is not empty (only when modal is open)
  useEffect(() => {
    if (isSearchModalOpen) {
      setIsSearching(searchQuery.trim().length > 0);
    }
  }, [searchQuery, isSearchModalOpen]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        {isSectionVisible('logo') && (
          <View style={styles.header}>
            {logoImage && (
              <Image
                source={{ uri: logoImage }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            )}
          </View>
        )}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsAppPress}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity 
        style={styles.searchContainer}
        onPress={() => setIsSearchModalOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.searchInput}>
          <Text style={styles.searchPlaceholderText}>搜尋產品...</Text>
        </View>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Slideshow */}
        {isSectionVisible('banners') && (
          bannerData.length > 0 ? (
            <View style={styles.bannerContainer}>
              <FlatList
                ref={flatListRef}
                data={bannerData}
                renderItem={renderBanner}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
              />
            </View>
          ) : (
            <View style={styles.defaultWelcomeSection}>
              <Text style={styles.welcomeTitle}>{appTitle}</Text>
              <Text style={styles.welcomeSubtitle}>{welcomeText}</Text>
            </View>
          )
        )}

        {/* Quick Actions */}
        {isSectionVisible('categories') && (
          isLoadingMobileAppData ? (
            // Show loading state while fetching
            <View style={styles.quickActionsSection}>
              <View style={styles.quickActionsContainer}>
                <View style={styles.quickActionsRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.quickActionItem}>
                      <View style={[styles.quickActionIcon, { backgroundColor: '#f3f4f6' }]}>
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      </View>
                      <Text style={styles.quickActionTitle}>載入中...</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.quickActionsRow}>
                  {[5, 6, 7, 8].map((i) => (
                    <View key={i} style={styles.quickActionItem}>
                      <View style={[styles.quickActionIcon, { backgroundColor: '#f3f4f6' }]}>
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      </View>
                      <Text style={styles.quickActionTitle}>載入中...</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : quickActions && quickActions.length > 0 ? (
            // Show data from Firestore
            <View style={styles.quickActionsSection}>
              <View style={styles.quickActionsContainer}>
                <View style={styles.quickActionsRow}>
                  {quickActions.slice(0, 4).map((action, index) => renderQuickAction(action, index))}
                </View>
                <View style={styles.quickActionsRow}>
                  {quickActions.slice(4, 8).map((action, index) => renderQuickAction(action, index + 4))}
                </View>
              </View>
            </View>
          ) : (
            // Show fallback only after loading completes and no data available
            <View style={styles.quickActionsSection}>
              <View style={styles.quickActionsContainer}>
                <View style={styles.quickActionsRow}>
                  {[
                    { id: 1, title: '食材訂購', icon: 'restaurant-outline', color: '#10B981' },
                    { id: 2, title: '餐廳工程', icon: 'construct-outline', color: '#3B82F6' },
                    { id: 3, title: '餐廳傢具', icon: 'bed-outline', color: '#8B5CF6' },
                    { id: 4, title: '廚房設備', icon: 'hardware-chip-outline', color: '#F59E0B' },
                  ].map((action, index) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.quickActionItem}
                      onPress={() => {
                        switch (action.id) {
                          case 1:
                            navigation.navigate('Categories' as never);
                            break;
                          case 2:
                            navigation.navigate('RestaurantConstruction' as never);
                            break;
                          case 3:
                            navigation.navigate('RestaurantFurniture' as never);
                            break;
                          case 4:
                            navigation.navigate('KitchenEquipment' as never);
                            break;
                        }
                      }}
                    >
                      <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                        <Ionicons name={action.icon as any} size={28} color={action.color} />
                      </View>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.quickActionsRow}>
                  {[
                    { id: 5, title: '宣傳', icon: 'megaphone-outline', color: '#EF4444' },
                    { id: 6, title: '餐碟餐具', icon: 'restaurant-outline', color: '#06B6D4' },
                    { id: 7, title: '餐飲維修', icon: 'construct-outline', color: '#8B5A2B' },
                    { id: 8, title: '餐飲系統', icon: 'laptop-outline', color: '#9C27B0' },
                  ].map((action, index) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.quickActionItem}
                      onPress={() => {
                        switch (action.id) {
                          case 5:
                            navigation.navigate('Promotion' as never);
                            break;
                          case 6:
                            navigation.navigate('DishesTableware' as never);
                            break;
                          case 7:
                            navigation.navigate('RestaurantMaintenance' as never);
                            break;
                          case 8:
                            navigation.navigate('RestaurantSystems' as never);
                            break;
                        }
                      }}
                    >
                      <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                        <Ionicons name={action.icon as any} size={28} color={action.color} />
                      </View>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )
        )}

        {/* Long Banner */}
        {isSectionVisible('longBanners') && longBannerImage && (
          <View style={styles.longBannersSection}>
            <TouchableOpacity style={styles.longBanner} activeOpacity={0.8}>
              <Image
                source={{ uri: longBannerImage }}
                style={styles.longBannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Promotional Banners */}
        {isSectionVisible('promotionalBanners') && promotionalBanners.length > 0 && (
          <View style={styles.promoSection}>
            <View style={styles.promoBannersContainer}>
              {promotionalBanners.map((banner, index) => renderPromotionalBanner(banner, index))}
            </View>
          </View>
        )}

        {/* Square Banners */}
        {isSectionVisible('squareBanners') && squareBanners.length > 0 && (
          <View style={styles.squareBannersSection}>
            <View style={styles.squareBannersContainer}>
              {squareBanners.map((banner, index) => renderSquareBanner(banner, index))}
            </View>
          </View>
        )}

        {/* Featured Products */}
        {(isLoadingFeatured || featuredProducts.length > 0) && (
          <View style={styles.featuredProductsSection}>
            <Text style={styles.sectionTitle}>精選產品</Text>
            {isLoadingFeatured ? (
              <View style={styles.featuredLoading}>
                <ActivityIndicator size="small" color="#0B8628" />
                <Text style={styles.featuredLoadingText}>載入中...</Text>
              </View>
            ) : featuredProducts.length === 0 ? (
              <Text style={styles.featuredEmptyText}>目前沒有精選產品</Text>
            ) : (
              <View style={styles.featuredGrid}>
                {featuredProducts.map((product) => {
                  const quantity = getCartQuantity(product.id);
                  const displayImage = product.imageUrl || (product.imageUrls?.[0] ?? '');
                  return (
                    <View key={product.id} style={styles.featuredCard}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                          navigation.navigate(
                            'ProductDetail' as never,
                            { productId: product.id } as never
                          )
                        }
                      >
                        {displayImage ? (
                          <Image
                            source={{ uri: displayImage }}
                            style={styles.featuredImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.featuredImage, styles.featuredImagePlaceholder]}>
                            <Ionicons name="image" size={28} color="#9CA3AF" />
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.featuredName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.featuredPrice}>
                        HK${product.price.toFixed(2)}{product.unit ? ` / ${product.unit}` : ''}
                      </Text>
                      <View style={styles.featuredCartControls}>
                        <TouchableOpacity
                          style={[styles.cartButton, styles.cartButtonOutline]}
                          onPress={() => handleDecreaseQuantity(product)}
                          disabled={quantity === 0}
                        >
                          <Ionicons
                            name="remove"
                            size={18}
                            color={quantity === 0 ? '#9CA3AF' : '#0B8628'}
                          />
                        </TouchableOpacity>
                        {quantity > 0 ? (
                          <TouchableOpacity
                            style={styles.featuredQuantityBadge}
                            activeOpacity={0.8}
                            onPress={() => openQuantityModal(product)}
                          >
                            <Text style={styles.featuredQuantityText}>{quantity}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.cartQuantityText}>{quantity}</Text>
                        )}
                        <TouchableOpacity
                          style={[styles.cartButton, styles.cartButtonFilled]}
                          onPress={() => handleIncreaseQuantity(product)}
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Search Results Modal */}
      <Modal
        visible={isSearchModalOpen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setSearchQuery('');
          setIsSearching(false);
          setIsSearchModalOpen(false);
        }}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              style={styles.searchModalBackButton}
              onPress={() => {
                setSearchQuery('');
                setIsSearching(false);
                setIsSearchModalOpen(false);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.searchModalInputContainer}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="搜尋產品..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <Ionicons name="search" size={20} color="#666" style={styles.searchModalIcon} />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.searchModalClearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          {searchLoading ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="large" color="#0B8628" />
              <Text style={styles.searchLoadingText}>載入中...</Text>
            </View>
          ) : filteredSearchProducts.length === 0 ? (
            <View style={styles.searchEmptyContainer}>
              <Ionicons name="search-outline" size={64} color="#9CA3AF" />
              <Text style={styles.searchEmptyText}>
                {searchQuery.trim().length > 0 ? '找不到相關產品' : '輸入關鍵字搜尋產品'}
              </Text>
            </View>
          ) : (
            <>
              {/* Category Restriction Warning */}
              {state.items.length > 0 && (
                <View style={styles.searchWarningBanner}>
                  <Ionicons name="information-circle" size={20} color="#2563EB" />
                  <Text style={styles.searchWarningText}>
                    目前購物車包含 {state.items[0].category} 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
                  </Text>
                </View>
              )}
              <FlatList
                data={filteredSearchProducts}
                renderItem={renderSearchProduct}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.searchResultsList}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Quantity Edit Modal */}
      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeQuantityModal}
      >
        <View style={styles.quantityModalOverlay}>
          <View style={styles.quantityModalContent}>
            <Text style={styles.quantityModalTitle}>修改數量</Text>
            {editingProduct && (
              <Text style={styles.quantityModalSubtitle}>{editingProduct.name}</Text>
            )}
            <TextInput
              style={styles.quantityModalInput}
              keyboardType="number-pad"
              value={editingQuantity}
              onChangeText={(text) => setEditingQuantity(text.replace(/[^0-9]/g, ''))}
              placeholder="輸入數量"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.quantityModalActions}>
              <TouchableOpacity
                style={[styles.quantityModalButton, styles.quantityModalCancel]}
                onPress={closeQuantityModal}
              >
                <Text style={[styles.quantityModalButtonText, styles.quantityModalCancelText]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quantityModalButton, styles.quantityModalConfirm]}
                onPress={confirmQuantityChange}
              >
                <Text style={styles.quantityModalButtonText}>確認</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Popup Banner Modal */}
      {isSectionVisible('popupBanner') && popupBannerImage && (
        <Modal
          visible={showPopupBanner}
          transparent={true}
          animationType="fade"
          onRequestClose={dismissPopupBanner}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupContent}>
              <Image
                source={{ uri: popupBannerImage }}
                style={styles.popupImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={dismissPopupBanner}
              >
                <Text style={styles.closeButtonText}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    position: 'relative',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  whatsappButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  logoImage: {
    height: 70,
    width: '100%',
    marginBottom: 0,
    marginTop: 0,
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    minHeight: 48,
  },
  searchPlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchModalBackButton: {
    padding: 5,
    marginRight: 8,
  },
  searchModalInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchModalIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  searchModalClearButton: {
    padding: 5,
    marginLeft: 8,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  searchLoadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  searchEmptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  searchResultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchProductCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchProductThumbnailWrapper: {
    marginRight: 15,
  },
  searchProductThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  searchProductThumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchProductInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  searchProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  searchProductCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  searchProductFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B8628',
  },
  searchProductCartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCartButtonOutline: {
    borderWidth: 1,
    borderColor: '#0B8628',
    backgroundColor: '#fff',
  },
  searchCartButtonFilled: {
    backgroundColor: '#0B8628',
  },
  searchQuantityBadge: {
    backgroundColor: '#0B8628',
    borderRadius: 12,
    minWidth: 32,
    paddingHorizontal: 8,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  searchQuantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  searchCartQuantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    width: 32,
    textAlign: 'center',
  },
  searchCartButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  searchWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  searchWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 18,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  defaultWelcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  quickActionsContainer: {
    flexDirection: 'column',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 62,
    height: 62,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionImage: {
    width: 52,
    height: 52,
  },
  quickActionTitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  bannerContainer: {
    height: 150,
    marginVertical: 20,
    position: 'relative',
  },
  heroBanner: {
    width: width,
    height: 150,
    paddingHorizontal: 20,
  },
  heroImage: {
    width: width - 40,
    height: 150,
    borderRadius: 6,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  heroText: {
    color: '#fff',
    fontSize: 16,
  },
  heroTextBold: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  promoSection: {
    marginHorizontal: 20,
    marginTop: -5,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  promoBannersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promoBanner: {
    width: (width - 60) / 3,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  promoButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  promoButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  longBannersSection: {
    marginHorizontal: 20,
    marginBottom: 0,
  },
  longBanner: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  longBannerImage: {
    width: '100%',
    height: '100%',
  },
  squareBannersSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  squareBannersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  squareBanner: {
    width: (width - 60) / 2,
    height: (width - 60) / 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  squareBannerImage: {
    width: '100%',
    height: '100%',
  },
  squareBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  squareBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  squareBannerSubtitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  featuredProductsSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  featuredLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  featuredLoadingText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  featuredEmptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 16,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featuredImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  featuredImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B8628',
    marginBottom: 10,
  },
  featuredCartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonOutline: {
    borderWidth: 1,
    borderColor: '#0B8628',
    backgroundColor: '#fff',
  },
  cartButtonFilled: {
    backgroundColor: '#0B8628',
  },
  cartQuantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  featuredQuantityBadge: {
    backgroundColor: '#0B8628',
    borderRadius: 12,
    minWidth: 32,
    paddingHorizontal: 8,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredQuantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  quantityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  quantityModalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  quantityModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  quantityModalSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  quantityModalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  quantityModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  quantityModalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quantityModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  quantityModalCancel: {
    backgroundColor: '#E5E7EB',
  },
  quantityModalCancelText: {
    color: '#374151',
  },
  quantityModalConfirm: {
    backgroundColor: '#0B8628',
    marginLeft: 12,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContent: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  popupImage: {
    width: '100%',
    height: height * 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen; 