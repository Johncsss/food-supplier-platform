import { useState, useEffect, createContext, useContext } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { User } from '../../../shared/types';

interface AuthContextType {
  firebaseUser: any;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, restaurantName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        // Don't set firebaseUser here - it should be set in the auth state listener
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null);
          setFirebaseUser(null);
          setLoading(false);
          return;
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
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 