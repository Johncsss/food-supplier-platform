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

const KitchenEquipmentScreen: React.FC = () => {
  const navigation = useNavigation();

  const equipmentCategories = [
    {
      id: 1,
      title: '烹飪設備',
      description: '專業烹飪設備，提升廚房效率',
      icon: 'flame-outline',
      color: '#EF4444',
      items: ['爐具', '烤箱', '蒸籠', '炸鍋', '烤架', '平底鍋']
    },
    {
      id: 2,
      title: '冷藏設備',
      description: '高效冷藏設備，保持食材新鮮',
      icon: 'snow-outline',
      color: '#3B82F6',
      items: ['冰箱', '冷凍櫃', '冷藏櫃', '製冰機', '冷卻器', '保鮮櫃']
    },
    {
      id: 3,
      title: '清潔設備',
      description: '專業清潔設備，確保衛生標準',
      icon: 'water-outline',
      color: '#10B981',
      items: ['洗碗機', '消毒櫃', '清潔機', '烘乾機', '洗滌槽', '清潔劑']
    },
    {
      id: 4,
      title: '切配設備',
      description: '高效切配設備，提升備料效率',
      icon: 'cut-outline',
      color: '#F59E0B',
      items: ['切菜機', '攪拌機', '榨汁機', '切片機', '絞肉機', '攪拌器']
    },
    {
      id: 5,
      title: '烘焙設備',
      description: '專業烘焙設備，製作精美糕點',
      icon: 'bread-outline',
      color: '#8B5CF6',
      items: ['烤箱', '發酵箱', '攪拌機', '壓麵機', '模具', '烘焙工具']
    },
    {
      id: 6,
      title: '通風設備',
      description: '高效通風設備，保持廚房空氣清新',
      icon: 'airplane-outline',
      color: '#06B6D4',
      items: ['抽油煙機', '排風扇', '通風管', '空氣淨化器', '風扇', '通風系統']
    }
  ];

  const services = [
    {
      title: '專業安裝',
      description: '專業技術團隊提供設備安裝服務',
      icon: 'construct-outline'
    },
    {
      title: '定期維護',
      description: '定期維護保養，確保設備正常運作',
      icon: 'settings-outline'
    },
    {
      title: '技術支援',
      description: '24小時技術支援與故障排除',
      icon: 'call-outline'
    },
    {
      title: '零件供應',
      description: '原廠零件供應，確保設備品質',
      icon: 'cube-outline'
    }
  ];

  const features = [
    {
      title: '節能環保',
      description: '採用節能技術，降低營運成本',
      icon: 'leaf-outline'
    },
    {
      title: '安全可靠',
      description: '符合安全標準，保障使用安全',
      icon: 'shield-checkmark-outline'
    },
    {
      title: '高效運作',
      description: '提升廚房工作效率',
      icon: 'speedometer-outline'
    },
    {
      title: '易於操作',
      description: '人性化設計，操作簡單方便',
      icon: 'hand-left-outline'
    }
  ];

  const renderEquipmentCategory = (category: any) => (
    <View key={category.id} style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>
      </View>
      <View style={styles.itemsContainer}>
        {category.items.map((item: string, index: number) => (
          <View key={index} style={styles.itemTag}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderService = (service: any, index: number) => (
    <View key={index} style={styles.serviceItem}>
      <View style={styles.serviceIcon}>
        <Ionicons name={service.icon as any} size={20} color="#10B981" />
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
        <Text style={styles.headerTitle}>廚房設備</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>專業廚房設備</Text>
            <Text style={styles.heroSubtitle}>
              提供全套廚房設備解決方案，提升餐廳營運效率
            </Text>
          </View>
          <View style={styles.heroImageContainer}>
            <Ionicons name="restaurant" size={80} color="#10B981" />
          </View>
        </View>

        {/* Equipment Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設備類別</Text>
          <View style={styles.categoriesContainer}>
            {equipmentCategories.map(renderEquipmentCategory)}
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
          <Text style={styles.sectionTitle}>設備特色</Text>
          <View style={styles.featuresContainer}>
            {features.map(renderFeature)}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>立即諮詢</Text>
          <Text style={styles.contactSubtitle}>
            專業團隊為您提供廚房設備諮詢與報價服務
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
  categoriesContainer: {
    gap: 20,
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  itemText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  servicesContainer: {
    gap: 15,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
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
    marginBottom: 3,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#dcfce7',
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

export default KitchenEquipmentScreen;
