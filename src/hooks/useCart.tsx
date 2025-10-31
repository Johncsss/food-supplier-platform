import { useState, useEffect, createContext, useContext, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';
import { Alert } from 'react-native';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
        };
      } else {
        const newItems = [...state.items, action.payload];
        return {
          ...state,
          items: newItems,
          totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.productId !== action.payload);
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.productId === action.payload.productId
          ? { ...item, quantity: action.payload.quantity, totalPrice: item.unitPrice * action.payload.quantity }
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
    
    case 'LOAD_CART': {
      return {
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: action.payload.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    }
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
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

  const addToCart = (product: Product, quantity: number = 1) => {
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
    
    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      supplier: product.supplier,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      imageUrl: product.imageUrl
    };
    
    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
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