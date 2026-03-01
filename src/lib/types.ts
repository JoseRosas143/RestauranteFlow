
export type OrderStatus = 'draft' | 'confirmed' | 'paid';
export type TicketStatus = 'new' | 'preparing' | 'ready' | 'served';
export type SoldBy = 'unidad' | 'peso';
export type DiscountType = 'porcentaje' | 'monto';
export type TpvShape = 'cuadrado' | 'circulo' | 'hexágono';

export interface ModifierOption {
  name: string;
  price: number;
}

export interface Modifier {
  id?: string;
  name: string;
  options: ModifierOption[];
}

export interface Category {
  id?: string;
  name: string;
  color: string;
}

export interface Discount {
  id?: string;
  name: string;
  value: number;
  type: DiscountType;
}

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  cost?: number;
  category: string;
  categoryId?: string;
  image?: string;
  soldBy: SoldBy;
  reference?: string;
  barcode?: string;
  trackInventory: boolean;
  inventoryCount?: number;
  tpvColor?: string;
  tpvShape?: TpvShape;
  modifiers?: string[]; // IDs de modificadores
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
