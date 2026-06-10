import React, { useEffect, useState } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchServicePageAreas, fetchMobileAppData } from '../services/servicePageDefaults';

const { width } = Dimensions.get('window');

const RestaurantMaintenanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const [pageAreas, setPageAreas] = useState<any | null>(null);
  const [mobileAppData, setMobileAppData] = useState<any | null>(null);


  useEffect(() => {
    const loadPageData = async () => {
      try {
        const areas = await fetchServicePageAreas('restaurant-maintenance');
        setPageAreas(areas);
      } catch (error) {
        if (__DEV__) {
          console.log(
            'Warning: unable to load restaurant-maintenance page data for mobile, using defaults:',
            error,
          );
        }
      }
    };

    const loadMobileAppData = async () => {
      try {
        const areas = await fetchMobileAppData();
        if (areas) {
          setMobileAppData(areas);
        }
      } catch (error) {
        if (__DEV__) {
          console.log(
            'Warning: unable to load mobile-app page data, using defaults:',
            error,
          );
        }
      }
    };

    loadPageData();
    loadMobileAppData();
  }, []);

  const categoriesTitle = pageAreas?.categories?.title;
  const categoriesItems = pageAreas?.categories?.items || [];
  const featuresTitle = pageAreas?.features?.title;
  const featuresItems = pageAreas?.features?.items || [];
  const contactTitle = pageAreas?.contact?.title;
  const contactDescription = pageAreas?.contact?.description;
  const contactButtonText = pageAreas?.contact?.button1Text;
  const headerTitle = mobileAppData?.categories?.category2?.title;

  const renderCategory = (category: any, index: number) => (
    <View key={index} style={styles.categoryCard}>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <Text style={styles.categoryDescription}>{category.description}</Text>
      {category.items && category.items.length > 0 && (
        <View style={styles.itemsContainer}>
          {category.items.map((item: string, itemIndex: number) => (
            <View key={itemIndex} style={styles.itemTag}>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFeature = (feature: any, index: number) => (
    <View key={index} style={styles.featureCard}>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
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
        <Text style={styles.headerTitle}>{headerTitle || ''}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        {pageAreas?.banner?.imageUrl ? (
          <View style={styles.bannerSection}>
          <Image
              source={{ uri: pageAreas.banner.imageUrl }}
              style={styles.bannerImage}
            resizeMode="cover"
          />
          </View>
        ) : null}

        {/* Categories Section */}
        {categoriesTitle ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{categoriesTitle}</Text>
            {categoriesItems.length > 0 ? (
              categoriesItems.map((category: any, index: number) => renderCategory(category, index))
            ) : null}
        </View>
        ) : null}

        {/* Features Section */}
        {featuresTitle ? (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{featuresTitle}</Text>
            {featuresItems.length > 0 ? (
              <View style={styles.featuresGrid}>
                {featuresItems.map((feature: any, index: number) => renderFeature(feature, index))}
              </View>
            ) : null}
        </View>
        ) : null}

        {/* Contact Section */}
        {contactTitle ? (
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>{contactTitle}</Text>
            {contactDescription ? (
              <Text style={styles.contactSubtitle}>{contactDescription}</Text>
            ) : null}
            {contactButtonText ? (
          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.8}
                onPress={() => {
                  const whatsappUrl = 'https://wa.me/85298636938?text=您好，我想查詢。';
                  Linking.openURL(whatsappUrl).catch((err) => {
                    console.error('Failed to open WhatsApp:', err);
                  });
                }}
          >
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                <Text style={styles.contactButtonText}>{contactButtonText}</Text>
          </TouchableOpacity>
            ) : null}
        </View>
        ) : null}
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
  bannerSection: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
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
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemText: {
    fontSize: 12,
    color: '#374151',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
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
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: 'rgb(11, 134, 40)',
    padding: 30,
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 56,
  },
  contactButtonText: {
    color: '#0B8628',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default RestaurantMaintenanceScreen;
