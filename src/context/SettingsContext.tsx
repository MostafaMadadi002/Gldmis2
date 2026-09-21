import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../data/translations';
import api from '../lib/api';

export interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  shopInfo: {
    name: string;
    address: string;
    phone: string;
    description: string;
    footerText: string;
  };
  setShopInfo: (info: {
    name: string;
    address: string;
    phone: string;
    description: string;
    footerText: string;
  }) => void;
  logo: string | null;
  setLogo: (logo: string | null) => void;
  t: (key: string) => string;
  saveSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fa');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [logo, setLogo] = useState<string | null>(null);
  const [shopInfo, setShopInfo] = useState({
    name: 'جواهرات خزانه',
    address: 'کابل، مارکیت جاده، طبقه اول',
    phone: '0799123456',
    description: 'عرضه کننده مدرن‌ترین جواهرات طلا و نقره با ضمانت کیفیت',
    footerText: 'از خرید شما سپاسگزاریم. اجناس فروخته شده با رعایت شرایط مرجوعی قابل تعویض می‌باشد.',
  });

  const fetchSettings = async () => {
    try {
      const response = await api.get('/shop/');
      if (response.data) {
        setShopInfo(prev => ({
          ...prev,
          ...response.data,
          name: response.data.name || prev.name,
          address: response.data.address || prev.address,
          phone: response.data.phone || prev.phone,
          description: response.data.description || prev.description,
          footerText: response.data.footerText || response.data.footer_text || prev.footerText,
        }));
        if (response.data.logo) setLogo(response.data.logo);
      }
    } catch (error) {
      console.warn('Could not fetch shop settings from DB, using local/defaults');
    }
  };

  const saveSettings = async () => {
    try {
      await api.put('/shop/', {
        ...shopInfo,
        logo
      });
      // Also cache locally for immediate UI consistency
      const settingsToSave = {
        shopInfo,
        logo,
        language,
        theme
      };
      localStorage.setItem('khazana_settings', JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Failed to save settings to DB', error);
      throw error;
    }
  };

  // Load from localStorage/DB on mount
  useEffect(() => {
    // Initial local load for speed
    const saved = localStorage.getItem('khazana_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.logo) setLogo(parsed.logo);
        if (parsed.shopInfo) setShopInfo(parsed.shopInfo);
      } catch (e) {}
    }

    // Then try to fetch from DB
    const user = localStorage.getItem('khazana_user');
    if (user) {
      fetchSettings();
    }
  }, []);

  // Apply theme and direction
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    
    if (language === 'en') {
      root.dir = 'ltr';
    } else {
      root.dir = 'rtl';
    }

    const currentSettings = JSON.parse(localStorage.getItem('khazana_settings') || '{}');
    localStorage.setItem('khazana_settings', JSON.stringify({
      ...currentSettings,
      theme: 'light',
      language
    }));
  }, [language]);

  const t = (key: string): string => {
    const langData = translations[language as keyof typeof translations];
    return (langData as any)[key] || (translations['fa'] as any)[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      theme, setTheme, 
      shopInfo, setShopInfo, 
      logo, setLogo,
      t,
      saveSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
