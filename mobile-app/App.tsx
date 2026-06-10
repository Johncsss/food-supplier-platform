import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { CartProvider } from './src/hooks/useCart';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import WelcomeSplashScreen from './src/screens/WelcomeSplashScreen';
import CategoryProductsScreen from './src/screens/CategoryProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import RestaurantConstructionScreen from './src/screens/RestaurantConstructionScreen';
import RestaurantFurnitureScreen from './src/screens/RestaurantFurnitureScreen';
import KitchenEquipmentScreen from './src/screens/KitchenEquipmentScreen';
import PromotionScreen from './src/screens/PromotionScreen';
import PromotionBannerDetailScreen from './src/screens/PromotionBannerDetailScreen';
import DishesTablewareScreen from './src/screens/DishesTablewareScreen';
import RestaurantMaintenanceScreen from './src/screens/RestaurantMaintenanceScreen';
import RestaurantSystemsScreen from './src/screens/RestaurantSystemsScreen';
import AccountDetailsScreen from './src/screens/AccountDetailsScreen';
import FAQScreen from './src/screens/FAQScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import { View, ActivityIndicator, Text, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/services/firebase';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainTabs">
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="WelcomeSplash" component={WelcomeSplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="RestaurantConstruction" component={RestaurantConstructionScreen} />
      <Stack.Screen name="RestaurantFurniture" component={RestaurantFurnitureScreen} />
      <Stack.Screen name="KitchenEquipment" component={KitchenEquipmentScreen} />
      <Stack.Screen name="Promotion" component={PromotionScreen} />
      <Stack.Screen name="DishesTableware" component={DishesTablewareScreen} />
      <Stack.Screen name="RestaurantMaintenance" component={RestaurantMaintenanceScreen} />
      <Stack.Screen name="RestaurantSystems" component={RestaurantSystemsScreen} />
      <Stack.Screen name="PromotionBannerDetail" component={PromotionBannerDetailScreen} />
      <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: '#0B8628',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首頁' }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: '類別' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: '購物車' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: '訂單' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '帳戶' }} />
    </Tab.Navigator>
  );
};

const AuthStack: React.FC<{ initialRoute?: string }> = ({ initialRoute = 'WelcomeSplash' }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="WelcomeSplash" component={WelcomeSplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainApp" component={TabNavigator} />
    </Stack.Navigator>
  );
};

const LogoutSplash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const url = data.logoUrl || '';
          if (url && url.trim() !== '' &&
              (url.startsWith('https://firebasestorage.googleapis.com/') ||
               (url.startsWith('https://') && !url.includes('unsplash.com')))) {
            setLogoUrl(url);
          }
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      onDone();
    }, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  const logoSize = Math.min(Dimensions.get('window').width * 0.88, 400);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={logoUrl ? { uri: logoUrl } : require('./assets/splash-icon.png')}
        style={{ width: logoSize, height: logoSize, marginBottom: 24, resizeMode: 'contain' }}
        onError={() => setLogoUrl(null)}
      />
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={{ marginTop: 10, color: '#666' }}>正在返回登入頁...</Text>
    </View>
  );
};

const AppNavigator = () => {
  const { firebaseUser, loading, justLoggedOut, clearJustLoggedOut } = useAuth();
  const [hasSkippedLogin, setHasSkippedLogin] = useState<boolean | null>(null);
  const [shouldShowLogin, setShouldShowLogin] = useState(false);

  useEffect(() => {
    const checkSkipStatus = async () => {
      const skipped = await AsyncStorage.getItem('hasSkippedLogin');
      setHasSkippedLogin(skipped === 'true');
    };
    checkSkipStatus();

    // Set up a listener to check AsyncStorage periodically (for immediate skip effect)
    const interval = setInterval(() => {
      checkSkipStatus();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Clear skip status when user logs in
    if (firebaseUser) {
      AsyncStorage.removeItem('hasSkippedLogin');
      setHasSkippedLogin(false);
      setShouldShowLogin(false); // Reset login redirect flag when user logs in
    }
  }, [firebaseUser]);

  // Track when logout completes to show Login screen
  useEffect(() => {
    if (!justLoggedOut && !firebaseUser && !hasSkippedLogin) {
      // After logout splash completes, show Login screen
      setShouldShowLogin(true);
    }
  }, [justLoggedOut, firebaseUser, hasSkippedLogin]);

  // Debug logging - MUST be before any conditional returns
  useEffect(() => {
    if (__DEV__) {
      console.log('AppNavigator render:', {
        firebaseUser: !!firebaseUser,
        hasSkippedLogin,
        shouldShowLogin,
        loading
      });
    }
  }, [firebaseUser, hasSkippedLogin, shouldShowLogin, loading]);

  if (loading || hasSkippedLogin === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
      </View>
    );
  }

  if (justLoggedOut) {
    return <LogoutSplash onDone={clearJustLoggedOut} />;
  }

  // Use a key based on auth state to force NavigationContainer remount when switching between auth and app
  const navigationKey = firebaseUser ? 'authenticated' : 'unauthenticated';
  
  return (
    <NavigationContainer key={navigationKey}>
      {firebaseUser || hasSkippedLogin ? (
        <TabNavigator />
      ) : (
        <AuthStack initialRoute={shouldShowLogin ? 'Login' : 'WelcomeSplash'} />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
