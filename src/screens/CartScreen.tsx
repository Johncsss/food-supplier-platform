import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';

const CartScreen: React.FC = () => {
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();

  const handleCheckout = () => {
    Alert.alert('結帳', '此功能將在未來版本中實現');
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
          >
            <Ionicons name="remove" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.productId)}
      >
        <Ionicons name="trash" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>購物車</Text>
      
      {state.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>購物車是空的</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={state.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.listContainer}
          />
          
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>總計:</Text>
              <Text style={styles.summaryValue}>${state.totalAmount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
                <Text style={styles.clearButtonText}>清空購物車</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                <Text style={styles.checkoutButtonText}>結帳</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  listContainer: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  removeButton: {
    padding: 8,
  },
  summary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen; 