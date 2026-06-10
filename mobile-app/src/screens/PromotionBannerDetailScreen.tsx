import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type PromotionBannerDetailParams = {
  banner?: {
    id?: number;
    image?: string;
    detailImage?: string;
    detailUrl?: string;
    title?: string;
    subtitle?: string;
  };
};

const PromotionBannerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { banner }: PromotionBannerDetailParams = route.params || {};

  // Only use detailImage, no fallback to banner image
  const imageUri = banner?.detailImage;
  const detailUrl = banner?.detailUrl;

  const handleUrlPress = async () => {
    if (!detailUrl) return;
    
    try {
      const canOpen = await Linking.canOpenURL(detailUrl);
      if (canOpen) {
        await Linking.openURL(detailUrl);
      } else {
        Alert.alert('錯誤', '無法開啟此連結');
      }
    } catch (error) {
      Alert.alert('錯誤', '開啟連結時發生錯誤');
    }
  };

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
        <Text style={styles.headerTitle}>詳情</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {imageUri ? (
          <TouchableOpacity
            onPress={detailUrl ? handleUrlPress : undefined}
            activeOpacity={detailUrl ? 0.8 : 1}
            disabled={!detailUrl}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderBanner}>
            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            <Text style={styles.placeholderText}>尚未設定詳情圖片</Text>
          </View>
        )}
      </View>
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
  headerPlaceholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bannerImage: {
    width: width - 40,
    height: height * 0.35,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  placeholderBanner: {
    width: width - 40,
    height: height * 0.35,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default PromotionBannerDetailScreen;


