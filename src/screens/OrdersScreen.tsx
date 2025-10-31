import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrdersScreen: React.FC = () => {
  const mockOrders = [
    {
      id: 'ORDER-1234-5678',
      status: 'pending',
      totalAmount: 107.35,
      createdAt: new Date(),
      items: [
        { productName: '優質絞牛肉', quantity: 10 },
        { productName: '新鮮全脂牛奶', quantity: 5 },
      ],
    },
    {
      id: 'ORDER-8765-4321',
      status: 'delivered',
      totalAmount: 59.80,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      items: [
        { productName: '新鮮有機番茄', quantity: 20 },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'shipped': return '#6366f1';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'confirmed': return '已確認';
      case 'processing': return '處理中';
      case 'shipped': return '已發貨';
      case 'delivered': return '已送達';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderItems}>
        {item.items.map((orderItem: any, index: number) => (
          <Text key={index} style={styles.orderItem}>
            {orderItem.productName} x {orderItem.quantity}
          </Text>
        ))}
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          {item.createdAt.toLocaleDateString('zh-TW')}
        </Text>
        <Text style={styles.orderTotal}>${item.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>我的訂單</Text>
      
      {mockOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>還沒有訂單</Text>
        </View>
      ) : (
        <FlatList
          data={mockOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
});

export default OrdersScreen; 