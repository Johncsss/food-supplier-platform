import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckoutPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onPasswordVerified: () => void;
  onPasswordIncorrect: () => void;
  userCheckoutPassword?: string;
}

const CheckoutPasswordModal: React.FC<CheckoutPasswordModalProps> = ({
  visible,
  onClose,
  onPasswordVerified,
  onPasswordIncorrect,
  userCheckoutPassword
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('錯誤', '請輸入結帳密碼');
      return;
    }

    setIsVerifying(true);

    // Simulate verification delay for better UX
    setTimeout(() => {
      if (password === userCheckoutPassword) {
        onPasswordVerified();
        setPassword('');
        setShowPassword(false);
      } else {
        onPasswordIncorrect();
      }
      setIsVerifying(false);
    }, 500);
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={24} color="#3B82F6" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>結帳驗證</Text>
                <Text style={styles.subtitle}>請輸入結帳密碼以繼續</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>結帳密碼</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="請輸入結帳密碼"
                secureTextEntry={!showPassword}
                autoFocus
                editable={!isVerifying}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isVerifying}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isVerifying}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!password.trim() || isVerifying) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={!password.trim() || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>確認</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Warning for users without checkout password */}
          {!userCheckoutPassword && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                您尚未設定結帳密碼，請先到個人資料頁面設定結帳密碼。
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width - 40,
    maxWidth: 400,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#EBF8FF',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  warningContainer: {
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
});

export default CheckoutPasswordModal;
