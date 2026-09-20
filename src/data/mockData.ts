import { DashboardData, Product, User } from '../types';

export const mockDashboardData: DashboardData = {
  inventory: {
    gold: {
      label: 'موجودی طلا',
      value: '125.50',
      unit: 'گرم',
    },
    silver: {
      label: 'موجودی نقره',
      value: '350.00',
      unit: 'گرم',
    },
    jewelry: {
      label: 'موجودی جواهرات',
      value: '48',
      unit: 'قطعه',
    },
  },
  rates: [
    { carat: '۱۸ عیار', pricePerGram: 8500, currency: 'افغانی' },
    { carat: '۲۱ عیار', pricePerGram: 9900, currency: 'افغانی' },
    { carat: '۲۲ عیار', pricePerGram: 10350, currency: 'افغانی' },
    { carat: '۲۴ عیار', pricePerGram: 11300, currency: 'افغانی' },
  ],
  silverRates: [
    { carat: '۹۹۹ عیار', pricePerGram: 150, currency: 'افغانی' },
    { carat: '۹۲۵ عیار', pricePerGram: 120, currency: 'افغانی' },
  ],
  currencyRates: [
    { carat: 'دالر (USD)', pricePerGram: 68.50, currency: 'افغانی' },
    { carat: 'یورو (EUR)', pricePerGram: 75.20, currency: 'افغانی' },
  ],
  todaySales: {
    amount: 125000,
    currency: 'افغانی',
  },
  todayDate: 'دوشنبه، ۲۴ شهریور ۱۴۰۵', // Example static date
};

export const mockProducts: Product[] = [
  {
    id: '1',
    code: 'G-101',
    name: 'گردن‌بند طلای ۱۸ عیار',
    weight: 12.5,
    material: 'gold',
    carat: '۱۸ عیار',
    origin: 'ترکی',
    quantity: 5,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
    price: 106250,
  },
  {
    id: '2',
    code: 'S-202',
    name: 'انگشتر نقره ۹۲۵ عیار',
    weight: 4.2,
    material: 'silver',
    carat: '۹۲۵ عیار',
    origin: 'ایرانی',
    quantity: 12,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    price: 504,
  },
  {
    id: '3',
    code: 'J-303',
    name: 'دستبند جواهر عقیق',
    weight: 15.8,
    material: 'jewelry',
    stoneType: 'عقیق',
    origin: 'افغانستان',
    quantity: 3,
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=400',
    price: 15000,
  },
  {
    id: '4',
    code: 'G-104',
    name: 'زنجیر طلای ۲۱ عیار',
    weight: 8.7,
    material: 'gold',
    carat: '۲۱ عیار',
    origin: 'عربی',
    quantity: 8,
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=400',
    price: 86130,
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'مصطفی',
    lastName: 'مددی',
    fatherName: 'احمد',
    phone: '0799123456',
    address: 'کابل، افغانستان',
    role: 'admin',
    username: 'admin',
    password: 'password123',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    createdAt: '2023-10-01',
  },
  {
    id: '2',
    firstName: 'احمد',
    lastName: 'نورزاد',
    fatherName: 'محمود',
    phone: '0788654321',
    address: 'هرات، افغانستان',
    role: 'seller',
    username: 'seller1',
    password: 'password456',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    createdAt: '2023-11-15',
  },
];
