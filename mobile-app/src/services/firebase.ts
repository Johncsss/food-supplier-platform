import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../../../shared/firebase-config';

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// IMPORTANT: Use "(default)" database for this project, NOT "diamond" database
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // Explicitly specify the database ID to ensure we use the correct database
  databaseId: '(default)'
});

export { db };
export default app; 