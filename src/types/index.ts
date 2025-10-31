export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  supplier: string;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate: Date;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  firebaseUid?: string;
  email: string;
  name: string;
  restaurantName?: string;
  phone?: string;
  address?: string;
  membershipPlan?: string;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderDate: Date;
  deliveryDate: Date;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  productCount: number;
} 