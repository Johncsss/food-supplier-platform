import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getBestApiEndpoint } from '../utils/apiHelper';

interface PointsPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPointsPurchased?: (newBalance: number) => void;
}

const POINTS_PACKAGES = [
  { points: 100, price: 100, label: '100 點' },
  { points: 500, price: 500, label: '500 點' },
  { points: 1000, price: 1000, label: '1000 點' },
  { points: 2000, price: 2000, label: '2000 點' },
  { points: 5000, price: 5000, label: '5000 點' },
];

const PointsPurchaseModal: React.FC<PointsPurchaseModalProps> = ({
  visible,
  onClose,
  onPointsPurchased
}) => {
  const { user, firebaseUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const handlePurchase = async () => {
    if (!firebaseUser || !user) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    const pointsToPurchase = useCustomAmount 
      ? parseInt(customAmount) 
      : selectedPackage;

    if (!pointsToPurchase || pointsToPurchase <= 0) {
      Alert.alert('錯誤', '請選擇要購買的點數');
      return;
    }

    if (useCustomAmount && (pointsToPurchase < 10 || pointsToPurchase > 50000)) {
      Alert.alert('錯誤', '自定義金額必須在 10-50000 點之間');
      return;
    }

    setIsProcessing(true);

    try {
      const baseEndpoint = await getBestApiEndpoint();
      console.log('Purchasing points from:', `${baseEndpoint}/api/purchase-points`);
      console.log('Purchase data:', {
        userId: firebaseUser.uid,
        pointsToPurchase,
        paymentAmount: pointsToPurchase
      });
      
      const response = await fetch(`${baseEndpoint}/api/purchase-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          pointsToPurchase,
          paymentAmount: pointsToPurchase // 1 HKD = 1 point
        }),
      });
      
      console.log('Purchase response status:', response.status);

      let data: any = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (response.ok) {
        console.log('Points purchase successful:', data);
        Alert.alert('成功', `成功購買 ${pointsToPurchase} 點！`);
        onPointsPurchased?.(data.newBalance);
        onClose();
        // Reset form
        setSelectedPackage(null);
        setCustomAmount('');
        setUseCustomAmount(false);
      } else {
        console.error('Points purchase failed:', data);
        const errorMsg = data.error || data.message || `購買失敗 (HTTP ${response.status})`;
        Alert.alert('錯誤', errorMsg);
      }
    } catch (error) {
      console.error('Error purchasing points:', error);
      let errorMessage = '購買失敗，請稍後再試';
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = '網路連接失敗，請檢查網路設置';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = '無法連接到伺服器，請檢查網路連接';
        } else if (error.message.includes('timeout')) {
          errorMessage = '請求超時，請稍後再試';
        } else {
          errorMessage = `購買失敗: ${error.message}`;
        }
      }
      
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="coins" size={24} color="#f59e0b" />
            <Text style={styles.headerTitle}>購買會員點數</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>目前點數餘額</Text>
            <Text style={styles.balanceAmount}>
              {user?.memberPoints || 0} 點
            </Text>
          </View>

          {/* Points Packages */}
          {!useCustomAmount && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>選擇點數套餐</Text>
              <View style={styles.packagesGrid}>
                {POINTS_PACKAGES.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.points}
                    style={[
                      styles.packageCard,
                      selectedPackage === pkg.points && styles.selectedPackage
                    ]}
                    onPress={() => setSelectedPackage(pkg.points)}
                  >
                    <Text style={styles.packageLabel}>{pkg.label}</Text>
                    <Text style={styles.packagePrice}>HKD ${pkg.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Custom Amount */}
          {useCustomAmount && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>自定義金額</Text>
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholder="輸入點數 (10-50000)"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <Text style={styles.pointsLabel}>點</Text>
              </View>
              <Text style={styles.customAmountText}>
                自定義金額：HKD ${customAmount || '0'}
              </Text>
            </View>
          )}

          {/* Toggle between packages and custom */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setUseCustomAmount(!useCustomAmount)}
          >
            <Text style={styles.toggleButtonText}>
              {useCustomAmount ? '選擇預設套餐' : '自定義金額'}
            </Text>
          </TouchableOpacity>

          {/* Purchase Summary */}
          {(selectedPackage || (useCustomAmount && customAmount)) && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>購買摘要</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>點數：</Text>
                <Text style={styles.summaryValue}>
                  {useCustomAmount ? customAmount : selectedPackage} 點
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>金額：</Text>
                <Text style={styles.summaryValue}>
                  HKD ${useCustomAmount ? customAmount : selectedPackage}
                </Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>總計：</Text>
                <Text style={styles.summaryTotalValue}>
                  HKD ${useCustomAmount ? customAmount : selectedPackage}
                </Text>
              </View>
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsCard}>
            <Text style={styles.termsText}>• 1 港元 = 1 點</Text>
            <Text style={styles.termsText}>• 點數購買後立即到帳</Text>
            <Text style={styles.termsText}>• 點數可用於購買所有商品</Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (!selectedPackage && !customAmount) && styles.disabledButton
            ]}
            onPress={handlePurchase}
            disabled={isProcessing || (!selectedPackage && !customAmount)}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.purchaseButtonText}>立即購買</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageCard: {
    width: '47%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedPackage: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  packageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  customInputContainer: {
    position: 'relative',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  pointsLabel: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  customAmountText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  toggleButton: {
    marginBottom: 24,
  },
  toggleButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  termsCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  purchaseButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PointsPurchaseModal;
