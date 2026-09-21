import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Country, Expense } from '../types';
import api from '../lib/api';
import { useSettings } from './SettingsContext';

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

export function InventoryProvider({ children, isAuthenticated }: { children: React.ReactNode; isAuthenticated: boolean }) {
  const { t } = useSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [countries, setCountries] = useState<Country[]>([
    { id: 1, name: 'افغانستان' },
    { id: 2, name: 'بحرین' },
    { id: 3, name: 'ایتالیا' },
    { id: 4, name: 'ترکیه' },
    { id: 5, name: 'هند' },
    { id: 6, name: 'امارات متحده عربی' },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const toEnglishDigits = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '';
    const s = str.toString();
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /۸/g, /۹/g];
    let result = s;
    for (let i = 0; i < 10; i++) {
      result = result.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return result;
  };

  const parseRemoteProduct = (p: any): Product => ({
    ...p,
    id: p.id.toString(),
    weight: parseFloat(toEnglishDigits(p.weight)) || 0,
    quantity: parseInt(toEnglishDigits(p.quantity)) || 0,
    minQuantity: p.minQuantity !== undefined ? parseInt(toEnglishDigits(p.minQuantity)) : (p.min_quantity !== undefined ? parseInt(toEnglishDigits(p.min_quantity)) : 1),
    price: p.price ? parseFloat(toEnglishDigits(p.price)) : undefined,
    purchasePrice: p.purchasePrice !== undefined ? parseFloat(toEnglishDigits(p.purchasePrice)) : (p.purchase_price !== undefined && p.purchase_price !== null ? parseFloat(toEnglishDigits(p.purchase_price)) : undefined),
    purchasePricePerGram: p.purchasePricePerGram !== undefined ? parseFloat(toEnglishDigits(p.purchasePricePerGram)) : (p.purchase_price_per_gram !== undefined && p.purchase_price_per_gram !== null ? parseFloat(toEnglishDigits(p.purchase_price_per_gram)) : undefined),
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
      
      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data)) {
        const remoteProducts = productsRes.value.data.map(parseRemoteProduct);
        setProducts(remoteProducts);
      }
      
      if (countriesRes.status === 'fulfilled' && Array.isArray(countriesRes.value.data)) {
        setCountries(countriesRes.value.data);
      }

      if (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value.data)) {
        const remoteSales = salesRes.value.data.map((s: any) => {
          try {
            return {
              ...s,
              id: s.id?.toString() || Math.random().toString(),
              invoiceNumber: s.invoice_number || 'N/A',
              customerName: s.customer_name || '',
              sellerName: s.seller_name || '',
              date: s.created_at ? new Date(s.created_at).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
              totalAmount: parseFloat(s.total_amount) || 0,
              items: (s.items || []).map((it: any) => ({
                ...it,
                id: it.product ? it.product.toString() : `deleted-${it.id}`,
                name: it.name_snapshot || 'Unknown',
                code: it.code_snapshot || '',
                material: it.material_snapshot || '',
                carat: it.carat_snapshot || '',
                selectedWeight: parseFloat(it.weight) || 0,
                selectedQuantity: parseInt(it.quantity) || 1,
                selectedPrice: parseFloat(it.price) || 0,
                purchasePrice: it.purchase_price_snapshot !== undefined && it.purchase_price_snapshot !== null
                  ? parseFloat(it.purchase_price_snapshot)
                  : (it.purchasePrice !== undefined ? parseFloat(it.purchasePrice) : undefined)
              }))
            };
          } catch (e) {
            console.error('Error parsing individual sale:', s, e);
            return null;
          }
        }).filter(Boolean);
        setSales(remoteSales);
      }

      if (expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value.data)) {
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
      }
    } catch (error) {
      console.warn('API offline, running on persistent local storage');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setProducts([]);
      setSales([]);
      setExpenses([]);
    }
  }, [isAuthenticated]);

  const restoreDefaultSampleData = () => {
    setProducts([]);
    setSales([]);
    localStorage.removeItem('khazana_inventory');
    localStorage.removeItem('khazana_sales');
  };

  const addProduct = async (product: Product): Promise<Product> => {
    try {
      const response = await api.post('/inventory/products/', product);
      const parsed = parseRemoteProduct(response.data);
      setProducts(prev => {
        const newProducts = [...prev, parsed];
        localStorage.setItem('khazana_inventory', JSON.stringify(newProducts));
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
      if (!response.data || !response.data.items) {
        throw new Error('Invalid response from server');
      }
      
      const newSale = {
        ...response.data,
        id: response.data.id.toString(),
        invoiceNumber: response.data.invoice_number,
        customerName: response.data.customer_name,
        sellerName: response.data.seller_name,
        date: response.data.created_at ? new Date(response.data.created_at).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
        items: response.data.items.map((it: any) => ({
          id: it.product ? it.product.toString() : `deleted-${it.id}`,
          name: it.name_snapshot || 'Unknown',
          code: it.code_snapshot || '',
          selectedWeight: parseFloat(it.weight) || 0,
          selectedQuantity: parseInt(it.quantity) || 1,
          selectedPrice: parseFloat(it.price) || 0
        }))
      };
      
      setSales(prev => {
        const updated = [newSale, ...prev];
        try {
          localStorage.setItem('khazana_sales', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save sale to localStorage (Quota exceeded)', e);
        }
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
        try {
          localStorage.setItem('khazana_sales', JSON.stringify(updated));
        } catch (e) {
          console.error('LocalStorage full, could not save fallback sale');
        }
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
        try {
          localStorage.setItem('khazana_inventory', JSON.stringify(updated));
        } catch (e) {
          console.warn('LocalStorage full, could not update stock locally');
        }
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

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
