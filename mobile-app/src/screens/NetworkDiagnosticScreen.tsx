import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';

const NetworkDiagnosticScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnectivity = async () => {
    setLoading(true);
    setResults([]);
    
    const endpoints = [
      { name: 'Localhost Test', url: 'http://localhost:3000/api/test' },
      { name: 'Network IP Test', url: 'http://192.168.31.161:3000/api/test' },
      { name: 'Alternative IP Test', url: 'http://10.0.0.1:3000/api/test' },
      { name: 'Alternative IP Test 2', url: 'http://172.20.10.1:3000/api/test' },
    ];

    for (const endpoint of endpoints) {
      try {
        addResult(`Testing ${endpoint.name}: ${endpoint.url}`);
        const response = await fetch(endpoint.url, { timeout: 5000 });
        const data = await response.json();
        addResult(`✅ ${endpoint.name} SUCCESS: ${JSON.stringify(data)}`);
      } catch (error) {
        addResult(`❌ ${endpoint.name} FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setLoading(false);
  };

  const testOrderCreation = async () => {
    setLoading(true);
    addResult('Testing order creation...');
    
    try {
      const response = await fetch('http://192.168.31.161:3000/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            productId: '1',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10,
            totalPrice: 10
          }],
          totalAmount: 10,
          user: { id: 'test-user', name: 'Test User' }
        }),
      });
      
      const data = await response.json();
      addResult(`✅ Order creation SUCCESS: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`❌ Order creation FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Network Diagnostic</Text>
      <Text style={styles.subtitle}>Testing connectivity to web server</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={testConnectivity}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Connectivity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testOrderCreation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Order Creation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});

export default NetworkDiagnosticScreen; 