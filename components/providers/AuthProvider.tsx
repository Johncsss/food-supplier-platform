'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isSalesTeam: boolean;
  isSupplier: boolean;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isAdmin: false,
  isSalesTeam: false,
  isSupplier: false,
  userRole: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSalesTeam, setIsSalesTeam] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const buildMinimalUser = (firebaseUid: string, email?: string): User => ({
    id: firebaseUid,
    firebaseUid,
    email: email || '',
    name: '',
    restaurantName: '',
    companyName: undefined,
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    membershipStatus: 'inactive',
    membershipExpiry: null,
    memberPoints: 0,
    checkoutPassword: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUid: string): Promise<User | null> => {
    console.log('=== Fetching User Data ===');
    console.log('firebaseUid:', firebaseUid);
    
    try {
      // First try to find user by Firebase UID (for backward compatibility)
      console.log('Trying direct lookup with Firebase UID...');
      const userDoc = await getDoc(doc(db, 'users', firebaseUid));
      console.log('Direct lookup result:', userDoc.exists() ? 'found' : 'not found');
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('Found user data:', userData);
        return userData;
      }
      
      // If not found, search for user with matching firebaseUid field
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('firebaseUid', '==', firebaseUid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as User;
        return userData;
      }

      // Fallback: try to locate by email if available (handles legacy records)
      const currentEmail = auth.currentUser?.email;
      if (currentEmail) {
        const emailQuery = query(usersRef, where('email', '==', currentEmail));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          const userData = emailSnapshot.docs[0].data() as User;
          return userData;
        }
      }
      
      return null;
    } catch (error) {
      // Permission issues are common in early setup; fall back to minimal user upstream
      console.warn('Error fetching user data, will fall back to minimal profile:', error);
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user.uid);
      setUser(userData || buildMinimalUser(userCredential.user.uid, userCredential.user.email || email));
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Generate custom user ID
      const customUserId = `USER-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Create user document in Firestore
      const newUser: User = {
        id: customUserId,
        firebaseUid: userCredential.user.uid, // Store Firebase UID for authentication
        email: userCredential.user.email || email,
        name: userData.name || '',
        restaurantName: userData.restaurantName || '',
        phone: userData.phone || '',
        address: userData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
        },
        membershipStatus: 'inactive',
        membershipExpiry: new Date(),
        memberPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store user with custom ID
      await setDoc(doc(db, 'users', customUserId), newUser);
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsSalesTeam(false);
      setIsSupplier(false);
      setUserRole(null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('=== Auth State Changed ===');
      console.log('firebaseUser:', firebaseUser);
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in
        console.log('User is signed in, fetching user data...');
        const userData = await fetchUserData(firebaseUser.uid);
        console.log('Fetched user data:', userData);
        setUser(userData || buildMinimalUser(firebaseUser.uid, firebaseUser.email || undefined));
        
        // Check for custom claims
        const idTokenResult = await firebaseUser.getIdTokenResult();
        
        // Check for admin role
        const hasAdminClaim = !!idTokenResult.claims.admin;
        const isTemporaryAdmin = firebaseUser.uid === 'kMOVDljmF8a1N8WVwQYYjfBMmNd2';
        setIsAdmin(hasAdminClaim || isTemporaryAdmin);
        
        // Check for role - first from custom claims, then from Firestore userData
        const roleFromClaims = idTokenResult.claims.role as string | undefined;
        const roleFromFirestore = userData?.role as string | undefined;
        const role = roleFromClaims || roleFromFirestore;
        console.log('AuthProvider - User role detected:', role, 'for user:', firebaseUser.email, '(from claims:', roleFromClaims, ', from Firestore:', roleFromFirestore, ')');
        setUserRole(role || null);
        setIsSalesTeam(role === 'salesTeam');
        setIsSupplier(role === 'supplier');
      } else {
        // User is signed out
        setUser(null);
        setIsAdmin(false);
        setIsSalesTeam(false);
        setIsSupplier(false);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      isAdmin,
      isSalesTeam,
      isSupplier,
      userRole,
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 