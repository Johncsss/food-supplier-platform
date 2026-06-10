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

const KitchenEquipmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const [pageAreas, setPageAreas] = useState<any | null>(null);
  const [mobileAppData, setMobileAppData] = useState<any | null>(null);


  useEffect(() => {
    const loadPageData = async () => {
      try {
        const areas = await fetchServicePageAreas('kitchen-equipment');
        if (__DEV__) {
          console.log('Kitchen Equipment data loaded:', {
            categoriesTitle: areas?.categories?.title,
            categoriesCount: areas?.categories?.items?.length,
            firstCategory: areas?.categories?.items?.[0]?.title,
          });
        }
        setPageAreas(areas);
      } catch (error) {
        if (__DEV__) {
          console.log('Warning: unable to load kitchen-equipment page data:', error);
        }
        // fetchServicePageAreas already returns defaults on error
        const defaults = require('../services/servicePageDefaults').SERVICE_PAGE_DEFAULTS['kitchen-equipment'];
        setPageAreas(defaults);
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
          console.log('Warning: unable to load mobile-app page data:', error);
        }
      }
    };

    loadPageData();
    loadMobileAppData();
  }, []);

  const categoriesTitle = pageAreas?.categories?.title;
  const categoriesDescription = pageAreas?.categories?.description;
  const categoriesItems = pageAreas?.categories?.items || [];
  const servicesTitle = pageAreas?.services?.title;
  const servicesDescription = pageAreas?.services?.description;
  const servicesItems = pageAreas?.services?.items || [];
  const featuresTitle = pageAreas?.features?.title;
  const featuresDescription = pageAreas?.features?.description;
  const featuresItems = pageAreas?.features?.items || [];
  const contactTitle = pageAreas?.contact?.title;
  const contactDescription = pageAreas?.contact?.description;
  const contactButtonText = pageAreas?.contact?.button1Text;
  const headerTitle = mobileAppData?.categories?.category3?.title;

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

  const renderService = (service: any, index: number) => (
    <View key={index} style={styles.serviceItem}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
    </View>
  );

  const renderFeature = (feature: any, index: number) => (
    <View key={index} style={styles.featureItem}>
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
            {categoriesDescription ? (
              <Text style={styles.sectionDescription}>{categoriesDescription}</Text>
            ) : null}
            {categoriesItems.length > 0 ? (
          <View style={styles.categoriesContainer}>
                {categoriesItems.map((category: any, index: number) => renderCategory(category, index))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Services Section */}
        {servicesTitle ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{servicesTitle}</Text>
            {servicesDescription ? (
              <Text style={styles.sectionDescription}>{servicesDescription}</Text>
            ) : null}
            {servicesItems.length > 0 ? (
              <View style={styles.servicesGrid}>
                {servicesItems.map((service: any, index: number) => renderService(service, index))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Features Section */}
        {featuresTitle ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{featuresTitle}</Text>
            {featuresDescription ? (
              <Text style={styles.sectionDescription}>{featuresDescription}</Text>
            ) : null}
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
    paddingVertical: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoriesContainer: {
    gap: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: (width - 60) / 2,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: (width - 60) / 2,
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: 'rgb(11, 134, 40)',
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#0B8628',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default KitchenEquipmentScreen;
