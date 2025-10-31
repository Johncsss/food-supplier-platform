import { useState, useEffect, createContext, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, restaurantName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserData: (uid: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      // First try to fetch by firebaseUid (for new users)
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }

      // If not found, query by firebaseUid field (for old users)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('firebaseUid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as User;
        return userData;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const signUp = async (email: string, password: string, name: string, restaurantName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Generate custom user ID
      const customUserId = `USER-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const newUser: User = {
        id: customUserId,
        firebaseUid: userCredential.user.uid,
        email,
        name,
        restaurantName: restaurantName || name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore with custom ID
      await setDoc(doc(db, 'users', customUserId), newUser);
      setUser(newUser);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user.uid);
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signUp,
    signIn,
    signOut,
    fetchUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 