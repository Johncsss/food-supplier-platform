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

const PromotionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const promotionServices = [
    {
      id: 1,
      title: '數位行銷',
      description: '全方位的數位行銷解決方案',
      icon: 'phone-portrait-outline',
      color: '#10B981',
      items: ['社群媒體管理', 'Google廣告', 'Facebook廣告', 'Instagram行銷', 'LINE官方帳號', '網站優化'],
      priceRange: 'HKD$ 3,000 - 15,000/月',
      popular: true,
      features: ['數據分析', 'A/B測試', 'ROI追蹤', '24/7監控']
    },
    {
      id: 2,
      title: '傳統廣告',
      description: '傳統媒體廣告投放服務',
      icon: 'newspaper-outline',
      color: '#3B82F6',
      items: ['報紙廣告', '雜誌廣告', '廣播廣告', '電視廣告', '戶外看板', '傳單設計'],
      priceRange: 'HKD$ 5,000 - 50,000/次',
      popular: false,
      features: ['媒體規劃', '創意設計', '投放執行', '效果評估']
    },
    {
      id: 3,
      title: '活動策劃',
      description: '專業活動策劃與執行',
      icon: 'calendar-outline',
      color: '#F59E0B',
      items: ['開幕活動', '節慶活動', '促銷活動', '品嚐會', '記者會', '展覽活動'],
      priceRange: 'HKD$ 10,000 - 100,000/場',
      popular: true,
      features: ['全程策劃', '現場執行', '媒體邀請', '效果追蹤']
    },
    {
      id: 4,
      title: '品牌設計',
      description: '完整的品牌形象設計',
      icon: 'color-palette-outline',
      color: '#8B5CF6',
      items: ['Logo設計', '名片設計', '菜單設計', '包裝設計', '店面設計', '制服設計'],
      priceRange: 'HKD$ 2,000 - 20,000/項',
      popular: true,
      features: ['品牌策略', '視覺設計', '應用規範', '品牌手冊']
    },
    {
      id: 5,
      title: '內容創作',
      description: '專業內容創作與製作',
      icon: 'camera-outline',
      color: '#EF4444',
      items: ['美食攝影', '影片製作', '文案撰寫', '產品介紹', '故事行銷', '內容企劃'],
      priceRange: 'HKD$ 1,500 - 8,000/項',
      popular: false,
      features: ['專業攝影', '後製剪輯', '文案創作', '多平台發布']
    },
    {
      id: 6,
      title: '公關服務',
      description: '專業公關與媒體關係',
      icon: 'people-outline',
      color: '#06B6D4',
      items: ['媒體關係', '新聞發布', '危機處理', '口碑管理', 'KOL合作', '網紅行銷'],
      priceRange: 'HKD$ 8,000 - 30,000/月',
      popular: false,
      features: ['媒體監測', '危機預警', 'KOL配對', '效果報告']
    }
  ];

  const services = [
    {
      title: '策略規劃',
      description: '根據餐廳特色制定專屬行銷策略',
      icon: 'analytics-outline',
      features: ['市場分析', '競爭分析', '目標設定', '策略制定']
    },
    {
      title: '創意設計',
      description: '專業設計團隊提供創意視覺設計',
      icon: 'brush-outline',
      features: ['視覺設計', '創意企劃', '品牌識別', '多媒體製作']
    },
    {
      title: '數據分析',
      description: '詳細數據分析，優化行銷效果',
      icon: 'bar-chart-outline',
      features: ['數據收集', '效果分析', '優化建議', '報告製作']
    },
    {
      title: '效果追蹤',
      description: '持續追蹤行銷效果，調整策略',
      icon: 'trending-up-outline',
      features: ['效果監測', '策略調整', '績效報告', '持續優化']
    }
  ];

  const benefits = [
    {
      title: '提升知名度',
      description: '有效提升餐廳在市場的知名度',
      icon: 'megaphone-outline',
      percentage: '85%'
    },
    {
      title: '增加客流量',
      description: '吸引更多顧客到店消費',
      icon: 'people-circle-outline',
      percentage: '120%'
    },
    {
      title: '建立品牌',
      description: '建立獨特的餐廳品牌形象',
      icon: 'star-outline',
      percentage: '95%'
    },
    {
      title: '提高營收',
      description: '透過有效行銷提高餐廳營收',
      icon: 'cash-outline',
      percentage: '150%'
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: '陳老闆',
      restaurant: '日式料理店',
      rating: 5,
      comment: '數位行銷效果很好，客流量明顯增加，ROI超出預期！',
      service: '數位行銷'
    },
    {
      id: 2,
      name: '林經理',
      restaurant: '義式餐廳',
      rating: 5,
      comment: '品牌設計很專業，整體形象提升很多，客人反應很好。',
      service: '品牌設計'
    },
    {
      id: 3,
      name: '黃店長',
      restaurant: '咖啡廳',
      rating: 5,
      comment: '活動策劃很成功，開幕活動吸引了很多媒體關注。',
      service: '活動策劃'
    }
  ];

  const handleServicePress = (service: any) => {
    setSelectedService(selectedService === service.title ? null : service.title);
  };

  const handleContactPress = () => {
    Alert.alert(
      '聯絡我們',
      '請選擇聯絡方式',
      [
        { text: '取消', style: 'cancel' },
        { text: '電話諮詢', onPress: () => console.log('電話諮詢') },
        { text: '線上諮詢', onPress: () => console.log('線上諮詢') },
        { text: '預約會議', onPress: () => console.log('預約會議') }
      ]
    );
  };

  const renderPromotionService = (service: any) => (
    <TouchableOpacity 
      key={service.id} 
      style={[
        styles.serviceCard,
        selectedService === service.title && styles.selectedServiceCard
      ]}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.8}
    >
      <View style={styles.serviceHeader}>
        <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
          <Ionicons name={service.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.serviceContent}>
          <View style={styles.serviceTitleRow}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            {service.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>熱門</Text>
              </View>
            )}
          </View>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <Text style={styles.priceRange}>{service.priceRange}</Text>
        </View>
        <Ionicons 
          name={selectedService === service.title ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#666" 
        />
      </View>
      
      {selectedService === service.title && (
        <View style={styles.expandedContent}>
          <View style={styles.itemsContainer}>
            {service.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemTag}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>服務特色：</Text>
            {service.features.map((feature: string, index: number) => (
              <View key={index} style={styles.featureTag}>
                <Ionicons name="checkmark" size={12} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>查看詳細方案</Text>
            <Ionicons name="arrow-forward" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderService = (service: any, index: number) => (
    <View key={index} style={styles.serviceItem}>
      <View style={styles.serviceIconSmall}>
        <Ionicons name={service.icon as any} size={24} color="#10B981" />
      </View>
      <View style={styles.serviceContentSmall}>
        <Text style={styles.serviceTitleSmall}>{service.title}</Text>
        <Text style={styles.serviceDescriptionSmall}>{service.description}</Text>
        <View style={styles.featuresContainerSmall}>
          {service.features.map((feature: string, featureIndex: number) => (
            <View key={featureIndex} style={styles.featureTagSmall}>
              <Ionicons name="checkmark" size={10} color="#10B981" />
              <Text style={styles.featureTextSmall}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBenefit = (benefit: any, index: number) => (
    <View key={index} style={styles.benefitItem}>
      <View style={styles.benefitIcon}>
        <Ionicons name={benefit.icon as any} size={24} color="#10B981" />
      </View>
      <View style={styles.benefitContent}>
        <Text style={styles.benefitTitle}>{benefit.title}</Text>
        <Text style={styles.benefitDescription}>{benefit.description}</Text>
        <Text style={styles.benefitPercentage}>{benefit.percentage} 提升</Text>
      </View>
    </View>
  );

  const renderTestimonial = (testimonial: any) => (
    <View key={testimonial.id} style={styles.testimonialCard}>
      <View style={styles.testimonialHeader}>
        <View style={styles.testimonialInfo}>
          <Text style={styles.testimonialName}>{testimonial.name}</Text>
          <Text style={styles.testimonialRestaurant}>{testimonial.restaurant}</Text>
          <Text style={styles.testimonialService}>{testimonial.service}</Text>
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
        <Text style={styles.headerTitle}>宣傳</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>餐廳宣傳服務</Text>
            <Text style={styles.heroSubtitle}>
              專業行銷團隊為您的餐廳提供全方位宣傳解決方案
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>200+</Text>
                <Text style={styles.statLabel}>成功案例</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>95%</Text>
                <Text style={styles.statLabel}>客戶滿意度</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3年</Text>
                <Text style={styles.statLabel}>平均合作</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroImageContainer}>
            <Ionicons name="megaphone" size={80} color="#10B981" />
          </View>
        </View>

        {/* Promotion Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>宣傳服務</Text>
            <Text style={styles.sectionSubtitle}>點擊查看詳細資訊</Text>
          </View>
          <View style={styles.servicesContainer}>
            {promotionServices.map(renderPromotionService)}
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服務特色</Text>
          <View style={styles.servicesGrid}>
            {services.map(renderService)}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>宣傳效益</Text>
          <View style={styles.benefitsContainer}>
            {benefits.map(renderBenefit)}
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
            專業行銷團隊為您提供免費諮詢與方案規劃
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>聯絡我們</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="calendar-outline" size={20} color="#10B981" />
              <Text style={styles.secondaryButtonText}>預約會議</Text>
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
  servicesContainer: {
    gap: 15,
  },
  serviceCard: {
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
  selectedServiceCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  serviceTitle: {
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
  serviceDescription: {
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
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  itemText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 15,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#166534',
    marginLeft: 4,
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  serviceItem: {
    width: (width - 60) / 2,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  serviceIconSmall: {
    width: 50,
    height: 50,
    backgroundColor: '#ecfdf5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceContentSmall: {
    alignItems: 'center',
  },
  serviceTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  serviceDescriptionSmall: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  featuresContainerSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  featureTagSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  featureTextSmall: {
    fontSize: 10,
    color: '#166534',
    marginLeft: 2,
  },
  benefitsContainer: {
    gap: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
  },
  benefitIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#dcfce7',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  benefitPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
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
  testimonialService: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
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

export default PromotionScreen;