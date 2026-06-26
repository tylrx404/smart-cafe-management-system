export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  KITCHEN = 'KITCHEN',
  ADMIN = 'ADMIN',
}

export enum TableStatus {
  EMPTY = 'EMPTY',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED', // Paid and closed
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: 'veg' | 'non-veg' | 'beverage';
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  tableId: number;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  timestamp: number;
  customerName?: string;
  isBillGenerated?: boolean; // New field for Admin Bill Gen
}

export interface Table {
  id: number;
  status: TableStatus;
  currentOrderId?: string;
}

export interface User {
  role: UserRole;
  name: string;
  email?: string; // Email address for customer accounts
  id?: number; // User ID from backend database
  token?: string; // JWT token from authentication
}

export interface AppState {
  currentUser: User | null;
  isOnlineMode: boolean;
  tables: Table[];
  orders: Order[];
  notifications: AppNotification[];
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export const INITIAL_TABLES: Table[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  status: TableStatus.EMPTY,
}));