
export type OrderStatus = 'draft' | 'confirmed' | 'paid';
export type TicketStatus = 'new' | 'preparing' | 'ready' | 'served';

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  timestamp: number;
}

export interface Order {
  id: string;
  firestoreId?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payments: Payment[];
  paidAmount: number;
  createdAt: number;
}

export interface KitchenTicket {
  id?: string;
  orderId: string;
  firestoreOrderId?: string;
  status: TicketStatus;
  items: { name: string; quantity: number }[];
  timestamp: number;
}
