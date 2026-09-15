export interface Product {
  id: string; // UUID
  title: string;
  description: string | null;
  price: number;
  stock: number;
  shippedCount: number;
  imageUrl: string | null;
  category: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rating: number;
  ratingCount: number;
  createdBy?: number | null;
  creatorEmail?: string | null;
  creatorName?: string | null;
  createdAt: string;
  updatedAt: string;
  reviews?: ProductReview[];
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: number;
  userName: string | null;
  userEmail: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
}

export interface UpdateStockRequest {
  stock?: number;
  shippedCount?: number;
}

export interface CheckoutRequest {
  items: { productId: string; quantity: number }[];
  shippingAddress: string;
}

export interface RateProductRequest {
  rating: number;
  comment?: string;
}
