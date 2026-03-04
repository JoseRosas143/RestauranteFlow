export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen';
export type OrderStatus = 'draft' | 'open' | 'confirmed' | 'paid';
export type TicketStatus = 'new' | 'preparing' | 'ready' | 'served';
export type SoldBy = 'unidad' | 'peso';
export type DiscountType = 'porcentaje' | 'monto';
export type TpvShape = 'cuadrado' | 'circulo' | 'hexágono';
export type ServiceType = 'mesa' | 'llevar' | 'domicilio' | 'rappi' | 'ubereats' | 'didifood' | 'personalizado';

export interface UserProfile {
  id?: string;
  uid: string;
  role: UserRole;
  orgId: string;
  allowedLocIds: string[];
  name?: string;
  email?: string;
  phone?: string;
  pin?: string;
}

export interface Category {
  id?: string;
  name: string;
  color: string;
}

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  id?: string;
  name: string;
  options: ModifierOption[];
}

export interface Discount {
  id?: string;
  name: string;
  value: number;
  type: DiscountType;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  taxRate?: number;
  cardFee?: number;
  logo?: string;
  websiteUrl?: string;
  ticketHeader?: string;
  ticketFooter?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  categoryId?: string;
  image?: string;
  soldBy: SoldBy;
  reference?: string;
  barcode?: string;
  trackInventory: boolean;
  inventoryCount?: number;
  tpvColor: string;
  tpvShape: TpvShape;
  modifierIds: string[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
  selectedModifiers: { name: string; price: number }[];
  notes?: string;
  discountValue?: number;
  discountType?: DiscountType;
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
  discountType?: DiscountType;
  payments: Payment[];
  paidAmount: number;
  serviceType: ServiceType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  locId: string;
  orgId: string;
  staffId?: string;
  staffName?: string;
}

export interface KitchenTicket {
  id?: string;
  orderId: string;
  status: TicketStatus;
  items: { name: string; quantity: number; modifiers?: string[]; notes?: string }[];
  timestamp: number;
  serviceType: ServiceType;
  tableNumber?: string;
  locId: string;
}