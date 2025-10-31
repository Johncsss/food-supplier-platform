import React from 'react';
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
import CategoryProductsScreen from './src/screens/CategoryProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import TestConnectivityScreen from './src/screens/TestConnectivityScreen';
import NetworkDiagnosticScreen from './src/screens/NetworkDiagnosticScreen';
import RestaurantConstructionScreen from './src/screens/RestaurantConstructionScreen';
import RestaurantFurnitureScreen from './src/screens/RestaurantFurnitureScreen';
import KitchenEquipmentScreen from './src/screens/KitchenEquipmentScreen';
import PromotionScreen from './src/screens/PromotionScreen';
import DishesTablewareScreen from './src/screens/DishesTablewareScreen';
import RestaurantMaintenanceScreen from './src/screens/RestaurantMaintenanceScreen';
import RestaurantSystemsScreen from './src/screens/RestaurantSystemsScreen';
import { View, ActivityIndicator, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="RestaurantConstruction" component={RestaurantConstructionScreen} />
      <Stack.Screen name="RestaurantFurniture" component={RestaurantFurnitureScreen} />
      <Stack.Screen name="KitchenEquipment" component={KitchenEquipmentScreen} />
      <Stack.Screen name="Promotion" component={PromotionScreen} />
      <Stack.Screen name="DishesTableware" component={DishesTablewareScreen} />
      <Stack.Screen name="RestaurantMaintenance" component={RestaurantMaintenanceScreen} />
      <Stack.Screen name="RestaurantSystems" component={RestaurantSystemsScreen} />
      <Stack.Screen name="TestConnectivity" component={TestConnectivityScreen} />
      <Stack.Screen name="NetworkDiagnostic" component={NetworkDiagnosticScreen} />
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
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: 'gray',
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

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {firebaseUser ? <TabNavigator /> : <AuthStack />}
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
