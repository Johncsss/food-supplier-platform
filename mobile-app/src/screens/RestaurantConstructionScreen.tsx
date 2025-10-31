import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RestaurantConstructionScreen: React.FC = () => {
  const navigation = useNavigation();

  const services = [
    {
      id: 1,
      title: '餐廳設計規劃',
      description: '專業的餐廳空間設計，從概念到實作全程服務',
      icon: 'design-outline',
      color: '#10B981'
    },
    {
      id: 2,
      title: '廚房設備安裝',
      description: '專業廚房設備安裝與配置，確保高效運作',
      icon: 'construct-outline',
      color: '#3B82F6'
    },
    {
      id: 3,
      title: '水電工程',
      description: '餐廳專用水電系統設計與安裝',
      icon: 'flash-outline',
      color: '#F59E0B'
    },
    {
      id: 4,
      title: '空調通風系統',
      description: '專業空調與通風系統安裝，確保舒適環境',
      icon: 'snow-outline',
      color: '#8B5CF6'
    },
    {
      id: 5,
      title: '消防系統',
      description: '符合法規的消防系統設計與安裝',
      icon: 'shield-outline',
      color: '#EF4444'
    },
    {
      id: 6,
      title: '裝修工程',
      description: '室內裝修、地板、牆面等整體裝修服務',
      icon: 'hammer-outline',
      color: '#06B6D4'
    }
  ];

  const features = [
    {
      title: '專業團隊',
      description: '擁有豐富餐廳工程經驗的專業團隊',
      icon: 'people-outline'
    },
    {
      title: '品質保證',
      description: '使用優質材料，提供品質保證',
      icon: 'checkmark-circle-outline'
    },
    {
      title: '快速施工',
      description: '高效施工流程，縮短營業中斷時間',
      icon: 'time-outline'
    },
    {
      title: '售後服務',
      description: '完善的售後服務與維護保養',
      icon: 'settings-outline'
    }
  ];

  const renderService = (service: any) => (
    <View key={service.id} style={styles.serviceCard}>
      <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
        <Ionicons name={service.icon as any} size={24} color="#fff" />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
      </View>
    </View>
  );

  const renderFeature = (feature: any, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={feature.icon as any} size={20} color="#10B981" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
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
        <Text style={styles.headerTitle}>餐廳工程</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>專業餐廳工程服務</Text>
            <Text style={styles.heroSubtitle}>
              從設計規劃到施工完成，提供全方位的餐廳工程解決方案
            </Text>
          </View>
          <View style={styles.heroImageContainer}>
            <Ionicons name="construct" size={80} color="#10B981" />
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服務項目</Text>
          <View style={styles.servicesContainer}>
            {services.map(renderService)}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服務特色</Text>
          <View style={styles.featuresContainer}>
            {features.map(renderFeature)}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>立即諮詢</Text>
          <Text style={styles.contactSubtitle}>
            專業團隊為您提供免費諮詢與報價服務
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>聯絡我們</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  servicesContainer: {
    gap: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featuresContainer: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
});

export default RestaurantConstructionScreen;
