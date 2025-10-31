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

const RestaurantMaintenanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const maintenanceCategories = [
    {
      id: 1,
      title: '設備維修',
      description: '專業設備維修服務，確保正常運作',
      icon: 'construct-outline',
      color: '#10B981',
      items: ['廚房設備', '空調系統', '冰箱維修', '爐具維修', '洗碗機維修'],
      priceRange: 'HKD$ 300 - 2,000',
      popular: true
    },
    {
      id: 2,
      title: '水電維修',
      description: '專業水電維修，解決各種水電問題',
      icon: 'flash-outline',
      color: '#3B82F6',
      items: ['水管維修', '電路維修', '燈具更換', '插座維修', '水龍頭維修'],
      priceRange: 'HKD$ 200 - 1,500',
      popular: true
    },
    {
      id: 3,
      title: '清潔保養',
      description: '專業清潔保養服務，保持環境衛生',
      icon: 'water-outline',
      color: '#F59E0B',
      items: ['深度清潔', '設備保養', '管道清潔', '通風清潔', '定期保養'],
      priceRange: 'HKD$ 500 - 3,000',
      popular: false
    },
    {
      id: 4,
      title: '傢具維修',
      description: '專業傢具維修，延長使用壽命',
      icon: 'bed-outline',
      color: '#8B5CF6',
      items: ['桌椅維修', '櫃子維修', '沙發維修', '門窗維修', '裝飾維修'],
      priceRange: 'HKD$ 150 - 1,200',
      popular: false
    },
    {
      id: 5,
      title: '緊急維修',
      description: '24小時緊急維修服務，快速解決問題',
      icon: 'call-outline',
      color: '#EF4444',
      items: ['緊急搶修', '故障排除', '應急處理', '臨時修復', '緊急支援'],
      priceRange: 'HKD$ 500 - 5,000',
      popular: true
    },
    {
      id: 6,
      title: '預防保養',
      description: '定期預防保養，避免設備故障',
      icon: 'shield-checkmark-outline',
      color: '#06B6D4',
      items: ['定期檢查', '預防保養', '零件更換', '性能檢測', '保養計劃'],
      priceRange: 'HKD$ 200 - 1,000',
      popular: false
    }
  ];

  const services = [
    {
      title: '24小時服務',
      description: '提供24小時緊急維修服務',
      icon: 'time-outline',
      features: ['全天候服務', '快速響應', '緊急搶修', '即時支援']
    },
    {
      title: '專業技術',
      description: '擁有專業技術團隊和先進設備',
      icon: 'hardware-chip-outline',
      features: ['專業技師', '先進工具', '技術認證', '經驗豐富']
    },
    {
      title: '原廠零件',
      description: '使用原廠零件，確保維修品質',
      icon: 'cube-outline',
      features: ['原廠零件', '品質保證', '保固服務', '零件供應']
    },
    {
      title: '合理價格',
      description: '提供合理透明的維修價格',
      icon: 'card-outline',
      features: ['透明報價', '合理收費', '無隱藏費用', '價格競爭']
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: '劉老闆',
      restaurant: '港式茶餐廳',
      comment: '維修服務很專業，師傅技術好，收費也合理！',
      rating: 5
    },
    {
      id: 2,
      name: '陳經理',
      restaurant: '日式料理店',
      comment: '24小時服務真的很方便，緊急情況都能快速解決。',
      rating: 5
    },
    {
      id: 3,
      name: '黃主廚',
      restaurant: '西式餐廳',
      comment: '設備維修後運作正常，服務態度也很好。',
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
          <Text style={styles.itemsTitle}>服務項目：</Text>
          <View style={styles.itemsContainer}>
            {category.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemTag}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.inquiryButton}>
            <Text style={styles.inquiryButtonText}>立即預約</Text>
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
        <Text style={styles.headerTitle}>餐飲維修</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2f6c5?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>專業餐飲維修</Text>
            <Text style={styles.heroSubtitle}>24小時服務，快速解決問題</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>維修服務</Text>
          {maintenanceCategories.map(renderCategory)}
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
          <Text style={styles.contactSubtitle}>專業團隊為您提供最優質的維修服務</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Alert.alert('聯繫我們', '請撥打維修專線：+852 1234 5678')}
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

export default RestaurantMaintenanceScreen;
