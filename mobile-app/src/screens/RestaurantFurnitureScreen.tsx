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

const RestaurantFurnitureScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const furnitureCategories = [
    {
      id: 1,
      title: '餐桌椅組合',
      description: '各式餐桌椅組合，適合不同餐廳風格',
      icon: 'restaurant-outline',
      color: '#10B981',
      items: ['圓桌', '方桌', '吧台椅', '餐椅', '長桌'],
      priceRange: 'HKD$ 2,000 - 15,000',
      popular: true
    },
    {
      id: 2,
      title: '沙發座椅',
      description: '舒適的沙發座椅，提升用餐體驗',
      icon: 'bed-outline',
      color: '#3B82F6',
      items: ['單人沙發', '雙人沙發', 'L型沙發', '貴妃椅', '腳凳'],
      priceRange: 'HKD$ 3,000 - 25,000',
      popular: true
    },
    {
      id: 3,
      title: '收納櫃',
      description: '實用的收納櫃，保持餐廳整潔',
      icon: 'archive-outline',
      color: '#F59E0B',
      items: ['餐具櫃', '酒櫃', '展示櫃', '文件櫃', '雜物櫃'],
      priceRange: 'HKD$ 1,500 - 12,000',
      popular: false
    },
    {
      id: 4,
      title: '吧台設備',
      description: '專業吧台設備，打造完美酒吧區',
      icon: 'wine-outline',
      color: '#8B5CF6',
      items: ['吧台桌', '高腳椅', '酒架', '冰櫃', '調酒台'],
      priceRange: 'HKD$ 5,000 - 30,000',
      popular: true
    },
    {
      id: 5,
      title: '裝飾傢具',
      description: '精美裝飾傢具，營造餐廳氛圍',
      icon: 'flower-outline',
      color: '#EF4444',
      items: ['屏風', '花架', '裝飾櫃', '鏡子', '藝術品'],
      priceRange: 'HKD$ 800 - 8,000',
      popular: false
    },
    {
      id: 6,
      title: '戶外傢具',
      description: '耐用戶外傢具，適合露天用餐區',
      icon: 'sunny-outline',
      color: '#06B6D4',
      items: ['戶外桌椅', '遮陽傘', '戶外沙發', '燒烤桌', '花園椅'],
      priceRange: 'HKD$ 2,500 - 20,000',
      popular: false
    }
  ];

  const services = [
    {
      title: '客製化設計',
      description: '根據餐廳風格提供客製化傢具設計',
      icon: 'create-outline',
      features: ['免費設計諮詢', '3D效果圖', '材質選擇', '尺寸客製']
    },
    {
      title: '專業安裝',
      description: '專業團隊提供傢具安裝服務',
      icon: 'construct-outline',
      features: ['免費安裝', '現場組裝', '品質檢查', '使用指導']
    },
    {
      title: '品質保證',
      description: '使用優質材料，提供品質保證',
      icon: 'checkmark-circle-outline',
      features: ['原廠保固', '品質認證', '售後服務', '維修保養']
    },
    {
      title: '售後服務',
      description: '完善的售後服務與維護保養',
      icon: 'settings-outline',
      features: ['定期保養', '故障維修', '零件更換', '技術支援']
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: '張老闆',
      restaurant: '港式茶餐廳',
      rating: 5,
      comment: '傢具品質很好，安裝服務也很專業，客人反應都很滿意！'
    },
    {
      id: 2,
      name: '李經理',
      restaurant: '西式餐廳',
      rating: 5,
      comment: '客製化設計很符合我們的需求，整體效果超出預期。'
    },
    {
      id: 3,
      name: '王店長',
      restaurant: '咖啡廳',
      rating: 5,
      comment: '售後服務很到位，有任何問題都能快速解決。'
    }
  ];

  const handleCategoryPress = (category: any) => {
    setSelectedCategory(selectedCategory === category.title ? null : category.title);
  };

  const handleContactPress = () => {
    Alert.alert(
      '聯絡我們',
      '請選擇聯絡方式',
      [
        { text: '取消', style: 'cancel' },
        { text: '電話諮詢', onPress: () => console.log('電話諮詢') },
        { text: '線上諮詢', onPress: () => console.log('線上諮詢') },
        { text: '預約參觀', onPress: () => console.log('預約參觀') }
      ]
    );
  };

  const renderFurnitureCategory = (category: any) => (
    <TouchableOpacity 
      key={category.id} 
      style={[
        styles.categoryCard,
        selectedCategory === category.title && styles.selectedCategoryCard
      ]}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.categoryContent}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            {category.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>熱門</Text>
              </View>
            )}
          </View>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.priceRange}>{category.priceRange}</Text>
        </View>
        <Ionicons 
          name={selectedCategory === category.title ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#666" 
        />
      </View>
      
      {selectedCategory === category.title && (
        <View style={styles.expandedContent}>
          <View style={styles.itemsContainer}>
            {category.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemTag}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>查看詳細資訊</Text>
            <Ionicons name="arrow-forward" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderService = (service: any, index: number) => (
    <View key={index} style={styles.serviceItem}>
      <View style={styles.serviceIcon}>
        <Ionicons name={service.icon as any} size={24} color="#10B981" />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <View style={styles.featuresContainer}>
          {service.features.map((feature: string, featureIndex: number) => (
            <View key={featureIndex} style={styles.featureTag}>
              <Ionicons name="checkmark" size={12} color="#10B981" />
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
        <View style={styles.testimonialInfo}>
          <Text style={styles.testimonialName}>{testimonial.name}</Text>
          <Text style={styles.testimonialRestaurant}>{testimonial.restaurant}</Text>
        </View>
        <View style={styles.ratingContainer}>
          {[...Array(testimonial.rating)].map((_, index) => (
            <Ionicons key={index} name="star" size={16} color="#F59E0B" />
          ))}
        </View>
      </View>
      <Text style={styles.testimonialComment}>"{testimonial.comment}"</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>餐廳傢具</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>專業餐廳傢具</Text>
            <Text style={styles.heroSubtitle}>
              提供各式餐廳傢具，打造舒適優雅的用餐環境
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>傢具款式</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1000+</Text>
                <Text style={styles.statLabel}>滿意客戶</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5年</Text>
                <Text style={styles.statLabel}>品質保固</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroImageContainer}>
            <Ionicons name="bed" size={80} color="#10B981" />
          </View>
        </View>

        {/* Furniture Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>傢具類別</Text>
            <Text style={styles.sectionSubtitle}>點擊查看詳細資訊</Text>
          </View>
          <View style={styles.categoriesContainer}>
            {furnitureCategories.map(renderFurnitureCategory)}
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服務特色</Text>
          <View style={styles.servicesContainer}>
            {services.map(renderService)}
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>客戶評價</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialsScroll}>
            {testimonials.map(renderTestimonial)}
          </ScrollView>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>立即諮詢</Text>
          <Text style={styles.contactSubtitle}>
            專業團隊為您提供傢具諮詢與報價服務
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>聯絡我們</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="calendar-outline" size={20} color="#10B981" />
              <Text style={styles.secondaryButtonText}>預約參觀</Text>
            </TouchableOpacity>
          </View>
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
    borderBottomColor: '#eee',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#f8fafc',
  },
  heroContent: {
    flex: 1,
    marginRight: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  heroImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#ecfdf5',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  categoriesContainer: {
    gap: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCategoryCard: {
    borderWidth: 2,
    borderColor: '#10B981',
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
  categoryContent: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  priceRange: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  itemTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  itemText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 5,
  },
  servicesContainer: {
    gap: 20,
  },
  serviceItem: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#ecfdf5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  featureText: {
    fontSize: 12,
    color: '#166534',
    marginLeft: 4,
  },
  testimonialsScroll: {
    marginTop: 10,
  },
  testimonialCard: {
    width: width * 0.8,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testimonialRestaurant: {
    fontSize: 14,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  testimonialComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  contactSection: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  contactSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default RestaurantFurnitureScreen;
