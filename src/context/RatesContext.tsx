import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface Rate {
  id: string;
  label: string;
  value: number;
  currency: string;
  type: 'gold' | 'silver' | 'currency' | 'gemstone';
}

interface RatesContextType {
  rates: Rate[];
  isLoading: boolean;
  refreshRates: () => Promise<void>;
  updateRate: (id: string, value: number) => Promise<void>;
  addRate: (rate: Omit<Rate, 'id'>) => Promise<void>;
  deleteRate: (id: string) => Promise<void>;
}

const RatesContext = createContext<RatesContextType | undefined>(undefined);

export const RatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/rates/');
      const remoteRates = Array.isArray(response.data) ? response.data.map((r: any) => ({
        ...r,
        id: r.id.toString()
      })) : [];
      
      // Trust the remote rates if the request succeeded
      setRates(remoteRates);
      localStorage.setItem('khazana_rates', JSON.stringify(remoteRates));
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      const localRates = localStorage.getItem('khazana_rates');
      if (localRates) setRates(JSON.parse(localRates));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const updateRate = async (id: string, value: number) => {
    try {
      const response = await api.patch(`/rates/${id}/`, { value });
      const updatedRate = { ...response.data, id: response.data.id.toString() };
      setRates(prev => {
        const newRates = prev.map(r => r.id === id ? updatedRate : r);
        localStorage.setItem('khazana_rates', JSON.stringify(newRates));
        return newRates;
      });
    } catch (error) {
      console.error('Failed to update rate:', error);
    }
  };

  const addRate = async (rate: Omit<Rate, 'id'>) => {
    try {
      const response = await api.post('/rates/', rate);
      const newRate = { ...response.data, id: response.data.id.toString() };
      setRates(prev => {
        const newRates = [...prev, newRate];
        localStorage.setItem('khazana_rates', JSON.stringify(newRates));
        return newRates;
      });
    } catch (error) {
      console.error('Failed to add rate:', error);
    }
  };

  const deleteRate = async (id: string) => {
    // Optimistic update
    const previousRates = rates;
    setRates(prev => {
      const newRates = prev.filter(r => r.id !== id);
      localStorage.setItem('khazana_rates', JSON.stringify(newRates));
      return newRates;
    });

    try {
      await api.delete(`/rates/${id}/`);
    } catch (error: any) {
      // If error is 404, it means it's already deleted on server, so no need to rollback
      if (error.response?.status === 404) {
        console.warn('Rate already deleted on server:', id);
        return;
      }

      console.error('Failed to delete rate:', error);
      // Rollback on other errors
      setRates(previousRates);
      localStorage.setItem('khazana_rates', JSON.stringify(previousRates));
      alert('Failed to delete rate. Please try again.');
    }
  };

  return (
    <RatesContext.Provider value={{ rates, isLoading, refreshRates: fetchRates, updateRate, addRate, deleteRate }}>
      {children}
    </RatesContext.Provider>
  );
};

export const useRates = () => {
  const context = useContext(RatesContext);
  if (!context) {
    throw new Error('useRates must be used within a RatesProvider');
  }
  return context;
};
