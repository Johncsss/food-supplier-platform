import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Category } from '../types';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  const categories: Category[] = [
    {
      id: '1',
      name: '結婚戒指',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
      description: '精選結婚戒指',
      productCount: 12
    },
    {
      id: '2',
      name: '耳環',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
      description: '時尚耳環款式',
      productCount: 8
    },
    {
      id: '3',
      name: '鑽石戒指',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
      description: '璀璨鑽石戒指',
      productCount: 15
    },
    {
      id: '4',
      name: '頸鏈款式',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
      description: '優雅頸鏈設計',
      productCount: 10
    },
    {
      id: '5',
      name: '手鐲',
      imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
      description: '精美手鐲系列',
      productCount: 6
    },
    {
      id: '6',
      name: '寶石',
      imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400',
      description: '天然寶石',
      productCount: 20
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>星之鑽</Text>
        <Text style={styles.welcomeText}>歡迎親臨門市選購。</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroText}>Customise your own</Text>
            <Text style={styles.heroTextBold}>Diamond Ring!</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>產品類別</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>預約服務</Text>
          </TouchableOpacity>
        </View>

        {/* Product Categories Grid */}
        <View style={styles.categoriesContainer}>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <Image
                  source={{ uri: category.imageUrl }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryOverlay}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  heroBanner: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  heroText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  heroTextBold: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff4444',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#ff4444',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom tab bar
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    height: 120,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen; 