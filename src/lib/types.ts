export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen';
export type OrderStatus = 'draft' | 'open' | 'confirmed' | 'paid';
export type TicketStatus = 'new' | 'preparing' | 'ready' | 'served';
export type SoldBy = 'unidad' | 'peso';
export type DiscountType = 'porcentaje' | 'monto';
export type TpvShape = 'cuadrado' | 'circulo' | 'hexágono';
export type ServiceType = 'mesa' | 'llevar' | 'domicilio' | 'rappi' | 'ubereats' | 'didifood';

export interface UserProfile {
  id?: string;
  uid: string;
  role: UserRole;
  orgId: string;
  allowedLocIds: string[];
  name?: string;
  email?: string;
  phone?: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  taxRate?: number;
  logo?: string;
  createdAt: number;
}

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

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  city?: string;
  acceptsMarketing: boolean;
  acceptsTerms: boolean;
  points: number;
  totalVisits: number;
  lastVisit: number;
  createdAt: number;
}

export interface LoyaltySettings {
  pointsPercentage: number;
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
  modifiers?: string[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
  selectedModifiers: ModifierOption[];
  notes?: string;
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
  discountAmount: number;
  payments: Payment[];
  paidAmount: number;
  serviceType: ServiceType;
  tableNumber?: string;
  customerId?: string;
  notes?: string;
  createdAt: number;
  locId: string;
  orgId: string;
}

export interface KitchenTicket {
  id?: string;
  orderId: string;
  firestoreOrderId?: string;
  status: TicketStatus;
  items: { name: string; quantity: number; modifiers?: string[]; notes?: string }[];
  timestamp: number;
  serviceType: ServiceType;
  tableNumber?: string;
  locId: string;
}

export interface DailyAnalytics {
  id: string; // YYYYMMDD
  totalRevenue: number;
  totalOrders: number;
  items: Record<string, { quantity: number; revenue: number }>;
}
