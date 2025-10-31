import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG, buildApiUrl } from '../config/api';

interface PointsPackage {
  amount: number;
  points: number;
  popular: boolean;
}

const pointsPackages: PointsPackage[] = [
  { amount: 100, points: 100, popular: false },
  { amount: 500, points: 500, popular: true },
  { amount: 1000, points: 1000, popular: false },
  { amount: 2000, points: 2000, popular: false },
  { amount: 5000, points: 5000, popular: false },
];

interface PointsTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: any;
}

const PointsPurchaseScreen: React.FC = () => {
  const { user, firebaseUser, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (firebaseUser && showHistory) {
      fetchTransactionHistory();
    }
  }, [firebaseUser, showHistory]);

  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/points-transactions?userId=${firebaseUser?.uid}&limit=20`));
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  };

  const handlePurchasePoints = async (amount: number, points: number) => {
    if (!firebaseUser) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    Alert.alert(
      '確認購買',
      `確定要購買 ${points} 點 (HKD $${amount}) 嗎？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '確認', onPress: () => processPurchase(amount, points) }
      ]
    );
  };

  const processPurchase = async (amount: number, points: number) => {
    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch(buildApiUrl('/api/purchase-points'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          amount: amount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // In a real app, you would integrate with Stripe's mobile SDK
      // For now, we'll show a message that this would redirect to Stripe
      Alert.alert(
        '跳轉到付款',
        '即將跳轉到 Stripe 付款頁面完成點數購買。\n\n注意：此功能需要完整的 Stripe 移動端 SDK 集成。',
        [{ text: '確定' }]
      );

      // TODO: Implement Stripe mobile SDK integration
      // const { error } = await presentPaymentSheet({
      //   clientSecret: data.clientSecret,
      // });
      
      // if (error) {
      //   throw new Error(error.message);
      // }

    } catch (error) {
      console.error('Error purchasing points:', error);
      Alert.alert(
        '購買失敗',
        error instanceof Error ? error.message : '購買點數時發生錯誤'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPointsPackage = ({ item }: { item: PointsPackage }) => (
    <TouchableOpacity
      style={[styles.packageCard, item.popular && styles.popularCard]}
      onPress={() => handlePurchasePoints(item.amount, item.points)}
      disabled={isProcessing}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>推薦</Text>
        </View>
      )}
      
      <View style={styles.packageContent}>
        <Text style={styles.pointsText}>{item.points}</Text>
        <Text style={styles.pointsLabel}>點</Text>
        <Text style={styles.amountText}>HKD ${item.amount}</Text>
        
        <TouchableOpacity
          style={[styles.buyButton, item.popular && styles.popularButton]}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buyButtonText}>購買</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: PointsTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString('zh-TW')}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.transactionAmountText,
          { color: item.amount > 0 ? '#10B981' : '#EF4444' }
        ]}>
          {item.amount > 0 ? '+' : ''}{item.amount} 點
        </Text>
        <Text style={styles.transactionBalance}>
          餘額: {item.balanceAfter}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>會員點數管理</Text>
          <Text style={styles.subtitle}>購買點數用於訂購商品。1 HKD = 1 點</Text>
        </View>

        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>當前點數餘額</Text>
          </View>
          <View style={styles.balanceContent}>
            <View style={styles.balanceMain}>
              <Text style={styles.balancePoints}>{user?.memberPoints || 0}</Text>
              <Text style={styles.balanceLabel}>點</Text>
            </View>
            <View style={styles.balanceValue}>
              <Text style={styles.balanceHkd}>等值</Text>
              <Text style={styles.balanceAmount}>HKD ${user?.memberPoints || 0}</Text>
            </View>
          </View>
        </View>

        {/* Points Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>購買點數</Text>
          <FlatList
            data={pointsPackages}
            renderItem={renderPointsPackage}
            keyExtractor={(item) => `${item.amount}-${item.points}`}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.packageRow}
          />
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>交易記錄</Text>
            <TouchableOpacity
              onPress={() => setShowHistory(!showHistory)}
              style={styles.historyToggle}
            >
              <Text style={styles.historyToggleText}>
                {showHistory ? '隱藏' : '查看'}
              </Text>
            </TouchableOpacity>
          </View>

          {showHistory ? (
            transactions.length > 0 ? (
              <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noTransactions}>暫無交易記錄</Text>
            )
          ) : (
            <Text style={styles.historyHint}>
              點擊「查看」按鈕來查看您的點數交易記錄
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceCard: {
    margin: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 20,
  },
  balanceHeader: {
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#DBEAFE',
    fontWeight: '500',
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balancePoints: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceLabel: {
    fontSize: 18,
    color: '#DBEAFE',
    marginLeft: 4,
  },
  balanceValue: {
    alignItems: 'flex-end',
  },
  balanceHkd: {
    fontSize: 12,
    color: '#DBEAFE',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  packageRow: {
    justifyContent: 'space-between',
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 0.48,
    position: 'relative',
  },
  popularCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  buyButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: '#3B82F6',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
  },
  historyToggleText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionBalance: {
    fontSize: 12,
    color: '#6B7280',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
  },
  historyHint: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
});

export default PointsPurchaseScreen;

