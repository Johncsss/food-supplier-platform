import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../services/firebase';

const storage = getStorage(app);

interface FormState {
  name: string;
  phone: string;
  restaurantName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  checkoutPassword: string;
  profileImageUrl: string;
  profileBackgroundUrl: string;
}

const AccountDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, firebaseUser, loading: authLoading, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    name: '',
    phone: '',
    restaurantName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    checkoutPassword: '',
    profileImageUrl: '',
    profileBackgroundUrl: '',
  });
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [backgroundImagePreview, setBackgroundImagePreview] = useState('');
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingBackgroundImage, setUploadingBackgroundImage] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && !firebaseUser) {
        Alert.alert(
          '需要登入',
          '此功能需要登入後才能使用，是否前往登入？',
          [
            {
              text: '取消',
              style: 'cancel',
              onPress: () => (navigation as any).navigate('Home'),
            },
            {
              text: '前往登入',
              onPress: () => (navigation as any).navigate('Login'),
            },
          ],
        );
        (navigation as any).navigate('Home');
      }
    }, [authLoading, firebaseUser, navigation]),
  );

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        restaurantName: user.restaurantName || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
        },
        checkoutPassword: user.checkoutPassword || '',
        profileImageUrl: user.profileImageUrl || '',
        profileBackgroundUrl: user.profileBackgroundUrl || '',
      });
      setProfileImagePreview('');
      setBackgroundImagePreview('');
    }
  }, [user]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    if (field === 'address') {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: keyof FormState['address'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSelectImage = async (type: 'profile' | 'background') => {
    if (!firebaseUser) {
      Alert.alert('需要登入', '請先登入後再編輯圖片');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('權限不足', '請允許存取相簿以選擇圖片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const setUploading = type === 'profile' ? setUploadingProfileImage : setUploadingBackgroundImage;
    const setPreview = type === 'profile' ? setProfileImagePreview : setBackgroundImagePreview;
    const label = type === 'profile' ? '頭像' : '背景圖片';

    try {
      setUploading(true);
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const filePath = `account_images/${firebaseUser.uid}/${type}_${Date.now()}.jpg`;
      const imageRef = ref(storage, filePath);
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);

      setFormData((prev) => {
        if (type === 'profile') {
          return { ...prev, profileImageUrl: downloadUrl };
        }
        return { ...prev, profileBackgroundUrl: downloadUrl };
      });
      setPreview(asset.uri);
      Alert.alert('成功', `${label}已更新`);
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('錯誤', '圖片上傳失敗，請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (type: 'profile' | 'background') => {
    const setPreview = type === 'profile' ? setProfileImagePreview : setBackgroundImagePreview;

    setFormData((prev) => {
      if (type === 'profile') {
        return { ...prev, profileImageUrl: '' };
      }
      return { ...prev, profileBackgroundUrl: '' };
    });
    setPreview('');
  };

  const handleSave = async () => {
    if (!firebaseUser) {
      Alert.alert('需要登入', '請先登入後再嘗試更新帳戶資料');
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, {
        name: formData.name,
        phone: formData.phone,
        restaurantName: formData.restaurantName,
        address: formData.address,
        checkoutPassword: formData.checkoutPassword,
        profileImageUrl: formData.profileImageUrl || '',
        profileBackgroundUrl: formData.profileBackgroundUrl || '',
        updatedAt: new Date(),
      });

      await refreshUser();
      Alert.alert('更新成功', '帳戶資料已更新');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update account details:', error);
      Alert.alert('更新失敗', '請稍後再試，或聯絡客服協助處理。');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
      </SafeAreaView>
    );
  }

  if (!firebaseUser) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={{ fontSize: 16, color: '#666' }}>請先登入以查看帳戶資料</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>帳戶資料</Text>
            <Text style={styles.headerSubtitle}>管理您的帳戶資訊</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="聯絡人資訊">
            <LabeledInput
              label="姓名"
              placeholder="請輸入姓名"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyLabel}>電郵</Text>
              <Text style={styles.readonlyValue}>{user?.email || '未設定'}</Text>
              <Text style={styles.readonlyHint}>電郵地址無法修改</Text>
            </View>
            {firebaseUser && (
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyLabel}>用戶ID</Text>
                <Text style={styles.readonlyValue}>{firebaseUser.uid}</Text>
                <Text style={styles.readonlyHint}>系統自動生成的唯一識別碼</Text>
              </View>
            )}
            <LabeledInput
              label="電話"
              placeholder="請輸入電話號碼"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
            />
          </Section>

          <Section title="外觀設定">
            <Text style={styles.sectionDescription}>
              自訂帳戶頁面的背景與頭像，讓帳戶頁更符合您的品牌風格。
            </Text>
            <View style={styles.imageSelectors}>
              <ImageSelector
                label="背景圖片（帳戶頁頂部）"
                description="建議橫向圖片，1200x800 以上，會顯示在帳戶頁頂部背景。"
                imageUri={backgroundImagePreview || formData.profileBackgroundUrl}
                onSelect={() => handleSelectImage('background')}
                onRemove={() => handleRemoveImage('background')}
                uploading={uploadingBackgroundImage}
              />
              <ImageSelector
                label="頭像（圓形大頭照）"
                description="建議正方形圖片，600x600 以上，會顯示在帳戶名稱上方。"
                imageUri={profileImagePreview || formData.profileImageUrl}
                onSelect={() => handleSelectImage('profile')}
                onRemove={() => handleRemoveImage('profile')}
                uploading={uploadingProfileImage}
                isAvatar
              />
            </View>
          </Section>

          <Section title="餐廳資訊">
            <LabeledInput
              label="餐廳名稱"
              placeholder="請輸入餐廳名稱"
              value={formData.restaurantName}
              onChangeText={(text) => handleInputChange('restaurantName', text)}
            />
            <LabeledInput
              label="地址"
              placeholder="請輸入地址"
              value={formData.address.street}
              onChangeText={(text) => handleAddressChange('street', text)}
            />
          </Section>

          <Section title="安全設定">
            <LabeledInput
              label="結帳密碼"
              placeholder="請輸入結帳密碼"
              secureTextEntry
              value={formData.checkoutPassword}
              onChangeText={(text) => handleInputChange('checkoutPassword', text)}
            />
            <Text style={styles.helperText}>
              設定後，使用購物車結帳時需要輸入此密碼以保護帳戶安全。
            </Text>
          </Section>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>儲存帳戶資料</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

interface ImageSelectorProps {
  label: string;
  description?: string;
  imageUri?: string;
  uploading?: boolean;
  onSelect: () => void;
  onRemove: () => void;
  isAvatar?: boolean;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({
  label,
  description,
  imageUri,
  uploading = false,
  onSelect,
  onRemove,
  isAvatar = false,
}) => {
  // 專門為頭像提供更簡潔、置中的體驗
  if (isAvatar) {
    return (
      <View style={[styles.imageCard, styles.avatarCard]}>
        <Text style={styles.imageLabel}>{label}</Text>
        {description && <Text style={styles.imageDescriptionCenter}>{description}</Text>}

        <TouchableOpacity
          style={styles.avatarPreviewWrapper}
          onPress={onSelect}
          activeOpacity={0.85}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarPreview} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={52} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>點擊上載大頭照</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.imageUploadingOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadingText}>上載中...</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.imageActions, styles.avatarActions]}>
          <TouchableOpacity
            style={styles.imageActionButton}
            onPress={onSelect}
            disabled={uploading}
          >
            <Ionicons name="images-outline" size={16} color="#2563EB" />
            <Text style={styles.imageActionText}>從相簿選擇大頭照</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.imageActionButton, styles.removeButton]}
            onPress={onRemove}
            disabled={uploading}
          >
            <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
            <Text style={[styles.imageActionText, { color: '#6B7280' }]}>移除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 背景圖片沿用原本橫向卡片風格
  return (
    <View style={styles.imageCard}>
      <Text style={styles.imageLabel}>{label}</Text>
      {description && <Text style={styles.imageDescription}>{description}</Text>}
      <TouchableOpacity style={styles.imagePreviewWrapper} onPress={onSelect} activeOpacity={0.8}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            <Text style={styles.imagePlaceholderText}>點擊選擇{label}</Text>
          </View>
        )}
        {uploading && (
          <View style={styles.imageUploadingOverlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.uploadingText}>上傳中...</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.imageActions}>
        <TouchableOpacity style={styles.imageActionButton} onPress={onSelect} disabled={uploading}>
          <Ionicons name="cloud-upload-outline" size={16} color="#2563EB" />
          <Text style={styles.imageActionText}>更換</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.imageActionButton, styles.removeButton]}
          onPress={onRemove}
          disabled={uploading}
        >
          <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
          <Text style={[styles.imageActionText, { color: '#6B7280' }]}>移除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface LabeledInputProps {
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  onChangeText: (text: string) => void;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  value,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  onChangeText,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      style={styles.input}
      placeholderTextColor="#9CA3AF"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  sectionContent: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  imageSelectors: {
    gap: 12,
  },
  imageCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  avatarCard: {
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  imageDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 10,
  },
  imageDescriptionCenter: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  imagePreviewWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  imagePreview: {
    width: '100%',
    height: 140,
  },
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  avatarPreviewWrapper: {
    marginTop: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  imageUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: 6,
    fontSize: 12,
    color: '#fff',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  avatarActions: {
    justifyContent: 'center',
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  removeButton: {
    backgroundColor: '#F3F4F6',
  },
  imageActionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  readonlyField: {
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  readonlyLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  readonlyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  readonlyHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -8,
  },
  saveButton: {
    backgroundColor: '#0B8628',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0B8628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountDetailsScreen;

