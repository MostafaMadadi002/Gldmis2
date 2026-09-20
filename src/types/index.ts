export interface Country {
  id: number;
  name: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  weight: number;
  material: 'gold' | 'silver' | 'jewelry';
  carat?: string;
  stoneType?: string;
  origin: string;
  quantity: number;
  minQuantity?: number;
  image?: string;
  price?: number;
  isReturned?: boolean;
  secondHandDestination?: 'inventory' | 'melt' | string;
  purchasePrice?: number;
  purchasePricePerGram?: number;
  deductFromMelt?: boolean;
  [key: string]: any;
}

export interface Expense {
  id: string;
  title: string;
  category: 'rent' | 'salary' | 'utility' | 'withdrawal' | 'other';
  amount: number;
  recipient?: string;
  description?: string;
  date: string; // ISO date format YYYY-MM-DD
  createdByName?: string;
  createdAt?: number | string;
}

export interface InventoryItem {
  label: string;
  value: string;
  unit: string;
}

export interface GoldRate {
  carat: string;
  pricePerGram: number;
  currency: string;
}

export interface Rate {
  id: string;
  label: string;
  value: number;
  currency: string;
  type: 'gold' | 'silver' | 'currency' | 'gemstone';
}

export interface DashboardData {
  inventory: {
    gold: InventoryItem;
    silver: InventoryItem;
    jewelry: InventoryItem;
  };
  rates: GoldRate[];
  silverRates: GoldRate[];
  currencyRates: GoldRate[];
  todaySales: {
    amount: number;
    currency: string;
  };
  todayDate: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  phone?: string;
  email?: string;
  address?: string;
  role: 'admin' | 'seller';
  username: string;
  isSuperuser?: boolean;
  password?: string;
  image?: string;
  createdAt?: string;
}

export interface CartItem extends Product {
  selectedPrice: number;
  selectedWeight: number;
  selectedQuantity: number;
  manualPrice?: number;
  selectedStone?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  sellerName: string;
  items: CartItem[];
  totalAmount: number;
  date: string;
  timestamp: number;
}
