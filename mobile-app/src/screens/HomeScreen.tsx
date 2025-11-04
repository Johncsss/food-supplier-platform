import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Dimensions, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [showPopupBanner, setShowPopupBanner] = useState(true);
  const [popupBannerImage, setPopupBannerImage] = useState<string | null>(null);
  const [mobileAppData, setMobileAppData] = useState<any>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState<string>('iFoodPulse');
  const [welcomeText, setWelcomeText] = useState<string>('歡迎選購');
  const [bannerData, setBannerData] = useState<any[]>([]);
  const [longBannerImage, setLongBannerImage] = useState<string | null>(null);
  const [promotionalBanners, setPromotionalBanners] = useState<any[]>([]);
  const [squareBanners, setSquareBanners] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);

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
    <TouchableOpacity key={banner.id} style={styles.promoBanner} activeOpacity={0.8}>
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

  const renderSquareBanner = (banner: any, index: number) => (
    <TouchableOpacity key={banner.id} style={styles.squareBanner} activeOpacity={0.8}>
      <Image
        source={{ uri: banner.image }}
        style={styles.squareBannerImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderQuickAction = (action: any, index: number) => {
    const handleQuickActionPress = () => {
      switch (action.title) {
        case '食材訂購':
          navigation.navigate('Categories' as never);
          break;
        case '餐廳工程':
          navigation.navigate('RestaurantConstruction' as never);
          break;
        case '餐廳傢具':
          navigation.navigate('RestaurantFurniture' as never);
          break;
        case '廚房設備':
          navigation.navigate('KitchenEquipment' as never);
          break;
        case '宣傳':
          navigation.navigate('Promotion' as never);
          break;
        case '餐碟餐具':
          navigation.navigate('DishesTableware' as never);
          break;
        case '餐飲維修':
          navigation.navigate('RestaurantMaintenance' as never);
          break;
        case '餐飲系統':
          navigation.navigate('RestaurantSystems' as never);
          break;
        default:
          console.log('Unknown quick action:', action.title);
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

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentSlide(roundIndex);
  };

  // Fetch mobile app content from Firestore
  useEffect(() => {
    const fetchMobileAppData = async () => {
      try {
        const pageDoc = await getDoc(doc(db, 'pages', 'mobile-app'));
        if (pageDoc.exists()) {
          const data = pageDoc.data();
          console.log('Firestore 數據:', JSON.stringify(data, null, 2));
          console.log('longBanners 數據:', data.areas?.longBanners);
          setMobileAppData(data.areas || null);
          
          // Set logo data if available
          if (data.areas?.logo) {
            if (data.areas.logo.image) {
              setLogoImage(data.areas.logo.image);
            }
            if (data.areas.logo.appTitle) {
              setAppTitle(data.areas.logo.appTitle);
            }
            if (data.areas.logo.welcomeText) {
              setWelcomeText(data.areas.logo.welcomeText);
            }
          }
          
          // Set banner data if available
          if (data.areas?.banners) {
            const banners: any[] = [];
            if (data.areas.banners.banner1?.image) {
              banners.push({
                id: 1,
                image: data.areas.banners.banner1.image,
                title: data.areas.banners.banner1.title || '',
                subtitle: data.areas.banners.banner1.subtitle || ''
              });
            }
            if (data.areas.banners.banner2?.image) {
              banners.push({
                id: 2,
                image: data.areas.banners.banner2.image,
                title: data.areas.banners.banner2.title || '',
                subtitle: data.areas.banners.banner2.subtitle || ''
              });
            }
            if (data.areas.banners.banner3?.image) {
              banners.push({
                id: 3,
                image: data.areas.banners.banner3.image,
                title: data.areas.banners.banner3.title || '',
                subtitle: data.areas.banners.banner3.subtitle || ''
              });
            }
            if (data.areas.banners.banner4?.image) {
              banners.push({
                id: 4,
                image: data.areas.banners.banner4.image,
                title: data.areas.banners.banner4.title || '',
                subtitle: data.areas.banners.banner4.subtitle || ''
              });
            }
            setBannerData(banners);
          }
          
          // Set long banner image if available
          if (data.areas?.longBanners?.long1?.image) {
            console.log('長型 Banner 圖片:', data.areas.longBanners.long1.image);
            setLongBannerImage(data.areas.longBanners.long1.image);
          } else {
            console.log('長型 Banner 圖片不存在或為空');
            setLongBannerImage(null);
          }
          
          // Set promotional banners if available
          if (data.areas?.promotionalBanners) {
            const promos: any[] = [];
            if (data.areas.promotionalBanners.promo1?.image) {
              promos.push({
                id: 1,
                image: data.areas.promotionalBanners.promo1.image,
              });
            }
            if (data.areas.promotionalBanners.promo2?.image) {
              promos.push({
                id: 2,
                image: data.areas.promotionalBanners.promo2.image,
              });
            }
            if (data.areas.promotionalBanners.promo3?.image) {
              promos.push({
                id: 3,
                image: data.areas.promotionalBanners.promo3.image,
              });
            }
            setPromotionalBanners(promos);
          } else {
            setPromotionalBanners([]);
          }
          
          // Set square banners if available
          if (data.areas?.squareBanners) {
            const squares: any[] = [];
            // Check if it's an array (new format)
            if (Array.isArray(data.areas.squareBanners)) {
              data.areas.squareBanners.forEach((banner: any, index: number) => {
                if (banner?.image) {
                  squares.push({
                    id: index + 1,
                    image: banner.image,
                  });
                }
              });
            } else {
              // Legacy format (square1, square2)
              if (data.areas.squareBanners.square1?.image) {
                squares.push({
                  id: 1,
                  image: data.areas.squareBanners.square1.image,
                });
              }
              if (data.areas.squareBanners.square2?.image) {
                squares.push({
                  id: 2,
                  image: data.areas.squareBanners.square2.image,
                });
              }
            }
            setSquareBanners(squares);
          } else {
            setSquareBanners([]);
          }
          
          // Set categories/quick actions if available
          if (data.areas?.categories) {
            const categories: any[] = [];
            if (data.areas.categories.category1) {
              categories.push({
                id: 1,
                title: data.areas.categories.category1.title || '食材訂購',
                image: data.areas.categories.category1.image || '',
                icon: data.areas.categories.category1.icon || 'restaurant-outline',
                color: data.areas.categories.category1.color || '#10B981',
              });
            }
            if (data.areas.categories.category2) {
              categories.push({
                id: 2,
                title: data.areas.categories.category2.title || '餐廳工程',
                image: data.areas.categories.category2.image || '',
                icon: data.areas.categories.category2.icon || 'construct-outline',
                color: data.areas.categories.category2.color || '#3B82F6',
              });
            }
            if (data.areas.categories.category3) {
              categories.push({
                id: 3,
                title: data.areas.categories.category3.title || '餐廳傢具',
                image: data.areas.categories.category3.image || '',
                icon: data.areas.categories.category3.icon || 'bed-outline',
                color: data.areas.categories.category3.color || '#8B5CF6',
              });
            }
            if (data.areas.categories.category4) {
              categories.push({
                id: 4,
                title: data.areas.categories.category4.title || '廚房設備',
                image: data.areas.categories.category4.image || '',
                icon: data.areas.categories.category4.icon || 'hardware-chip-outline',
                color: data.areas.categories.category4.color || '#F59E0B',
              });
            }
            if (data.areas.categories.category5) {
              categories.push({
                id: 5,
                title: data.areas.categories.category5.title || '宣傳',
                image: data.areas.categories.category5.image || '',
                icon: data.areas.categories.category5.icon || 'megaphone-outline',
                color: data.areas.categories.category5.color || '#EF4444',
              });
            }
            if (data.areas.categories.category6) {
              categories.push({
                id: 6,
                title: data.areas.categories.category6.title || '餐碟餐具',
                image: data.areas.categories.category6.image || '',
                icon: data.areas.categories.category6.icon || 'restaurant-outline',
                color: data.areas.categories.category6.color || '#06B6D4',
              });
            }
            if (data.areas.categories.category7) {
              categories.push({
                id: 7,
                title: data.areas.categories.category7.title || '餐飲維修',
                image: data.areas.categories.category7.image || '',
                icon: data.areas.categories.category7.icon || 'construct-outline',
                color: data.areas.categories.category7.color || '#8B5A2B',
              });
            }
            if (data.areas.categories.category8) {
              categories.push({
                id: 8,
                title: data.areas.categories.category8.title || '餐飲系統',
                image: data.areas.categories.category8.image || '',
                icon: data.areas.categories.category8.icon || 'laptop-outline',
                color: data.areas.categories.category8.color || '#9C27B0',
              });
            }
            setQuickActions(categories);
          } else {
            setQuickActions([]);
          }
          
          // Set popup banner image if available
          if (data.areas?.popupBanner?.image) {
            setPopupBannerImage(data.areas.popupBanner.image);
            // Only show popup if there's an image
            setShowPopupBanner(true);
          } else {
            // No image, don't show popup
            setShowPopupBanner(false);
          }
        }
      } catch (error) {
        console.error('Error fetching mobile app data:', error);
        // If error, don't show popup
        setShowPopupBanner(false);
        setLongBannerImage(null);
        setPromotionalBanners([]);
        setSquareBanners([]);
        setQuickActions([]);
      }
    };

    fetchMobileAppData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        {logoImage && (
          <Image
            source={{ uri: logoImage }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Slideshow */}
        {bannerData.length > 0 && (
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
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsContainer}>
              {/* First row - 4 actions */}
              <View style={styles.quickActionsRow}>
                {quickActions.slice(0, 4).map((action, index) => renderQuickAction(action, index))}
              </View>
              {/* Second row - 4 actions */}
              <View style={styles.quickActionsRow}>
                {quickActions.slice(4, 8).map((action, index) => renderQuickAction(action, index + 4))}
              </View>
            </View>
          </View>
        )}

        {/* Long Banner */}
        {longBannerImage && (
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
        {promotionalBanners.length > 0 && (
          <View style={styles.promoSection}>
            <View style={styles.promoBannersContainer}>
              {promotionalBanners.map((banner, index) => renderPromotionalBanner(banner, index))}
            </View>
          </View>
        )}

        {/* Square Banners */}
        {squareBanners.length > 0 && (
          <View style={styles.squareBannersSection}>
            <View style={styles.squareBannersContainer}>
              {squareBanners.map((banner, index) => renderSquareBanner(banner, index))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Popup Banner Modal */}
      {popupBannerImage && (
        <Modal
          visible={showPopupBanner}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPopupBanner(false)}
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
                onPress={() => setShowPopupBanner(false)}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  logoImage: {
    height: 60,
    width: '100%',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionImage: {
    width: 40,
    height: 40,
  },
  quickActionTitle: {
    fontSize: 12,
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
    marginBottom: 20,
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