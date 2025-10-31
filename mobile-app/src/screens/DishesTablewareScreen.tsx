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

const DishesTablewareScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dishesCategories = [
    {
      id: 1,
      title: '餐具套裝',
      description: '精美餐具套裝，提升用餐體驗',
      icon: 'restaurant-outline',
      color: '#10B981',
      items: ['陶瓷餐具', '骨瓷餐具', '不鏽鋼餐具', '木製餐具', '竹製餐具'],
      priceRange: 'HKD$ 200 - 2,000',
      popular: true
    },
    {
      id: 2,
      title: '玻璃器皿',
      description: '高品質玻璃器皿，透明美觀',
      icon: 'wine-outline',
      color: '#3B82F6',
      items: ['酒杯', '水杯', '咖啡杯', '茶具', '玻璃碗', '玻璃盤'],
      priceRange: 'HKD$ 50 - 800',
      popular: true
    },
    {
      id: 3,
      title: '廚房用具',
      description: '實用廚房用具，提升烹飪效率',
      icon: 'cut-outline',
      color: '#F59E0B',
      items: ['刀具', '砧板', '鍋具', '鏟子', '勺子', '量杯'],
      priceRange: 'HKD$ 100 - 1,500',
      popular: false
    },
    {
      id: 4,
      title: '餐桌用品',
      description: '精美餐桌用品，營造用餐氛圍',
      icon: 'flower-outline',
      color: '#8B5CF6',
      items: ['桌布', '餐墊', '餐巾', '花瓶', '蠟燭', '裝飾品'],
      priceRange: 'HKD$ 30 - 500',
      popular: false
    },
    {
      id: 5,
      title: '清潔用品',
      description: '專業清潔用品，保持餐具衛生',
      icon: 'water-outline',
      color: '#EF4444',
      items: ['洗碗精', '清潔劑', '消毒液', '抹布', '海綿', '刷子'],
      priceRange: 'HKD$ 20 - 200',
      popular: false
    },
    {
      id: 6,
      title: '儲存用品',
      description: '實用儲存用品，保持餐具整潔',
      icon: 'archive-outline',
      color: '#06B6D4',
      items: ['餐具盒', '保鮮盒', '密封罐', '收納架', '餐具櫃', '防塵罩'],
      priceRange: 'HKD$ 50 - 800',
      popular: false
    }
  ];

  const services = [
    {
      title: '客製化設計',
      description: '根據餐廳風格提供客製化餐具設計',
      icon: 'create-outline',
      features: ['免費設計諮詢', '品牌定制', '材質選擇', '尺寸客製']
    },
    {
      title: '品質保證',
      description: '使用優質材料，提供品質保證',
      icon: 'checkmark-circle-outline',
      features: ['原廠保固', '品質認證', '售後服務', '維修保養']
    },
    {
      title: '批量採購',
      description: '提供批量採購優惠價格',
      icon: 'cube-outline',
      features: ['批量折扣', '免費配送', '庫存管理', '定期補貨']
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
      name: '李老闆',
      restaurant: '港式茶餐廳',
      comment: '餐具品質很好，服務也很專業，客人反應都不錯！',
      rating: 5
    },
    {
      id: 2,
      name: '王經理',
      restaurant: '日式料理店',
      comment: '玻璃器皿很精美，提升了整體用餐體驗。',
      rating: 5
    },
    {
      id: 3,
      name: '陳主廚',
      restaurant: '西式餐廳',
      comment: '廚房用具很實用，大大提升了工作效率。',
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
          <Text style={styles.itemsTitle}>產品項目：</Text>
          <View style={styles.itemsContainer}>
            {category.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemTag}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.inquiryButton}>
            <Text style={styles.inquiryButtonText}>立即詢價</Text>
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
        <Text style={styles.headerTitle}>餐碟餐具</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>專業餐碟餐具</Text>
            <Text style={styles.heroSubtitle}>提升用餐體驗，展現餐廳品味</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>產品分類</Text>
          {dishesCategories.map(renderCategory)}
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
          <Text style={styles.contactSubtitle}>專業團隊為您提供最優質的服務</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Alert.alert('聯繫我們', '請撥打客服專線：+852 1234 5678')}
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

export default DishesTablewareScreen;
