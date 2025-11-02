export interface User {
  id: string;
  firebaseUid?: string; // For backward compatibility and authentication
  email: string;
  name: string;
  restaurantName: string;
  companyName?: string; // Company name (for suppliers)
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  membershipStatus: 'active' | 'inactive' | 'expired';
  membershipExpiry: Date | null;
  stripeCustomerId?: string;
  memberPoints: number; // Member points balance (HKD$1 = 1 point)
  checkoutPassword?: string; // Password required for checkout
  role?: string; // User role: 'admin', 'supplier', 'salesTeam', 'salesMember', etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  productCode?: string; // Product code/SKU
  description: string;
  category: string;
  subcategory: string;
  price: number;
  unit: string;
  minOrderQuantity: number;
  stockQuantity: number;
  imageUrl: string;
  imageUrls?: string[]; // Multiple images array
  isAvailable: boolean;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  interval: 'year';
  features: string[];
  stripePriceId: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  subcategories: string[];
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
  unit?: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'spend' | 'refund';
  amount: number; // Positive for purchase/refund, negative for spend
  balanceAfter: number; // Points balance after this transaction
  description: string;
  orderId?: string; // Reference to order if this is a spend transaction
  stripePaymentIntentId?: string; // Reference to Stripe payment if this is a purchase
  createdAt: Date;
}

export interface PointsPurchaseRequest {
  amount: number; // Amount in HKD (1 HKD = 1 point)
  userId: string;
}

// Note: Helper functions are exported from products.ts to avoid circular dependency 