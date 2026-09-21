import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Maximize, 
  Minimize,
  Package,
  Diamond,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/SettingsContext';
import { useRates } from '../context/RatesContext';
import api from '../lib/api';

const PromotionalShowroom: React.FC = () => {
  const { products } = useInventory();
  const { rates } = useRates();
  const { t, language } = useSettings();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const isRtl = language !== 'en';

  // Filter only active products with quantity > 0
  const activeProducts = useMemo(() => {
    return products.filter(p => !p.isReturned && p.quantity > 0);
  }, [products]);

  const currentProduct = activeProducts[currentIndex];

  const currentPrice = useMemo(() => {
    if (!currentProduct) return 0;
    
    let unitPrice = 0;
    if (currentProduct.material === 'jewelry') {
      unitPrice = Number(currentProduct.price || 0);
    } else {
      // Find rate by label (e.g. "۱۸ عیار")
      const matchingRate = rates.find(r => r.label === currentProduct.carat);
      unitPrice = matchingRate ? Number(matchingRate.value) : Number(currentProduct.price || 0);
    }

    const weight = Number(currentProduct.weight || 0);
    const total = currentProduct.material === 'jewelry' ? unitPrice : (unitPrice * weight);
    return total;
  }, [currentProduct, rates]);

  useEffect(() => {
    let interval: any;
    if (isAutoPlaying && activeProducts.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeProducts.length]);

  const handleClose = () => {
    window.close();
    // Fallback if window.close is blocked by browser
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (activeProducts.length === 0) {
    return (
      <div className="min-h-screen bg-kh-bg dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
        <Package size={64} className="text-kh-gold/20 mb-4" />
        <h2 className="text-2xl font-black text-kh-text dark:text-kh-gold">
          {language === 'en' ? 'No products to display' : 'محصولی برای نمایش وجود ندارد'}
        </h2>
        <button 
          onClick={handleClose}
          className="mt-6 px-8 py-3 bg-kh-gold text-black rounded-2xl font-black"
        >
          {t('back')}
        </button>
      </div>
    );
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + activeProducts.length) % activeProducts.length);

  return (
    <div className={`fixed inset-0 z-[100] bg-white dark:bg-black overflow-hidden flex flex-col ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Controls */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <button 
          onClick={handleClose}
          className="p-3 bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-2xl text-kh-text dark:text-white hover:bg-rose-500 hover:text-white transition-all pointer-events-auto"
        >
          <X size={24} />
        </button>
        
        <div className="flex gap-3 pointer-events-auto">
          <button 
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-4 py-2 rounded-xl font-black text-sm backdrop-blur-md transition-all ${
              isAutoPlaying ? 'bg-kh-gold text-black' : 'bg-black/10 dark:bg-white/10 text-kh-text dark:text-white'
            }`}
          >
            {isAutoPlaying ? (language === 'en' ? 'Auto-play ON' : 'پخش خودکار روشن') : (language === 'en' ? 'Auto-play OFF' : 'پخش خودکار خاموش')}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-2xl text-kh-text dark:text-white hover:bg-kh-gold hover:text-black transition-all"
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>

      {/* Main Content - Slideshow */}
      <div className="relative flex-1 flex items-center justify-center p-6 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentProduct.id}
            initial={{ opacity: 0, x: isRtl ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 50 : -50 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Image Section */}
            <div className="relative aspect-square bg-kh-bg dark:bg-white/5 rounded-[40px] overflow-hidden shadow-2xl border border-kh-gold/10">
              {currentProduct.image ? (
                <img 
                  src={currentProduct.image.startsWith('data:') || currentProduct.image.startsWith('http') ? currentProduct.image : `${api.defaults.baseURL?.replace('/api', '')}${currentProduct.image}`} 
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={120} className="text-kh-gold/20" />
                </div>
              )}
              
              <div className="absolute bottom-6 inset-x-6">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={14} className="text-kh-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Product Code' : 'کد محصول'}</span>
                  </div>
                  <p className="text-xl font-black">{currentProduct.code}</p>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col gap-8">
              <div>
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-1.5 bg-kh-gold/10 text-kh-gold rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-kh-gold/20"
                >
                  {currentProduct.material === 'gold' ? (language === 'en' ? 'Gold Collection' : 'مجموعه طلا') : 
                   currentProduct.material === 'silver' ? (language === 'en' ? 'Silver Collection' : 'مجموعه نقره') : 
                   (language === 'en' ? 'Jewelry Collection' : 'مجموعه جواهرات')}
                </motion.span>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-6xl font-black text-kh-text dark:text-white leading-tight"
                >
                  {currentProduct.name}
                </motion.h1>
              </div>

              {/* Specs Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-kh-bg dark:bg-white/5 p-6 rounded-3xl border border-kh-gold/5 flex flex-col gap-1">
                  <span className="text-xs text-kh-muted font-bold uppercase">{t('weight')}</span>
                  <span className="text-2xl font-black text-kh-text dark:text-kh-gold">{currentProduct.weight} <span className="text-sm font-normal">{t('gram')}</span></span>
                </div>
                <div className="bg-kh-bg dark:bg-white/5 p-6 rounded-3xl border border-kh-gold/5 flex flex-col gap-1">
                  <span className="text-xs text-kh-muted font-bold uppercase">{currentProduct.material === 'jewelry' ? (language === 'en' ? 'Stone' : 'نوع سنگ') : (language === 'en' ? 'Carat' : 'عیار')}</span>
                  <span className="text-2xl font-black text-kh-text dark:text-kh-gold">{currentProduct.carat || currentProduct.stoneType || '—'}</span>
                </div>
                <div className="bg-kh-bg dark:bg-white/5 p-6 rounded-3xl border border-kh-gold/5 flex flex-col gap-1 col-span-2">
                  <span className="text-xs text-kh-muted font-bold uppercase">{language === 'en' ? 'Origin' : 'سازنده / مبدا'}</span>
                  <span className="text-2xl font-black text-kh-text dark:text-kh-gold">{currentProduct.origin || currentProduct.country_name || '—'}</span>
                </div>
              </motion.div>

              {/* Price Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-kh-gold text-black p-8 rounded-[32px] shadow-2xl relative overflow-hidden group"
              >
                <Diamond className="absolute -right-4 -bottom-4 text-black/5 w-32 h-32 rotate-12 transition-transform group-hover:scale-110" />
                <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">{language === 'en' ? 'Current Market Price' : 'قیمت روز بازار'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black">
                    {Math.round(currentPrice).toLocaleString()}
                  </span>
                  <span className="text-xl font-bold">{t('afghani')}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className={`absolute ${isRtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 p-4 bg-kh-bg dark:bg-white/10 rounded-full text-kh-text dark:text-white hover:bg-kh-gold hover:text-black transition-all shadow-xl z-10 hidden md:flex`}
        >
          <ChevronLeft size={32} className={isRtl ? 'rotate-180' : ''} />
        </button>
        <button 
          onClick={nextSlide}
          className={`absolute ${isRtl ? 'left-6' : 'right-6'} top-1/2 -translate-y-1/2 p-4 bg-kh-bg dark:bg-white/10 rounded-full text-kh-text dark:text-white hover:bg-kh-gold hover:text-black transition-all shadow-xl z-10 hidden md:flex`}
        >
          <ChevronRight size={32} className={isRtl ? 'rotate-180' : ''} />
        </button>
      </div>

      {/* Footer Progress */}
      <div className="h-2 bg-kh-bg dark:bg-white/5 relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / activeProducts.length) * 100}%` }}
          className="absolute inset-y-0 left-0 bg-kh-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
        />
        <div className="absolute top-4 inset-x-0 flex justify-center gap-1">
          {activeProducts.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-kh-gold' : 'w-2 bg-kh-muted/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Progress Info */}
      <div className="p-6 text-center text-xs font-black text-kh-muted uppercase tracking-widest">
        {currentIndex + 1} / {activeProducts.length} — {language === 'en' ? 'Showroom Mode' : 'حالت ویترین نمایشگاهی'}
      </div>
    </div>
  );
};

export default PromotionalShowroom;
