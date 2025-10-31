import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';

const ProductsScreen: React.FC = () => {
  const { addToCart } = useCart();

  const products: Product[] = [
    {
      id: '1',
      name: '優質絞牛肉',
      description: '新鮮優質絞牛肉，適合各種料理',
      price: 8.99,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      category: '肉類',
      supplier: 'Quality Meats Inc.',
      inStock: true,
    },
    {
      id: '2',
      name: '新鮮有機番茄',
      description: '有機種植的新鮮番茄',
      price: 2.99,
      imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
      category: '蔬菜',
      supplier: 'Fresh Farms',
      inStock: true,
    },
    {
      id: '3',
      name: '新鮮全脂牛奶',
      description: '高品質全脂牛奶',
      price: 3.49,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      category: '飲品材料類',
      supplier: 'Dairy Co.',
      inStock: true,
    },
  ];

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addToCart(item)}
        >
          <Text style={styles.addButtonText}>加入購物車</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>產品目錄</Text>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
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
  listContainer: {
    padding: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductsScreen; 