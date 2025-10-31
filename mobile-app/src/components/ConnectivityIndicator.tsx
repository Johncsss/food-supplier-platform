import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { testApiConnectivity } from '../config/api';

interface ConnectivityIndicatorProps {
  onRetry?: () => void;
}

const ConnectivityIndicator: React.FC<ConnectivityIndicatorProps> = ({ onRetry }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = async () => {
    setIsChecking(true);
    try {
      const connected = await testApiConnectivity();
      setIsConnected(connected);
    } catch (error) {
      console.error('Connectivity check failed:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  if (isConnected === null || isChecking) {
    return (
      <View style={styles.container}>
        <Text style={styles.checkingText}>檢查連接中...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>無法連接到伺服器</Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkConnectivity}>
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.successContainer]}>
      <Text style={styles.successText}>✓ 連接正常</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  checkingText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  successText: {
    color: '#059669',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ConnectivityIndicator;
