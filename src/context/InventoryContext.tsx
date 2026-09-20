import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Country, Expense } from '../types';
import api from '../lib/api';
import { useSettings } from './SettingsContext';

export const INITIAL_SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-101',
    code: 'G-21-101',
    name: 'انگشتر طلای ۲۱ عیار بحرینی',
    weight: 5.45,
    material: 'gold',
    carat: '21',
    origin: 'بحرین',
    quantity: 6,
    minQuantity: 2,
    purchasePricePerGram: 4200,
    purchasePrice: 22890,
  },
  {
    id: 'prod-102',
    code: 'G-18-102',
    name: 'دستبند طلای ۱۸ عیار کارتیه',
    weight: 12.2,
    material: 'gold',
    carat: '18',
    origin: 'ایتالیا',
    quantity: 4,
    minQuantity: 1,
    purchasePricePerGram: 3700,
    purchasePrice: 45140,
  },
  {
    id: 'prod-103',
    code: 'G-21-103',
    name: 'سرویس طلا ۲۱ عیار تراش هندی',
    weight: 28.8,
    material: 'gold',
    carat: '21',
    origin: 'هند',
    quantity: 2,
    minQuantity: 1,
    purchasePricePerGram: 4250,
    purchasePrice: 122400,
  },
  {
    id: 'prod-104',
    code: 'G-22-104',
    name: 'مدال طلای ۲۲ عیار کابل طرح سنتی',
    weight: 7.6,
    material: 'gold',
    carat: '22',
    origin: 'افغانستان',
    quantity: 4,
    minQuantity: 1,
    purchasePricePerGram: 4500,
    purchasePrice: 34200,
  },
  {
    id: 'prod-105',
    code: 'S-925-105',
    name: 'انگشتر نقره ۹۲۵ با نگین زمرد پنجشیر',
    weight: 6.5,
    material: 'silver',
    carat: '925',
    origin: 'افغانستان',
    quantity: 8,
    minQuantity: 2,
    stoneType: 'زمرد پنجشیر',
    purchasePricePerGram: 250,
    purchasePrice: 1625,
  },
  {
    id: 'prod-106',
    code: 'S-925-106',
    name: 'زنجیر نقره ۹۲۵ عیار ونیزی مردانه',
    weight: 18.3,
    material: 'silver',
    carat: '925',
    origin: 'ایتالیا',
    quantity: 10,
    minQuantity: 3,
    purchasePricePerGram: 180,
    purchasePrice: 3294,
  },
  {
    id: 'prod-107',
    code: 'J-107',
    name: 'انگشتر جواهر تک‌نگین یاقوت سرخ',
    weight: 3.2,
    material: 'jewelry',
    origin: 'افغانستان',
    quantity: 3,
    minQuantity: 1,
    stoneType: 'یاقوت برمه',
    price: 26000,
    purchasePrice: 19000,
  },
  {
    id: 'prod-108',
    code: 'G-18-108',
    name: 'گوشواره طلای ۱۸ عیار میخی نگین‌دار',
    weight: 4.15,
    material: 'gold',
    carat: '18',
    origin: 'ترکیه',
    quantity: 5,
    minQuantity: 2,
    purchasePricePerGram: 3650,
    purchasePrice: 15147.5,
  }
];

export const INITIAL_SAMPLE_SALES: Sale[] = [
  {
    id: 'sale-1001',
    invoiceNumber: 'INV-10021',
    customerName: 'محمد ادریس',
    sellerName: 'احمد مدیر',
    date: new Date().toLocaleDateString('en-CA'),
    timestamp: Date.now() - 3600000,
    totalAmount: 25500,
    items: [
      {
        id: 'prod-101',
        name: 'انگشتر طلای ۲۱ عیار بحرینی',
        code: 'G-21-101',
        material: 'gold',
        carat: '21',
        weight: 5.45,
        origin: 'بحرین',
        quantity: 6,
        selectedWeight: 5.45,
        selectedQuantity: 1,
        selectedPrice: 4678,
        purchasePrice: 4200
      }
    ]
  },
  {
    id: 'sale-1002',
    invoiceNumber: 'INV-10022',
    customerName: 'شفیق احمد',
    sellerName: 'احمد مدیر',
    date: new Date().toLocaleDateString('en-CA'),
    timestamp: Date.now() - 1800000,
    totalAmount: 2800,
    items: [
      {
        id: 'prod-105',
        name: 'انگشتر نقره ۹۲۵ با نگین زمرد پنجشیر',
        code: 'S-925-105',
        material: 'silver',
        carat: '925',
        weight: 6.5,
        origin: 'افغانستان',
        quantity: 8,
        selectedWeight: 6.5,
        selectedQuantity: 1,
        selectedPrice: 430,
        purchasePrice: 250
      }
    ]
  }
];

interface InventoryContextType {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  countries: Country[];
  isLoading: boolean;
  addProduct: (product: Product) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  returnProduct: (id: string, reason?: string) => Promise<void>;
  addCountry: (name: string) => Promise<Country | null>;
  completeSale: (sale: Sale) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  removeExpense: (id: string) => Promise<void>;
  getTodaySales: () => Sale[];
  refreshData: () => Promise<void>;
  restoreDefaultSampleData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useSettings();

  // Initialize immediately from localStorage or fallback to initial sample data
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('khazana_inventory') || localStorage.getItem('khazana_inventory_backup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading initial products:', e);
    }
    // Seed default sample products so the app is never empty
    try {
      localStorage.setItem('khazana_inventory', JSON.stringify(INITIAL_SAMPLE_PRODUCTS));
      localStorage.setItem('khazana_inventory_backup', JSON.stringify(INITIAL_SAMPLE_PRODUCTS));
    } catch {}
    return INITIAL_SAMPLE_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem('khazana_sales') || localStorage.getItem('khazana_sales_backup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading initial sales:', e);
    }
    try {
      localStorage.setItem('khazana_sales', JSON.stringify(INITIAL_SAMPLE_SALES));
      localStorage.setItem('khazana_sales_backup', JSON.stringify(INITIAL_SAMPLE_SALES));
    } catch {}
    return INITIAL_SAMPLE_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('khazana_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading initial expenses:', e);
    }
    return [];
  });

  const [countries, setCountries] = useState<Country[]>(() => {
    try {
      const saved = localStorage.getItem('khazana_countries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 1, name: 'افغانستان' },
      { id: 2, name: 'بحرین' },
      { id: 3, name: 'ایتالیا' },
      { id: 4, name: 'ترکیه' },
      { id: 5, name: 'هند' },
      { id: 6, name: 'امارات متحده عربی' },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);

  const parseRemoteProduct = (p: any): Product => ({
    ...p,
    id: p.id.toString(),
    weight: parseFloat(p.weight) || 0,
    quantity: parseInt(p.quantity) || 0,
    minQuantity: p.minQuantity !== undefined ? parseInt(p.minQuantity) : (p.min_quantity !== undefined ? parseInt(p.min_quantity) : 1),
    price: p.price ? parseFloat(p.price) : undefined,
    purchasePrice: p.purchasePrice !== undefined ? parseFloat(p.purchasePrice) : (p.purchase_price !== undefined && p.purchase_price !== null ? parseFloat(p.purchase_price) : undefined),
    purchasePricePerGram: p.purchasePricePerGram !== undefined ? parseFloat(p.purchasePricePerGram) : (p.purchase_price_per_gram !== undefined && p.purchase_price_per_gram !== null ? parseFloat(p.purchase_price_per_gram) : undefined),
    stoneType: p.stoneType || p.stone_type,
    isReturned: p.isReturned !== undefined ? p.isReturned : p.is_returned,
    secondHandDestination: p.secondHandDestination || p.second_hand_destination,
    deductFromMelt: p.deductFromMelt !== undefined ? Boolean(p.deductFromMelt) : (p.deduct_from_melt !== undefined ? Boolean(p.deduct_from_melt) : false)
  });

  const fetchData = async () => {
    try {
      const [productsRes, salesRes, countriesRes, expensesRes] = await Promise.allSettled([
        api.get('/inventory/products/'),
        api.get('/sales/'),
        api.get('/inventory/countries/'),
        api.get('/sales/expenses/')
      ]);
      
      // ONLY update products if remote returned valid data
      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data) && productsRes.value.data.length > 0) {
        const remoteProducts = productsRes.value.data.map(parseRemoteProduct);
        setProducts(remoteProducts);
        localStorage.setItem('khazana_inventory', JSON.stringify(remoteProducts));
        localStorage.setItem('khazana_inventory_backup', JSON.stringify(remoteProducts));
      } else {
        // KEEP AND PRESERVE LOCAL DATA
        const local = localStorage.getItem('khazana_inventory') || localStorage.getItem('khazana_inventory_backup');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProducts(parsed);
            }
          } catch {}
        }
      }
      
      if (countriesRes.status === 'fulfilled' && Array.isArray(countriesRes.value.data) && countriesRes.value.data.length > 0) {
        setCountries(countriesRes.value.data);
        localStorage.setItem('khazana_countries', JSON.stringify(countriesRes.value.data));
      }

      if (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value.data) && salesRes.value.data.length > 0) {
        const remoteSales = salesRes.value.data.map((s: any) => ({
          ...s,
          id: s.id.toString(),
          invoiceNumber: s.invoice_number,
          customerName: s.customer_name,
          sellerName: s.seller_name,
          date: new Date(s.created_at).toLocaleDateString('en-CA'),
          totalAmount: parseFloat(s.total_amount) || 0,
          items: s.items.map((it: any) => ({
            ...it,
            id: it.product ? it.product.toString() : `deleted-${it.id}`,
            name: it.name_snapshot,
            code: it.code_snapshot,
            material: it.material_snapshot,
            carat: it.carat_snapshot,
            selectedWeight: parseFloat(it.weight) || 0,
            selectedQuantity: it.quantity,
            selectedPrice: parseFloat(it.price) || 0,
            purchasePrice: it.purchase_price_snapshot !== undefined && it.purchase_price_snapshot !== null
              ? parseFloat(it.purchase_price_snapshot)
              : (it.purchasePrice !== undefined ? parseFloat(it.purchasePrice) : undefined)
          }))
        }));
        setSales(remoteSales);
        localStorage.setItem('khazana_sales', JSON.stringify(remoteSales));
        localStorage.setItem('khazana_sales_backup', JSON.stringify(remoteSales));
      } else {
        const local = localStorage.getItem('khazana_sales') || localStorage.getItem('khazana_sales_backup');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSales(parsed);
            }
          } catch {}
        }
      }

      if (expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value.data) && expensesRes.value.data.length > 0) {
        const remoteExpenses = expensesRes.value.data.map((e: any) => ({
          id: e.id.toString(),
          title: e.title,
          category: e.category,
          amount: parseFloat(e.amount) || 0,
          recipient: e.recipient || '',
          description: e.description || '',
          date: e.date,
          createdByName: e.created_by_name || '',
          createdAt: e.created_at
        }));
        setExpenses(remoteExpenses);
        localStorage.setItem('khazana_expenses', JSON.stringify(remoteExpenses));
      } else {
        const localExpenses = localStorage.getItem('khazana_expenses');
        if (localExpenses) {
          try {
            setExpenses(JSON.parse(localExpenses));
          } catch {}
        }
      }
    } catch (error) {
      console.warn('API offline, running on persistent local storage');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const restoreDefaultSampleData = () => {
    setProducts(INITIAL_SAMPLE_PRODUCTS);
    setSales(INITIAL_SAMPLE_SALES);
    localStorage.setItem('khazana_inventory', JSON.stringify(INITIAL_SAMPLE_PRODUCTS));
    localStorage.setItem('khazana_inventory_backup', JSON.stringify(INITIAL_SAMPLE_PRODUCTS));
    localStorage.setItem('khazana_sales', JSON.stringify(INITIAL_SAMPLE_SALES));
    localStorage.setItem('khazana_sales_backup', JSON.stringify(INITIAL_SAMPLE_SALES));
  };

  const addProduct = async (product: Product): Promise<Product> => {
    try {
      const response = await api.post('/inventory/products/', product);
      const parsed = parseRemoteProduct(response.data);
      setProducts(prev => {
        const newProducts = [...prev, parsed];
        localStorage.setItem('khazana_inventory', JSON.stringify(newProducts));
        localStorage.setItem('khazana_inventory_backup', JSON.stringify(newProducts));
        return newProducts;
      });
      return parsed;
    } catch (error) {
      console.error('Failed to add product to API, saving locally:', error);
      const fallbackProduct = { ...product, id: product.id || Date.now().toString() };
      setProducts(prev => {
        const newProducts = [...prev, fallbackProduct];
        localStorage.setItem('khazana_inventory', JSON.stringify(newProducts));
        localStorage.setItem('khazana_inventory_backup', JSON.stringify(newProducts));
        return newProducts;
      });
      return fallbackProduct;
    }
  };

  const returnProduct = async (id: string, reason?: string) => {
    try {
      await api.post(`/inventory/products/${id}/return/`, { reason });
    } catch (error) {
      console.warn('Backend return endpoint error, updating locally:', error);
    }
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, isReturned: true } : p);
      localStorage.setItem('khazana_inventory', JSON.stringify(updated));
      localStorage.setItem('khazana_inventory_backup', JSON.stringify(updated));
      return updated;
    });
  };

  const updateProduct = async (product: Product) => {
    try {
      const response = await api.put(`/inventory/products/${product.id}/`, product);
      const parsed = parseRemoteProduct(response.data);
      setProducts(prev => {
        const newProducts = prev.map(p => p.id === product.id ? parsed : p);
        localStorage.setItem('khazana_inventory', JSON.stringify(newProducts));
        localStorage.setItem('khazana_inventory_backup', JSON.stringify(newProducts));
        return newProducts;
      });
    } catch (error) {
      console.error('Failed to update product on API, saving locally:', error);
      setProducts(prev => {
        const newProducts = prev.map(p => p.id === product.id ? product : p);
        localStorage.setItem('khazana_inventory', JSON.stringify(newProducts));
        localStorage.setItem('khazana_inventory_backup', JSON.stringify(newProducts));
        return newProducts;
      });
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await api.delete(`/inventory/products/${id}/`);
    } catch (error) {
      console.error('Failed to remove product from API, removing locally:', error);
    }
    setProducts(prev => {
      const newProducts = prev.filter(p => p.id !== id);
      localStorage.setItem('khazana_inventory', JSON.stringify(newProducts));
      localStorage.setItem('khazana_inventory_backup', JSON.stringify(newProducts));
      return newProducts;
    });
  };

  const addCountry = async (name: string): Promise<Country | null> => {
    try {
      const response = await api.post('/inventory/countries/', { name });
      const newCountry = response.data;
      setCountries(prev => {
        const updated = [...prev, newCountry];
        localStorage.setItem('khazana_countries', JSON.stringify(updated));
        return updated;
      });
      return newCountry;
    } catch (error) {
      console.error('Failed to add country to API, saving locally:', error);
      const newCountry: Country = { id: Date.now(), name };
      setCountries(prev => {
        const updated = [...prev, newCountry];
        localStorage.setItem('khazana_countries', JSON.stringify(updated));
        return updated;
      });
      return newCountry;
    }
  };

  const completeSale = async (sale: Sale) => {
    try {
      const payload = {
        customer_name: sale.customerName,
        items: sale.items.map(item => {
          const calculatedPrice = item.material === 'jewelry' 
            ? item.selectedPrice 
            : (item.selectedPrice * (item.selectedWeight || 0));

          const basePrice = item.manualPrice !== undefined 
            ? (item.manualPrice / (item.selectedQuantity || 1)) 
            : calculatedPrice;
            
          return {
            product: parseInt(item.id),
            weight: parseFloat(Number(item.selectedWeight || 0).toFixed(2)),
            quantity: item.selectedQuantity,
            price: parseFloat(Number(basePrice).toFixed(2)),
            rate_at_sale: parseFloat(Number(item.selectedPrice || 0).toFixed(2))
          };
        })
      };

      const response = await api.post('/sales/', payload);
      const newSale = {
        ...response.data,
        id: response.data.id.toString(),
        invoiceNumber: response.data.invoice_number,
        customerName: response.data.customer_name,
        sellerName: response.data.seller_name,
        date: new Date(response.data.created_at).toLocaleDateString('en-CA'),
        items: response.data.items.map((it: any) => ({
          id: it.product ? it.product.toString() : `deleted-${it.id}`,
          name: it.name_snapshot,
          code: it.code_snapshot,
          selectedWeight: parseFloat(it.weight),
          selectedQuantity: it.quantity,
          selectedPrice: parseFloat(it.price)
        }))
      };
      
      setSales(prev => {
        const updated = [newSale, ...prev];
        localStorage.setItem('khazana_sales', JSON.stringify(updated));
        localStorage.setItem('khazana_sales_backup', JSON.stringify(updated));
        return updated;
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to complete sale via API, completing locally:', error);
      const fallbackSale: Sale = {
        ...sale,
        id: sale.id || Date.now().toString(),
        invoiceNumber: sale.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: sale.date || new Date().toLocaleDateString('en-CA'),
        timestamp: sale.timestamp || Date.now()
      };
      setSales(prev => {
        const updated = [fallbackSale, ...prev];
        localStorage.setItem('khazana_sales', JSON.stringify(updated));
        localStorage.setItem('khazana_sales_backup', JSON.stringify(updated));
        return updated;
      });

      // Also deduct local stock
      setProducts(prevProducts => {
        const updated = prevProducts.map(prod => {
          const soldItem = sale.items.find(it => it.id === prod.id || it.code === prod.code);
          if (soldItem) {
            const newQty = Math.max(0, prod.quantity - (soldItem.selectedQuantity || 1));
            return { ...prod, quantity: newQty };
          }
          return prod;
        });
        localStorage.setItem('khazana_inventory', JSON.stringify(updated));
        localStorage.setItem('khazana_inventory_backup', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    try {
      const response = await api.post('/sales/expenses/', expenseData);
      const newExpense: Expense = {
        id: response.data.id.toString(),
        title: response.data.title,
        category: response.data.category,
        amount: parseFloat(response.data.amount) || 0,
        recipient: response.data.recipient || '',
        description: response.data.description || '',
        date: response.data.date,
        createdByName: response.data.created_by_name || '',
        createdAt: response.data.created_at
      };
      setExpenses(prev => [newExpense, ...prev]);
      const updated = [newExpense, ...expenses];
      localStorage.setItem('khazana_expenses', JSON.stringify(updated));
      return newExpense;
    } catch (error) {
      console.error('Failed to add expense to API, storing locally:', error);
      const localExpense: Expense = {
        ...expenseData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setExpenses(prev => [localExpense, ...prev]);
      const updated = [localExpense, ...expenses];
      localStorage.setItem('khazana_expenses', JSON.stringify(updated));
      return localExpense;
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await api.delete(`/sales/expenses/${id}/`);
    } catch (error) {
      console.error('Failed to delete expense from API:', error);
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    const updated = expenses.filter(e => e.id !== id);
    localStorage.setItem('khazana_expenses', JSON.stringify(updated));
  };

  const getTodaySales = () => {
    const today = new Date().toLocaleDateString('en-CA');
    return sales.filter(s => s.date === today);
  };

  return (
    <InventoryContext.Provider value={{ 
      products, 
      sales, 
      expenses,
      isLoading,
      addProduct, 
      updateProduct, 
      removeProduct, 
      returnProduct,
      completeSale,
      addExpense,
      removeExpense,
      getTodaySales,
      refreshData: fetchData,
      restoreDefaultSampleData,
      countries,
      addCountry
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
