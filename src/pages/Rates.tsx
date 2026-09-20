import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Coins, 
  Database, 
  Gem, 
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockDashboardData } from '../data/mockData';
import { useRates, Rate } from '../context/RatesContext';
import { useSettings } from '../context/SettingsContext';

const Rates: React.FC = () => {
  const { t, language } = useSettings();
  const isRtl = language !== 'en';
  const { rates, updateRate, refreshRates, addRate, deleteRate } = useRates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<'gold' | 'silver' | 'currency' | 'gemstone' | null>(null);
  
  // New Rate Form
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCurrency, setNewCurrency] = useState(t('afghani'));

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setEditValue(rate.value.toString());
  };

  const handleSave = async (id: string) => {
    await updateRate(id, parseFloat(editValue) || 0);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirm_delete'))) {
      await deleteRate(id);
      if (editingId === id) setEditingId(null);
    }
  };

  const handleAddRate = async () => {
    if (!newName || !newValue) return;
    
    await addRate({
      label: newName,
      value: parseFloat(newValue) || 0,
      currency: newCurrency,
      type: showAddModal!
    });
    
    setShowAddModal(null);
    setNewName('');
    setNewValue('');
    setNewCurrency(t('afghani'));
  };

  const RateCard = ({ type, title, icon: Icon, colorClass }: { 
    type: Rate['type'], 
    title: string, 
    icon: any,
    colorClass: string 
  }) => {
    const ratesArray = Array.isArray(rates) ? rates : [];
    const filteredRates = ratesArray.filter(r => r.type === type);
    
    return (
      <div className="bg-white rounded-2xl border border-kh-card/10 overflow-hidden shadow-sm flex flex-col h-full">
        <div className="p-5 border-b border-kh-card/5 flex items-center justify-between bg-kh-card/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
              <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <h3 className="text-lg font-bold text-kh-text">{title}</h3>
          </div>
          <button 
            onClick={() => setShowAddModal(type)}
            className="w-9 h-9 flex items-center justify-center bg-kh-card/5 hover:bg-kh-card/10 rounded-xl transition-all text-kh-text group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto bg-gray-50/30">
          {filteredRates.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {filteredRates.map((rate) => (
                <div 
                  key={rate.id} 
                  className="bg-white border border-kh-card/5 rounded-xl p-4 flex items-center justify-between group hover:border-kh-gold/30 hover:shadow-md transition-all"
                >
                  <div className={`space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-[10px] font-bold text-kh-text/40 uppercase tracking-tight">{t('description')}</p>
                    <h4 className="font-bold text-kh-text text-[15px]">{rate.label}</h4>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <p className="text-[10px] font-bold text-kh-text/40 uppercase tracking-tight">{t('price')}</p>
                      {editingId === rate.id ? (
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className={`w-20 h-7 px-2 text-xs font-bold border-b border-kh-gold focus:outline-none bg-kh-gold/5 ${isRtl ? 'text-right' : 'text-left'}`}
                            autoFocus
                          />
                          <span className="text-[10px] font-bold text-kh-gold">{rate.currency}</span>
                        </div>
                      ) : (
                        <div className={`flex items-baseline gap-1 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-black text-kh-text text-[17px] ltr">
                            {rate.value.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-kh-text/30">{rate.currency}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {editingId === rate.id ? (
                        <button 
                          onClick={() => handleSave(rate.id)}
                          className="w-8 h-8 flex items-center justify-center bg-green-500 text-kh-text rounded-lg shadow-sm hover:bg-green-600 transition-colors"
                        >
                          <Save size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEdit(rate)}
                          className="w-8 h-8 flex items-center justify-center bg-kh-card/5 text-kh-text/40 hover:text-kh-text hover:bg-kh-card/10 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(rate.id)}
                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 hover:text-kh-text hover:bg-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
              <Icon size={32} className="mb-2 text-kh-text/20" />
              <p className="text-xs font-bold text-kh-text/40">{t('no_items')}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold text-kh-text flex items-center gap-2">
            <TrendingUp className="text-kh-gold" size={24} />
            {t('rates')}
          </h2>
          <p className="text-kh-muted text-sm mt-1">{language === 'en' ? 'Manage gold, silver, gemstone, and currency rates' : (language === 'ps' ? 'د سرو زرو، سپینو زرو، قیمتي ډبرو او اسعارو نرخونه مدیریت کړئ' : 'مدیریت نرخ طلا، نقره، سنگ‌های قیمتی و اسعار')}</p>
        </div>
        <div className="bg-kh-card text-kh-text px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 border border-white/10">
          <CheckCircle2 size={14} className="text-kh-gold" />
          {t('last_updated')}: {t('just_now')}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RateCard 
          type="gold" 
          title={t('gold_rates')} 
          icon={Coins} 
          colorClass="bg-kh-gold" 
        />
        <RateCard 
          type="silver" 
          title={t('silver_rates')} 
          icon={Database} 
          colorClass="bg-gray-400" 
        />
        <RateCard 
          type="gemstone" 
          title={t('gemstones')} 
          icon={Gem} 
          colorClass="bg-blue-500" 
        />
        <RateCard 
          type="currency" 
          title={t('currency_rates')} 
          icon={Banknote} 
          colorClass="bg-green-600" 
        />
      </div>

      {/* Add Modal Overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(null)}
              className="absolute inset-0 bg-kh-card/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b border-kh-card/5 ${isRtl ? 'text-right' : 'text-left'}`}>
                <h3 className="text-xl font-bold text-kh-text">
                  {t('add_item')} {
                    showAddModal === 'gold' ? t('gold_rates') :
                    showAddModal === 'silver' ? t('silver_rates') :
                    showAddModal === 'currency' ? t('currency_rates') :
                    t('gemstones')
                  }
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className={`space-y-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs font-bold text-kh-text/60 mr-1">{t('description')}</label>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={
                      showAddModal === 'currency' ? (language === 'en' ? 'e.g. Dollar (USD)' : 'مثلاً: دالر (USD)') :
                      showAddModal === 'gemstone' ? (language === 'en' ? 'e.g. Diamond' : 'مثلاً: الماس') :
                      (language === 'en' ? 'e.g. 18 Carat' : 'مثلاً: ۱۸ عیار')
                    }
                    className={`w-full px-4 py-3 rounded-xl border border-kh-card/10 focus:outline-none focus:ring-2 focus:ring-kh-gold/50 transition-all font-medium text-kh-text ${isRtl ? 'text-right' : 'text-left'}`}
                  />
                </div>
                
                <div className={`space-y-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs font-bold text-kh-text/60 mr-1">{t('price')}</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 rounded-xl border border-kh-card/10 focus:outline-none focus:ring-2 focus:ring-kh-gold/50 transition-all font-bold text-kh-text ${isRtl ? 'text-right' : 'text-left'}`}
                    />
                    <div className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-2`}>
                      <select 
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-kh-text/40 focus:outline-none cursor-pointer"
                      >
                        <option value={t('afghani')}>AFN</option>
                        <option value="USD">USD</option>
                        <option value="IRT">IRT</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-kh-card/[0.02] flex gap-3">
                <button 
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-kh-card/10 text-kh-text font-bold hover:bg-kh-card/5 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleAddRate}
                  className="flex-1 py-3 px-4 rounded-xl bg-kh-card text-kh-text font-bold hover:bg-kh-card/90 transition-colors shadow-lg"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rates;
