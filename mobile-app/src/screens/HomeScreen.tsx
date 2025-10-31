import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [showPopupBanner, setShowPopupBanner] = useState(true);

  // Food-related banner data
  const bannerData = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      title: '優質美食',
      subtitle: '新鮮直送'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800',
      title: '進口海產類',
      subtitle: '每日現撈'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
      title: '蔬菜/淨菜加工類',
      subtitle: '有機栽培'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      title: '進口凍肉類',
      subtitle: '嚴選品質'
    }
  ];

  // Additional promotional banners
  const promotionalBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
      title: '今日特價',
      subtitle: '全場8折優惠',
      color: '#FF6B6B'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600',
      title: '快速配送',
      subtitle: '1小時內送達',
      color: '#4ECDC4'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
      title: '會員專享',
      subtitle: '額外9折優惠',
      color: '#45B7D1'
    }
  ];

  // Long banners without titles
  const longBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
    }
  ];

  // Square banners below the full width banner
  const squareBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      title: '限時優惠',
      subtitle: '全場9折',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      title: '新鮮到貨',
      subtitle: '每日更新',
    }
  ];

  // Quick action icons
  const quickActions = [
    {
      id: 1,
      title: '食材訂購',
      icon: 'restaurant-outline',
      color: '#10B981'
    },
    {
      id: 2,
      title: '餐廳工程',
      icon: 'construct-outline',
      color: '#3B82F6'
    },
    {
      id: 3,
      title: '餐廳傢具',
      icon: 'bed-outline',
      color: '#8B5CF6'
    },
    {
      id: 4,
      title: '廚房設備',
      icon: 'hardware-chip-outline',
      color: '#F59E0B'
    },
    {
      id: 5,
      title: '宣傳',
      icon: 'megaphone-outline',
      color: '#EF4444'
    },
    {
      id: 6,
      title: '餐碟餐具',
      icon: 'restaurant-outline',
      color: '#06B6D4'
    },
    {
      id: 7,
      title: '餐飲維修',
      icon: 'construct-outline',
      color: '#8B5A2B'
    },
    {
      id: 8,
      title: '餐飲系統',
      icon: 'laptop-outline',
      color: '#9C27B0'
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
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
      <View style={styles.heroOverlay}>
        <Text style={styles.heroText}>{item.title}</Text>
        <Text style={styles.heroTextBold}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderPromotionalBanner = (banner: any, index: number) => (
    <TouchableOpacity key={banner.id} style={styles.promoBanner} activeOpacity={0.8}>
      <Image
        source={{ uri: banner.image }}
        style={styles.promoImage}
        resizeMode="cover"
      />
      <View style={[styles.promoOverlay, { backgroundColor: banner.color + '90' }]}>
        <Text style={styles.promoTitle}>{banner.title}</Text>
        <Text style={styles.promoSubtitle}>{banner.subtitle}</Text>
        <View style={styles.promoButton}>
          <Text style={styles.promoButtonText}>查看詳情</Text>
        </View>
      </View>
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
      <View style={styles.squareBannerOverlay}>
        <Text style={styles.squareBannerTitle}>{banner.title}</Text>
        <Text style={styles.squareBannerSubtitle}>{banner.subtitle}</Text>
      </View>
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
        <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
          <Ionicons name={action.icon as any} size={24} color="#fff" />
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.appTitle}>{user?.restaurantName || '雲臺'}</Text>
        <Text style={styles.welcomeText}>歡迎選購</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Slideshow */}
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

        {/* Quick Actions */}
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

        {/* Promotional Banners */}
        <View style={styles.promoSection}>
          <View style={styles.promoBannersContainer}>
            {promotionalBanners.map((banner, index) => renderPromotionalBanner(banner, index))}
          </View>
        </View>

        {/* Long Banners */}
        <View style={styles.longBannersSection}>
          {longBanners.map((banner, index) => renderLongBanner(banner, index))}
        </View>

        {/* Square Banners */}
        <View style={styles.squareBannersSection}>
          <View style={styles.squareBannersContainer}>
            {squareBanners.map((banner, index) => renderSquareBanner(banner, index))}
          </View>
        </View>
      </ScrollView>

      {/* Popup Banner Modal */}
      <Modal
        visible={showPopupBanner}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPopupBanner(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600' }}
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
    justifyContent: 'space-between',
  },
  squareBanner: {
    width: (width - 60) / 2,
    height: (width - 60) / 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
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