import { useState, useEffect, createContext, useContext, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { CartItem, Product } from '../../../shared/types';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + 1,
          totalAmount: state.totalAmount + action.payload.price
        };
      } else {
        const newItem: CartItem = {
          productId: action.payload.id,
          productName: action.payload.name,
          category: action.payload.category,
          supplier: action.payload.supplier,
          quantity: 1,
          unitPrice: action.payload.price,
          totalPrice: action.payload.price,
          imageUrl: action.payload.imageUrl
        };
        
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + 1,
          totalAmount: state.totalAmount + action.payload.price
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.productId === action.payload);
      if (!itemToRemove) return state;
      
      const updatedItems = state.items.filter(item => item.productId !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems - itemToRemove.quantity,
        totalAmount: state.totalAmount - itemToRemove.totalPrice
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item => {
        if (item.productId === action.payload.productId) {
          const newQuantity = Math.max(0, action.payload.quantity);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice
          };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalAmount
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalAmount: 0
      };
      
    case 'LOAD_CART':
      const totalItems = action.payload.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = action.payload.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        ...state,
        items: action.payload,
        totalItems,
        totalAmount
      };
      
    default:
      return state;
  }
};

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  state: CartState;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalAmount: 0
  });

  const addToCart = (product: Product) => {
    // Check if there are items in the cart with a different supplier
    if (state.items.length > 0) {
      const existingSupplier = state.items[0].supplier;
      if (product.supplier !== existingSupplier) {
        Alert.alert(
          'Cannot Add to Cart',
          `It's only allowed to add the same supplier products into the shopping cart. Please clear the items in the shopping cart before adding different supplier products into the shopping cart.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('cart');
        if (savedCart) {
          const cartItems: CartItem[] = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: cartItems });
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(state.items));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [state.items]);

  const value: CartContextType = {
    items: state.items,
    totalItems: state.totalItems,
    totalAmount: state.totalAmount,
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 