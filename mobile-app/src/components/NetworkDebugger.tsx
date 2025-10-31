import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testApiEndpoints } from '../utils/apiHelper';
import { API_CONFIG } from '../config/api';

const NetworkDebugger: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const runNetworkTest = async () => {
    setIsTesting(true);
    try {
      console.log('Starting network test...');
      const result = await testApiEndpoints();
      
      if (result.success) {
        const message = `✅ 網路測試成功！\n工作端點: ${result.workingEndpoint}`;
        setLastResult(message);
        Alert.alert('網路測試', message);
      } else {
        const message = `❌ 網路測試失敗\n錯誤:\n${result.errors.join('\n')}`;
        setLastResult(message);
        Alert.alert('網路測試', message);
      }
    } catch (error) {
      const message = `❌ 網路測試錯誤: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setLastResult(message);
      Alert.alert('網路測試錯誤', message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>網路除錯工具</Text>
      <Text style={styles.currentEndpoint}>
        當前端點: {API_CONFIG.BASE_URL}
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isTesting && styles.buttonDisabled]}
        onPress={runNetworkTest}
        disabled={isTesting}
      >
        <Text style={styles.buttonText}>
          {isTesting ? '測試中...' : '測試網路連接'}
        </Text>
      </TouchableOpacity>
      
      {lastResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  currentEndpoint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default NetworkDebugger;
