import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import api from './lib/api';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Rates from './pages/Rates';
import Returns from './pages/Returns';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Login from './pages/Login';
import POS from './pages/POS';
import LowStockAlerts from './pages/LowStockAlerts';
import PromotionalShowroom from './pages/PromotionalShowroom';
import { SettingsProvider } from './context/SettingsContext';
import { InventoryProvider } from './context/InventoryContext';
import { RatesProvider } from './context/RatesContext';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('khazana_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // If we only have tokens but no profile info, try to fetch it
          if (userData.access && !userData.username) {
            try {
              const response = await api.get('/users/me/');
              setUser({ ...response.data, ...userData });
            } catch (apiError) {
              console.error('Failed to fetch user profile:', apiError);
              // Still set the user with tokens at least, or clear if invalid
              if ((apiError as any)?.response?.status === 401 || (apiError as any)?.response?.status === 403) {
                localStorage.removeItem('khazana_user');
                setUser(null);
              } else {
                // For other network errors, we might keep the local state if it's a temporary connectivity issue
                setUser(userData);
              }
            }
          } else {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('khazana_user');
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('khazana_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('khazana_user');
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-kh-bg dark:bg-dark-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-kh-gold/20 border-t-kh-gold rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <BrowserRouter>
      <SettingsProvider>
        <InventoryProvider isAuthenticated={!!user}>
          <RatesProvider isAuthenticated={!!user}>
            {!user ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Routes>
                <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="low-stock" element={<LowStockAlerts />} />
                  <Route path="showroom" element={<PromotionalShowroom />} />
                  <Route path="returns" element={<Returns />} />
                  <Route path="pos" element={<POS />} />
                  <Route path="rates" element={<Rates />} />
                  <Route path="reports" element={<Reports />} />
                  <Route 
                    path="users" 
                    element={
                      (user?.role === 'admin' || user?.is_superuser || user?.username === 'admin') 
                      ? <Users /> 
                      : <div className="p-10 text-center font-bold text-red-500">شما اجازه دسترسی به این بخش را ندارید.</div>
                    } 
                  />
                  <Route 
                    path="settings" 
                    element={
                      (user?.role === 'admin' || user?.is_superuser || user?.username === 'admin') 
                      ? <Settings /> 
                      : <div className="p-10 text-center font-bold text-red-500">شما اجازه دسترسی به این بخش را ندارید.</div>
                    } 
                  />
                </Route>
              </Routes>
            )}
          </RatesProvider>
        </InventoryProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
