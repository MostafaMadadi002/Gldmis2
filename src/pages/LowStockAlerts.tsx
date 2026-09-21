import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Package, 
  RefreshCcw,
  Search,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/SettingsContext';

const LowStockAlerts: React.FC = () => {
  const { products, isLoading } = useInventory();
  const { t, language } = useSettings();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isRtl = language !== 'en';

  const lowStockProducts = useMemo(() => {
    return products.filter(p => !p.isReturned && p.quantity <= (p.minQuantity || 1));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return lowStockProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lowStockProducts, searchQuery]);

  return (
    <div className={`space-y-6 pb-12 ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-kh-muted hover:text-kh-gold transition-colors mb-2 text-sm font-bold"
          >
            <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
            {t('back')}
          </button>
          <h2 className="text-2xl font-black text-kh-text dark:text-kh-gold flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
            {language === 'en' ? 'Low Stock Alerts' : 'هشدارهای موجودی کم'}
          </h2>
          <p className="text-sm text-kh-muted mt-1">
            {language === 'en' 
              ? `There are ${lowStockProducts.length} items that need restocking.` 
              : `${lowStockProducts.length} قلم کالا نیاز به شارژ مجدد دارند.`}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-2xl p-1 shadow-sm">
          <div className="relative flex-1 sm:w-64">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-kh-muted`} size={18} />
            <input 
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent border-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm font-bold focus:outline-none text-kh-text dark:text-dark-text`}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-3xl border border-kh-card/5 dark:border-dark-border p-20 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-6 bg-emerald-500/10 rounded-full">
            <Package size={48} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-kh-text dark:text-dark-text">
            {language === 'en' ? 'Stock is sufficient' : 'موجودی انبار کافی است'}
          </h3>
          <p className="text-sm text-kh-muted max-w-xs">
            {language === 'en' 
              ? 'All items are currently above their minimum quantity levels.' 
              : 'در حال حاضر تمامی اجناس بالاتر از حدِ حداقل موجودی هستند.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              className="bg-white dark:bg-dark-card border-2 border-rose-500/20 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                  {language === 'en' ? 'RESTOCK' : 'نیاز به شارژ'}
                </span>
              </div>

              <div className="flex gap-5 items-start">
                <div className="w-24 h-24 bg-kh-bg dark:bg-black/20 rounded-2xl flex items-center justify-center shrink-0 border border-kh-card/5 overflow-hidden group-hover:border-kh-gold/30 transition-all">
                  {product.image ? (
                    <img 
                      src={product.image.startsWith('data:') || product.image.startsWith('http') ? product.image : `${api.defaults.baseURL?.replace('/api', '')}${product.image}`} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package size={32} className="text-kh-gold/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-black text-kh-text dark:text-dark-text truncate leading-tight">{product.name}</h4>
                  <p className="text-sm font-bold text-kh-muted mt-1">{product.code}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-kh-muted font-bold uppercase tracking-tighter">{t('material')}</span>
                      <span className="text-xs font-black text-kh-text dark:text-kh-gold">
                        {product.material === 'gold' ? (language === 'en' ? 'Gold' : 'طلا') : 
                         product.material === 'silver' ? (language === 'en' ? 'Silver' : 'نقره') : 
                         (language === 'en' ? 'Jewelry' : 'جواهر')}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-kh-card/10 dark:bg-white/10 mx-1"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-kh-muted font-bold uppercase tracking-tighter">{t('weight')}</span>
                      <span className="text-xs font-black text-kh-text dark:text-kh-gold">{product.weight} {t('gram')}</span>
                    </div>
                    <div className="w-px h-6 bg-kh-card/10 dark:bg-white/10 mx-1"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-kh-muted font-bold uppercase tracking-tighter">{language === 'en' ? 'Origin' : 'سازنده'}</span>
                      <span className="text-xs font-black text-kh-text dark:text-kh-gold truncate max-w-[80px]">{product.origin || product.country_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-rose-50 dark:bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase leading-none mb-1">{t('quantity')}</p>
                      <p className="text-2xl font-black text-rose-700 dark:text-rose-300 leading-none">{product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-kh-muted uppercase leading-none mb-1">{language === 'en' ? 'Minimum' : 'حداقل'}</p>
                      <p className="text-base font-black text-kh-text dark:text-kh-gold leading-none">{product.minQuantity || 1}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-kh-card/5 flex gap-2">
                <button 
                  onClick={() => navigate('/inventory')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-kh-gold/10 text-kh-gold rounded-xl font-black text-xs hover:bg-kh-gold/20 transition-all"
                >
                  <RefreshCcw size={14} />
                  {language === 'en' ? 'Update Stock' : 'بروزرسانی انبار'}
                </button>
                <button 
                  onClick={() => navigate('/pos')}
                  className="p-2.5 bg-kh-bg dark:bg-white/5 text-kh-muted hover:text-kh-gold rounded-xl transition-all"
                >
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;
