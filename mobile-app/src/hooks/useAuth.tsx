import { useState, useEffect, createContext, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../../../shared/types';

interface AuthContextType {
  firebaseUser: any;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, restaurantName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      let userData: User | null = null;
      if (userDoc.exists()) {
        userData = userDoc.data() as User;
        setUser(userData);
        // Don't set firebaseUser here - it should be set in the auth state listener
      }
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const uid = firebaseUser?.uid;
      if (!uid) return;
      await fetchUserData(uid);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string, restaurantName: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      const userData: User = {
        id: uid,
        firebaseUid: uid,
        email,
        name,
        restaurantName,
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        profileImageUrl: '',
        profileBackgroundUrl: '',
        membershipStatus: 'inactive',
        membershipExpiry: null,
        memberPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', uid), userData);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sign in successful - Firebase's onAuthStateChanged will automatically trigger
      // and update firebaseUser state, which will cause AppNavigator to switch to TabNavigator
      if (__DEV__) {
        console.log('Login successful for user:', userCredential.user.email);
      }
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setJustLoggedOut(true);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user?.email) throw new Error('Not signed in');
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      const uid = user.uid;
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        console.warn('Firestore user doc delete failed (may be ok):', e);
      }
      await deleteUser(user);
      setJustLoggedOut(true);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          if (__DEV__) {
            console.log('Auth state: User signed out');
          }
          setUser(null);
          setFirebaseUser(null);
          setLoading(false);
          return;
        }
        if (__DEV__) {
          console.log('Auth state: User signed in -', fbUser.email);
        }
        setFirebaseUser(fbUser);
        const uid = fbUser.uid;

        const minimal: User = {
          id: uid,
          firebaseUid: uid,
          email: fbUser.email || '',
          name: '',
          restaurantName: '',
          phone: '',
          address: { street: '', city: '', state: '', zipCode: '' },
          profileImageUrl: '',
          profileBackgroundUrl: '',
          membershipStatus: 'inactive',
          membershipExpiry: null,
          memberPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          const userRef = doc(db, 'users', uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // Try to create a minimal user document if allowed by rules
            try {
              await setDoc(userRef, minimal);
              setUser(minimal);
            } catch (writeErr) {
              console.warn('Write denied when creating user document. Using minimal local profile.');
              setUser(minimal);
            }
          }
        } catch (readErr: any) {
          // Permission denied or other Firestore errors: fall back to minimal local profile
          if (readErr && (readErr.code === 'permission-denied' || readErr.message?.includes('Missing or insufficient permissions'))) {
            console.warn('Read denied for user document. Using minimal local profile.');
            setUser(minimal);
          } else {
            console.error('Unexpected error reading user document:', readErr);
            setUser(minimal);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Auth state handling error:', err);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    deleteAccount,
    refreshUser,
    justLoggedOut,
    clearJustLoggedOut: () => setJustLoggedOut(false),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 