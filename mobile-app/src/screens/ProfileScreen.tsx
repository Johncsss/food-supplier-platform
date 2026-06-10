import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { getBestApiEndpoint } from '../utils/apiHelper';
import PointsPurchaseModal from '../components/PointsPurchaseModal';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, firebaseUser, signOut, deleteAccount, loading: authLoading } = useAuth();
  const [memberPoints, setMemberPoints] = useState<number>(user?.memberPoints || 0);
  const [pendingPoints, setPendingPoints] = useState<number>(user?.pendingPoints || 0);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false);
  const [refreshingPoints, setRefreshingPoints] = useState<boolean>(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const membershipStatus = user?.membershipStatus ?? 'active';

  // Check authentication every time screen is focused - show alert and redirect to login if not authenticated
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && !firebaseUser) {
        // Show alert immediately when screen is focused
        Alert.alert(
          '需要登入',
          '此功能需要登入後才能使用，是否前往登入？',
          [
            { 
              text: '取消', 
              style: 'cancel', 
              onPress: () => (navigation as any).navigate('Home') 
            },
            {
              text: '前往登入',
              onPress: () => (navigation as any).navigate('Login'),
            },
          ]
        );
        // Navigate back to home immediately
        (navigation as any).navigate('Home');
      }
    }, [firebaseUser, authLoading, navigation])
  );

  const resolveDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && typeof value?.toDate === 'function') {
      try {
        return value.toDate();
      } catch {
        return null;
      }
    }
    if (typeof value === 'object' && typeof value?._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
    return null;
  };

  const membershipExpiryDate = useMemo(
    () => resolveDate(user?.membershipExpiry),
    [user?.membershipExpiry],
  );

  const membershipMeta = useMemo(() => {
    switch (membershipStatus) {
      case 'active':
        return {
          label: '有效',
          description: '會員資格有效，可享用全部平台功能。',
          iconBg: '#dcfce7',
          iconColor: '#16a34a',
          valueColor: '#16a34a',
          iconName: 'shield-checkmark-outline' as const,
          detail: membershipExpiryDate
            ? `註冊於：${membershipExpiryDate.toLocaleDateString('zh-TW')}`
            : null,
        };
      case 'expired':
        return {
          label: '已到期',
          description: '會員資格已到期，請聯絡客服續期。',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          valueColor: '#dc2626',
          iconName: 'close-circle-outline' as const,
          detail: membershipExpiryDate
            ? `註冊於：${membershipExpiryDate.toLocaleDateString('zh-TW')}`
            : null,
        };
      case 'inactive':
      default:
        return {
          label: '未啟用',
          description: '會員資格尚未啟用，請聯絡客服協助開通。',
          iconBg: '#fef3c7',
          iconColor: '#d97706',
          valueColor: '#d97706',
          iconName: 'alert-circle-outline' as const,
          detail: null,
        };
    }
  }, [membershipStatus, membershipExpiryDate]);

  // Update points when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setMemberPoints(user.memberPoints);
    }
    if (user?.pendingPoints !== undefined) {
      setPendingPoints(user.pendingPoints);
    }
  }, [user?.memberPoints, user?.pendingPoints]);

  // Fetch member points from API (background refresh)
  useEffect(() => {
    const fetchMemberPointsEffect = async () => {
      if (!firebaseUser?.uid) {
        // If no firebaseUser, use user data as fallback
        setMemberPoints(user?.memberPoints || 0);
        return;
      }
      
      // Don't show loading state for background refresh
      try {
        const baseEndpoint = await getBestApiEndpoint();
        if (!baseEndpoint) {
          console.log('No API endpoint available, using user data');
          return;
        }
        
        console.log('Background refresh: Fetching points from:', `${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`);
        
        const res = await fetch(`${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Background refresh response status:', res.status);
        
        if (!res.ok) {
          console.log('Background refresh failed, using user data');
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.log('Background refresh: Expected JSON but got:', contentType);
          return;
        }
        
        const data = await res.json();
        console.log('Background refresh API response data:', data);
        
        if (typeof data.memberPoints === 'number') {
          setMemberPoints(data.memberPoints);
          console.log('Background refresh: Successfully updated member points:', data.memberPoints);
        }
        if (typeof data.pendingPoints === 'number') {
          setPendingPoints(data.pendingPoints);
          console.log('Background refresh: Successfully updated pending points:', data.pendingPoints);
        }
      } catch (err) {
        console.log('Background refresh failed:', err);
        // Keep using user data, no need to change state
      }
    };

    // Only do background refresh if we have user data to fall back on
    if (user?.memberPoints !== undefined) {
      fetchMemberPointsEffect();
    }
  }, [firebaseUser, user]);

  // Show loading or redirect if not authenticated (AFTER all hooks)
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!firebaseUser) {
    // This should not be reached due to navigation redirect, but show empty screen as fallback
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            請先登入以查看帳戶資訊
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const quickActions = [
    {
      icon: 'create-outline' as const,
      label: '帳戶資料',
      description: '管理帳戶資訊與結帳密碼',
      onPress: () => (navigation as any).navigate('AccountDetails'),
    },
    {
      icon: 'pricetags-outline' as const,
      label: '購買點數',
      description: '選擇方案並上傳收據',
      onPress: () => setShowPointsModal(true),
    },
    {
      icon: 'heart-outline' as const,
      label: '收藏產品',
      description: '快速查看已收藏的產品',
      onPress: () => (navigation as any).navigate('Favorites'),
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'F&Q',
      description: '常見問題解答',
      onPress: () => (navigation as any).navigate('FAQ'),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: '隱私政策',
      description: '了解我們的隱私政策',
      onPress: () => (navigation as any).navigate('PrivacyPolicy'),
    },
    {
      icon: 'document-text-outline' as const,
      label: '服務條款',
      description: '查看服務條款與使用規範',
      onPress: () => (navigation as any).navigate('TermsOfService'),
    },
  ];

  // Function to fetch member points (can be called manually)
  const fetchMemberPoints = async () => {
    if (!firebaseUser?.uid) {
      setMemberPoints(user?.memberPoints || 0);
      return;
    }
    
    try {
      setLoadingPoints(true);
      const baseEndpoint = await getBestApiEndpoint();
      console.log('Fetching points from:', `${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`);
      
      const res = await fetch(`${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Expected JSON but got:', contentType, 'Content:', text.substring(0, 200));
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
      console.log('API response data:', data);
      
      if (typeof data.memberPoints === 'number') {
        setMemberPoints(data.memberPoints);
        console.log('Successfully updated member points:', data.memberPoints);
      } else {
        console.log('Invalid memberPoints data:', data.memberPoints);
        setMemberPoints(user?.memberPoints || 0);
      }

      if (typeof data.pendingPoints === 'number') {
        setPendingPoints(data.pendingPoints);
        console.log('Successfully updated pending points:', data.pendingPoints);
      } else if (user?.pendingPoints !== undefined) {
        console.log('Invalid pendingPoints data, falling back to user.pendingPoints:', data.pendingPoints);
        setPendingPoints(user.pendingPoints);
      }
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to fetch member points:', err);
      // Use fallback data
      const fallbackPoints = user?.memberPoints || 0;
      setMemberPoints(fallbackPoints);
      console.log('Using fallback points:', fallbackPoints);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      '登出',
      '確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: signOut }
      ]
    );
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      '刪除帳戶',
      '刪除後將無法復原，您的帳戶與相關資料將會永久移除。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '繼續', onPress: () => setShowDeleteAccountModal(true) }
      ]
    );
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deleteAccountPassword.trim()) {
      Alert.alert('錯誤', '請輸入您的密碼以確認刪除帳戶');
      return;
    }
    setDeleteAccountLoading(true);
    try {
      await deleteAccount(deleteAccountPassword);
      setShowDeleteAccountModal(false);
      setDeleteAccountPassword('');
    } catch (err: any) {
      const msg = err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
        ? '密碼錯誤，請重新輸入'
        : err?.message || '無法刪除帳戶，請稍後再試';
      Alert.alert('刪除失敗', msg);
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.content}>
          <Text style={styles.title}>請先登入</Text>
        </View>
      </SafeAreaView>
    );
  }

  const screenHeight = Dimensions.get('window').height;
  const backgroundImageSource = user?.profileBackgroundUrl
    ? { uri: user.profileBackgroundUrl }
    : {
        uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
      };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image Section - Top 40% */}
      <View style={[styles.backgroundSection, { height: screenHeight * 0.4 }]}>
        <ImageBackground source={backgroundImageSource} style={styles.backgroundImage} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, user?.profileImageUrl && styles.avatarWithImage]}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={50} color="#fff" />
                )}
              </View>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.restaurantName}>{user.restaurantName}</Text>
            </View>
            
          {/* Member Points Display */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsContent}>
              <Text style={styles.pointsLabel}>會員點數</Text>
              <Text style={styles.pointsValue}>
                {loadingPoints ? '載入中...' : memberPoints.toLocaleString()} 點
              </Text>
              <Text style={styles.lastUpdatedText}>
                {lastUpdatedAt
                  ? `最後更新：${new Date(lastUpdatedAt).toLocaleString('zh-TW')}`
                  : '點數資料即時同步'}
              </Text>
              </View>
              <View style={styles.pointsActions}>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  (loadingPoints || refreshingPoints) && { opacity: 0.5 },
                ]}
                onPress={async () => {
                  if (loadingPoints || refreshingPoints) return;
                  setRefreshingPoints(true);
                  await fetchMemberPoints();
                  const refreshedAt = new Date().toISOString();
                  setLastUpdatedAt(refreshedAt);
                  setRefreshingPoints(false);
                }}
                disabled={loadingPoints || refreshingPoints}
              >
                {loadingPoints || refreshingPoints ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#10B981" />
                    <Text style={styles.refreshButtonText}>重新整理</Text>
                  </>
                )}
              </TouchableOpacity>
                <TouchableOpacity style={styles.purchaseButton} onPress={() => setShowPointsModal(true)}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Content Section */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statCards}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="time-outline" size={22} color="#1D4ED8" />
            </View>
            <Text style={styles.statLabel}>待審核點數</Text>
            <Text style={styles.statValue}>{pendingPoints.toLocaleString()} 點</Text>
            <Text style={styles.statDescription}>
              {pendingPoints > 0
                ? '客服審核通過後，點數將立即加入帳戶。'
                : '目前沒有待審核的點數。'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: membershipMeta.iconBg }]}>
              <Ionicons name={membershipMeta.iconName} size={22} color={membershipMeta.iconColor} />
            </View>
            <Text style={styles.statLabel}>會員狀態</Text>
            <Text style={[styles.statValue, { color: membershipMeta.valueColor }]}>
              {membershipMeta.label}
            </Text>
            <Text style={styles.statDescription}>{membershipMeta.description}</Text>
            {membershipMeta.detail && (
              <Text style={styles.statDetail}>{membershipMeta.detail}</Text>
            )}
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.signOutText}>登出</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccountPress}>
          <Ionicons name="trash-outline" size={24} color="#9CA3AF" />
          <Text style={styles.deleteAccountText}>刪除帳戶</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Delete account confirmation modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteAccountLoading && setShowDeleteAccountModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>確認刪除帳戶</Text>
            <Text style={styles.deleteModalSubtitle}>請輸入您的密碼以永久刪除帳戶與資料</Text>
            <TextInput
              style={styles.deleteModalInput}
              placeholder="密碼"
              placeholderTextColor="#9CA3AF"
              value={deleteAccountPassword}
              onChangeText={setDeleteAccountPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!deleteAccountLoading}
            />
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                onPress={() => !deleteAccountLoading && (setShowDeleteAccountModal(false), setDeleteAccountPassword(''))}
                disabled={deleteAccountLoading}
              >
                <Text style={styles.deleteModalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                onPress={handleDeleteAccountConfirm}
                disabled={deleteAccountLoading}
              >
                {deleteAccountLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteModalButtonConfirmText}>永久刪除</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        visible={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onPointsPurchased={async (newBalance) => {
          if (typeof newBalance === 'number') {
            setMemberPoints(newBalance);
            setLastUpdatedAt(new Date().toISOString());
          } else {
            await fetchMemberPoints();
            setLastUpdatedAt(new Date().toISOString());
          }
        }}
        onRefreshPoints={async () => {
          await fetchMemberPoints();
          setLastUpdatedAt(new Date().toISOString());
        }}
        onReceiptSubmitted={async () => {
          await fetchMemberPoints();
          setLastUpdatedAt(new Date().toISOString());
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundSection: {
    width: '100%',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarWithImage: {
    backgroundColor: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  pointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pointsContent: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  lastUpdatedText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  pointsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
  },
  refreshButtonText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  purchaseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  menuSection: {
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  deleteAccountText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  deleteModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  deleteModalButtonConfirm: {
    backgroundColor: '#DC2626',
  },
  deleteModalButtonCancelText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  deleteModalButtonConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  statCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 20,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statDescription: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  statDetail: {
    marginTop: 6,
    fontSize: 12,
    color: '#4b5563',
  },
  actionsGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionDescription: {
    flex: 2,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
    marginRight: 12,
  },
});

export default ProfileScreen; 