import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const { signIn, firebaseUser, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const url = data.logoUrl || '';
          // Validate URL - only accept Firebase Storage URLs or valid HTTPS URLs
          if (url && url.trim() !== '' && 
              (url.startsWith('https://firebasestorage.googleapis.com/') || 
               (url.startsWith('https://') && !url.includes('unsplash.com')))) {
            setLogoUrl(url);
          }
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      } finally {
        setLogoLoading(false);
      }
    };
    loadLogo();
  }, []);

  // When user becomes authenticated, AppNavigator will automatically switch from AuthStack to TabNavigator
  // The NavigationContainer key change will force a remount, ensuring proper navigation
  useEffect(() => {
    if (firebaseUser && !authLoading) {
      console.log('LoginScreen: User authenticated, AppNavigator will handle navigation');
      console.log('LoginScreen: firebaseUser:', firebaseUser?.email);
    }
  }, [firebaseUser, authLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }

    // Trim email to remove whitespace
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('錯誤', '請輸入電子郵件');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to login with email:', trimmedEmail);
      // Call signIn with trimmed email – onAuthStateChanged will update auth state
      await signIn(trimmedEmail, password);
      console.log('SignIn function completed successfully');
      // AppNavigator will automatically switch to TabNavigator when firebaseUser updates
      setLoading(false);
    } catch (error: any) {
      // Reset loading state on error
      setLoading(false);
      
      console.error('Login error details:', {
        code: error?.code,
        message: error?.message,
        error: error
      });
      
      // Provide user-friendly error messages based on Firebase error codes
      let errorMessage = '請檢查您的電子郵件和密碼';
      
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        errorMessage = '電子郵件或密碼錯誤，請重新輸入';
      } else if (error?.code === 'auth/user-not-found') {
        errorMessage = '找不到此帳號，請確認電子郵件是否正確';
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = '電子郵件格式不正確';
      } else if (error?.code === 'auth/user-disabled') {
        errorMessage = '此帳號已被停用，請聯絡客服';
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = '嘗試次數過多，請稍後再試';
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = '網路連線失敗，請檢查網路設定';
      } else if (error?.message) {
        // Show the actual error message if available
        errorMessage = error.message;
      }
      
      Alert.alert('登入失敗', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => (navigation as any).navigate('WelcomeSplash')}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>返回</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {logoLoading ? (
            <ActivityIndicator size="large" color="#10B981" style={styles.logoLoader} />
          ) : logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
              onError={() => {
                // Fallback to default logo if remote logo fails to load
                setLogoUrl(null);
              }}
            />
          ) : (
            <Image
              source={require('../../assets/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <Text style={styles.title}>登入</Text>
          <Text style={styles.subtitle}>歡迎回到您的餐廳</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="電子郵件"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="密碼"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '登入中...' : '登入'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => (navigation as any).navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>註冊帳戶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  logo: {
    width: Math.min(Dimensions.get('window').width * 0.88, 400),
    height: Math.min(Dimensions.get('window').width * 0.88, 400),
    marginBottom: 16,
    marginTop: 0,
  },
  logoLoader: {
    marginBottom: 16,
    marginTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 16,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  backButtonText: {
    fontSize: 15,
    color: '#111827',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 16,
    color: '#10B981',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen; 