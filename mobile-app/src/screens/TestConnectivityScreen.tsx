import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';

const TestConnectivityScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const testGetRequest = async () => {
    setLoading(true);
    try {
      const endpoints = [
        'http://192.168.31.161:3000',
        'http://localhost:3000',
        'http://10.0.0.1:3000',
        'http://172.20.10.1:3000',
      ];
      
      let workingEndpoint = null;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}/api/test`);
          if (response.ok) {
            workingEndpoint = endpoint;
            break;
          }
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error);
        }
      }
      
      if (!workingEndpoint) {
        Alert.alert('GET Test Failed', 'No working endpoint found');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${workingEndpoint}/api/test`);
      const data = await response.json();
      Alert.alert('GET Test Success', `Endpoint: ${workingEndpoint}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      Alert.alert('GET Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testPostRequest = async () => {
    setLoading(true);
    try {
      const endpoints = [
        'http://192.168.31.161:3000',
        'http://localhost:3000',
        'http://10.0.0.1:3000',
        'http://172.20.10.1:3000',
      ];
      
      let workingEndpoint = null;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}/api/test`);
          if (response.ok) {
            workingEndpoint = endpoint;
            break;
          }
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error);
        }
      }
      
      if (!workingEndpoint) {
        Alert.alert('POST Test Failed', 'No working endpoint found');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${workingEndpoint}/api/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'mobile app data' }),
      });
      const data = await response.json();
      Alert.alert('POST Test Success', `Endpoint: ${workingEndpoint}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      Alert.alert('POST Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testOrderCreation = async () => {
    setLoading(true);
    try {
      const endpoints = [
        'http://192.168.31.161:3000',
        'http://localhost:3000',
        'http://10.0.0.1:3000',
        'http://172.20.10.1:3000',
      ];
      
      let workingEndpoint = null;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}/api/test`);
          if (response.ok) {
            workingEndpoint = endpoint;
            break;
          }
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error);
        }
      }
      
      if (!workingEndpoint) {
        Alert.alert('Order Creation Test Failed', 'No working endpoint found');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${workingEndpoint}/api/create-order`, {
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
      Alert.alert('Order Creation Test Success', `Endpoint: ${workingEndpoint}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      Alert.alert('Order Creation Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mobile App Connectivity Test</Text>
      <Text style={styles.subtitle}>Testing connection to web server</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={testGetRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test GET Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testPostRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test POST Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testOrderCreation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Order Creation</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Testing connectivity...</Text>
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
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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

export default TestConnectivityScreen; 