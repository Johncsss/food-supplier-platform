'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem } from '@/types';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'totalPrice'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType {
  state: CartState;
  addToCart: (item: Omit<CartItem, 'totalPrice'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      
      if (existingItem) {
        // Update existing item quantity
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId
            ? {
                ...item,
                quantity: item.quantity + action.payload.quantity,
                totalPrice: (item.quantity + action.payload.quantity) * item.unitPrice
              }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
        };
      } else {
        // Add new item
        const newItem = {
          ...action.payload,
          totalPrice: action.payload.quantity * action.payload.unitPrice
        };
        
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + action.payload.quantity,
          totalAmount: state.totalAmount + newItem.totalPrice
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.productId === action.payload);
      const updatedItems = state.items.filter(item => item.productId !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems - (itemToRemove?.quantity || 0),
        totalAmount: state.totalAmount - (itemToRemove?.totalPrice || 0)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.productId === action.payload.productId
          ? {
              ...item,
              quantity: action.payload.quantity,
              totalPrice: action.payload.quantity * item.unitPrice
            }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        totalItems: 0,
        totalAmount: 0
      };
    
    case 'LOAD_CART':
      return {
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: action.payload.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalAmount: 0
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // If logged in, attempt to load cart from Firestore (server-authoritative)
  useEffect(() => {
    const loadFromFirestore = async () => {
      if (!firebaseUser?.uid) return;
      try {
        const ref = doc(db, 'carts', firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          const items: CartItem[] = Array.isArray(data?.items) ? data.items : [];
          if (items.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: items });
            localStorage.setItem('cart', JSON.stringify(items));
            return;
          }
        }
        // Firestore cart empty – if local has items, sync them up
        const saved = localStorage.getItem('cart');
        if (saved) {
          try {
            const localItems: CartItem[] = JSON.parse(saved);
            await setDoc(
              doc(db, 'carts', firebaseUser.uid),
              { items: localItems, updatedAt: new Date() },
              { merge: true },
            );
          } catch (e) {
            console.warn('Failed to sync local cart to Firestore:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load cart from Firestore:', e);
      }
    };
    loadFromFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  // Also persist to Firestore when logged in
  useEffect(() => {
    const persist = async () => {
      if (!firebaseUser?.uid) return;
      try {
        await setDoc(
          doc(db, 'carts', firebaseUser.uid),
          { items: state.items, updatedAt: new Date() },
          { merge: true },
        );
      } catch (e) {
        // Soft-fail; keep localStorage as fallback
        console.warn('Failed to persist cart to Firestore:', e);
      }
    };
    persist();
  }, [firebaseUser?.uid, state.items]);

  const addToCart = (item: Omit<CartItem, 'totalPrice'>) => {
    // Check if there are items in the cart
    if (state.items.length > 0) {
      const existingItem = state.items[0];
      const existingSupplier = existingItem.supplier;
      const existingCategory = existingItem.category;
      
      // Check if supplier matches
      if (item.supplier !== existingSupplier) {
        toast.error('只能將相同供應商的商品加入購物車。請先清空購物車再添加不同供應商的商品。', {
          duration: 5000,
        });
        return;
      }
      
      // Check if category matches
      if (item.category !== existingCategory) {
        toast.error('只能將相同類別的商品加入購物車。請先清空購物車再添加不同類別的商品。', {
          duration: 5000,
        });
        return;
      }
    }
    
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast.success(t('Item added to cart'));
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
    toast.success('商品已從購物車移除');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  };

  const getItemQuantity = (productId: string): number => {
    const item = state.items.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 