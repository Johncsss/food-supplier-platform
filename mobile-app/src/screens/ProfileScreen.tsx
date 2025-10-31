import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getBestApiEndpoint } from '../utils/apiHelper';
import PointsPurchaseModal from '../components/PointsPurchaseModal';

const ProfileScreen: React.FC = () => {
  const { user, firebaseUser, signOut } = useAuth();
  const [memberPoints, setMemberPoints] = useState<number>(user?.memberPoints || 0);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false); // Start with loading false since we have user data
  const [showPointsModal, setShowPointsModal] = useState(false);

  // Update memberPoints when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setMemberPoints(user.memberPoints);
    }
  }, [user?.memberPoints]);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image Section - Top 40% */}
      <View style={[styles.backgroundSection, { height: screenHeight * 0.4 }]}>
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80'
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.restaurantName}>{user.restaurantName}</Text>
            </View>
            
            {/* Member Points Display */}
            <View style={styles.pointsCard}>
              <View style={styles.pointsIcon}>
                <Ionicons name="diamond" size={30} color="#10B981" />
              </View>
              <View style={styles.pointsContent}>
                <Text style={styles.pointsLabel}>會員點數</Text>
                <Text style={styles.pointsValue}>
                  {loadingPoints ? '載入中...' : memberPoints.toLocaleString()} 點
                </Text>
              </View>
              <View style={styles.pointsActions}>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchMemberPoints}>
                  <Ionicons name="refresh" size={20} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.purchaseButton} onPress={() => setShowPointsModal(true)}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Content Section - Bottom 60% */}
      <View style={[styles.content, { height: screenHeight * 0.6 }]}>
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>設定</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuText}>幫助</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color="#333" />
            <Text style={styles.menuText}>關於</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.signOutText}>登出</Text>
        </TouchableOpacity>
      </View>

      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        visible={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onPointsPurchased={(newBalance) => {
          if (typeof newBalance === 'number') {
            setMemberPoints(newBalance);
          } else if (firebaseUser?.uid) {
            // Fallback: refetch balance
            fetchMemberPoints();
          }
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
  pointsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
  pointsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    backgroundColor: '#fff',
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
});

export default ProfileScreen; 