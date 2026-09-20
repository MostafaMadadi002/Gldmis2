import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../data/translations';

interface SettingsContextType {
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
  setShopInfo: (info: { name: string; address: string; phone: string; description: string; footerText: string }) => void;
  logo: string | null;
  setLogo: (logo: string | null) => void;
  t: (key: keyof typeof translations['fa']) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('khazana_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.logo) setLogo(parsed.logo);
        if (parsed.shopInfo) setShopInfo(parsed.shopInfo);
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  // Apply theme and direction
  useEffect(() => {
    const root = window.document.documentElement;
    // Always force light theme
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    
    // Set direction based on language
    if (language === 'en') {
      root.dir = 'ltr';
    } else {
      root.dir = 'rtl';
    }

    // Save preference immediately
    const currentSettings = JSON.parse(localStorage.getItem('khazana_settings') || '{}');
    localStorage.setItem('khazana_settings', JSON.stringify({
      ...currentSettings,
      theme: 'light',
      language
    }));
  }, [language]);

  const t = (key: keyof typeof translations['fa']) => {
    return translations[language][key] || translations['fa'][key];
  };

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      theme, setTheme, 
      shopInfo, setShopInfo, 
      logo, setLogo,
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
