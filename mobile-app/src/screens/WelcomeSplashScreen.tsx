import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WelcomeSplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const navigationState = useNavigationState((state) => state);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSkippedLogin', 'true');
    // Decide which navigator we're in based on available routes.
    // - In AuthStack: has 'MainApp' route, so reset to MainApp (which hosts tabs/Home)
    // - In TabNavigator stack: has 'MainTabs' route, so reset to MainTabs
    const routeNames = navigationState?.routeNames || [];
    const isInAuthStack = routeNames.includes('MainApp');

    if (isInAuthStack) {
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } else if (routeNames.includes('MainTabs')) {
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const url = data.logoUrl || '';
          // Validate URL - only accept Firebase Storage URLs or valid HTTPS URLs
          if (url && url.trim() !== '' && 
              (url.startsWith('https://firebasestorage.googleapis.com/') || 
               (url.startsWith('https://') && !url.includes('unsplash.com')))) {
            setLogoUrl(url);
          }
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLogo();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" />
        ) : logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logo}
            resizeMode="contain"
            onError={() => {
              // Fallback to default logo if remote logo fails to load
              setLogoUrl(null);
            }}
          />
        ) : (
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => (navigation as any).navigate('Login')}
        >
          <Text style={styles.loginButtonText}>登入</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: Dimensions.get('window').width * 0.96,
    height: Dimensions.get('window').width * 0.96,
    maxWidth: 480,
    maxHeight: 480,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeSplashScreen;


