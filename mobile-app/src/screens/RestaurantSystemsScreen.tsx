import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RestaurantSystemsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const systemsCategories = [
    {
      id: 1,
      title: 'POS系統',
      description: '專業餐廳POS系統，提升營運效率',
      icon: 'card-outline',
      color: '#10B981',
      items: ['點餐系統', '收銀系統', '庫存管理', '報表分析', '會員管理'],
      priceRange: 'HKD$ 2,000 - 15,000',
      popular: true
    },
    {
      id: 2,
      title: '廚房顯示系統',
      description: '智能廚房顯示系統，提升出餐效率',
      icon: 'tv-outline',
      color: '#3B82F6',
      items: ['訂單顯示', '出餐提醒', '時間管理', '廚房監控', '效率分析'],
      priceRange: 'HKD$ 1,500 - 8,000',
      popular: true
    },
    {
      id: 3,
      title: '預約管理系統',
      description: '智能預約管理系統，優化座位安排',
      icon: 'calendar-outline',
      color: '#F59E0B',
      items: ['線上預約', '座位管理', '客戶管理', '排隊系統', '通知提醒'],
      priceRange: 'HKD$ 1,000 - 5,000',
      popular: false
    },
    {
      id: 4,
      title: '外送管理系統',
      description: '專業外送管理系統，整合多平台訂單',
      icon: 'bicycle-outline',
      color: '#8B5CF6',
      items: ['訂單整合', '配送追蹤', '路線優化', '配送員管理', '客戶通知'],
      priceRange: 'HKD$ 1,500 - 6,000',
      popular: true
    },
    {
      id: 5,
      title: '庫存管理系統',
      description: '智能庫存管理系統，避免缺貨過期',
      icon: 'cube-outline',
      color: '#EF4444',
      items: ['庫存監控', '自動補貨', '過期提醒', '成本分析', '供應商管理'],
      priceRange: 'HKD$ 800 - 4,000',
      popular: false
    },
    {
      id: 6,
      title: '客戶關係管理',
      description: '專業CRM系統，提升客戶滿意度',
      icon: 'people-outline',
      color: '#06B6D4',
      items: ['客戶檔案', '消費記錄', '會員積分', '促銷活動', '滿意度調查'],
      priceRange: 'HKD$ 1,200 - 6,000',
      popular: false
    }
  ];

  const services = [
    {
      title: '系統整合',
      description: '提供完整的系統整合解決方案',
      icon: 'link-outline',
      features: ['系統整合', '數據同步', '統一管理', '無縫連接']
    },
    {
      title: '技術支援',
      description: '專業技術支援團隊，確保系統穩定運行',
      icon: 'headset-outline',
      features: ['24小時支援', '遠程維護', '技術培訓', '故障排除']
    },
    {
      title: '客製化開發',
      description: '根據餐廳需求提供客製化系統開發',
      icon: 'create-outline',
      features: ['需求分析', '客製開發', '功能擴展', '界面設計']
    },
    {
      title: '數據分析',
      description: '提供詳細的營運數據分析報告',
      icon: 'analytics-outline',
      features: ['營運分析', '銷售報表', '客戶分析', '趨勢預測']
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: '張老闆',
      restaurant: '港式茶餐廳',
      comment: 'POS系統很好用，提升了收銀效率，報表也很詳細！',
      rating: 5
    },
    {
      id: 2,
      name: '李經理',
      restaurant: '日式料理店',
      comment: '廚房顯示系統讓出餐更有序，減少了錯誤。',
      rating: 5
    },
    {
      id: 3,
      name: '王主廚',
      restaurant: '西式餐廳',
      comment: '外送管理系統整合了多個平台，管理起來很方便。',
      rating: 4
    }
  ];

  const renderCategory = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory === category.title && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(
        selectedCategory === category.title ? null : category.title
      )}
      activeOpacity={0.8}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.priceRange}>{category.priceRange}</Text>
        </View>
        {category.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>熱門</Text>
          </View>
        )}
      </View>
      
      {selectedCategory === category.title && (
        <View style={styles.categoryDetails}>
          <Text style={styles.itemsTitle}>系統功能：</Text>
          <View style={styles.itemsContainer}>
            {category.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemTag}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.inquiryButton}>
            <Text style={styles.inquiryButtonText}>立即諮詢</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderService = (service: any, index: number) => (
    <View key={index} style={styles.serviceCard}>
      <View style={styles.serviceIcon}>
        <Ionicons name={service.icon as any} size={24} color="#10B981" />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <View style={styles.featuresContainer}>
          {service.features.map((feature: string, idx: number) => (
            <View key={idx} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTestimonial = (testimonial: any) => (
    <View key={testimonial.id} style={styles.testimonialCard}>
      <View style={styles.testimonialHeader}>
        <Text style={styles.testimonialName}>{testimonial.name}</Text>
        <Text style={styles.testimonialRestaurant}>{testimonial.restaurant}</Text>
      </View>
      <Text style={styles.testimonialComment}>"{testimonial.comment}"</Text>
      <View style={styles.ratingContainer}>
        {[...Array(5)].map((_, index) => (
          <Ionicons
            key={index}
            name={index < testimonial.rating ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>餐飲系統</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>智能餐飲系統</Text>
            <Text style={styles.heroSubtitle}>提升營運效率，優化客戶體驗</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統服務</Text>
          {systemsCategories.map(renderCategory)}
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服務特色</Text>
          {services.map(renderService)}
        </View>

        {/* Testimonials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>客戶評價</Text>
          {testimonials.map(renderTestimonial)}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>立即聯繫我們</Text>
          <Text style={styles.contactSubtitle}>專業團隊為您提供最優質的系統服務</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Alert.alert('聯繫我們', '請撥打系統專線：+852 1234 5678')}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>立即聯繫</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: 200,
    position: 'relative',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategory: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceRange: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  popularBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  itemTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    color: '#666',
  },
  inquiryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  inquiryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#1890ff',
    fontWeight: '500',
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  testimonialRestaurant: {
    fontSize: 14,
    color: '#666',
  },
  testimonialComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  contactSection: {
    backgroundColor: '#f8f9fa',
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RestaurantSystemsScreen;
