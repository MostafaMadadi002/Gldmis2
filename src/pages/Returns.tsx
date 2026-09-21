import React, { useState, useRef, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  History,
  TrendingUp,
  Coins,
  Package,
  Flame,
  Camera,
  X,
  Scale,
  ArrowRightLeft,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/SettingsContext';
import { useRates } from '../context/RatesContext';
import { Product } from '../types';

const Returns: React.FC = () => {
  const toEnglishDigits = (str: string) => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /۷/g, /۸/g, /۹/g];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return result;
  };

  const { products, addProduct, removeProduct, countries, addCountry } = useInventory();
  const { rates } = useRates();
  const { t, language } = useSettings();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDestination, setFilterDestination] = useState<'all' | 'inventory' | 'melt'>('all');
  
  // Country & Stone state like Inventory
  const [isAddingNewOrigin, setIsAddingNewOrigin] = useState(false);
  const [isConfirmingOrigin, setIsConfirmingOrigin] = useState(false);
  const [isAddingNewStoneType, setIsAddingNewStoneType] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State matching Inventory + Conversion destination
  const initialFormData = {
    code: `SH-${Date.now().toString().slice(-4)}`,
    name: '',
    weight: '',
    material: 'gold' as 'gold' | 'silver' | 'jewelry',
    carat: '۱۸ عیار',
    stoneType: '',
    origin: language === 'en' ? 'Afghanistan' : 'افغانستان',
    quantity: '1',
    minQuantity: '1',
    purchasePrice: '', // قیمت خرید از مشتری
    sellingPrice: '', // در صورت ثبت برای انبار فروش
    secondHandDestination: 'inventory' as 'inventory' | 'melt',
    reason: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const isRtl = language !== 'en';

  // Origins & Stones
  const uniqueOrigins = useMemo(() => {
    const list = countries.map(c => c.name);
    const existing = Array.from(new Set(products.map(p => p.origin).filter(Boolean))) as string[];
    return Array.from(new Set([...list, ...existing]));
  }, [countries, products]);

  const uniqueStoneTypes = useMemo(() => {
    return Array.from(new Set(products.map(p => p.stoneType).filter(Boolean))) as string[];
  }, [products]);

  const handleOpenModal = () => {
    setFormData({
      ...initialFormData,
      code: `SH-${Date.now().toString().slice(-4)}`,
      origin: uniqueOrigins[0] || (language === 'en' ? 'Afghanistan' : 'افغانستان')
    });
    setSelectedImage(null);
    setIsAddingNewOrigin(false);
    setIsAddingNewStoneType(false);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert digits if it's a numeric field
    const processedValue = ['weight', 'quantity', 'minQuantity', 'purchasePrice', 'sellingPrice'].includes(name) 
      ? toEnglishDigits(value) 
      : value;

    if (name === 'origin' && processedValue === 'ADD_NEW_ORIGIN') {
      setIsAddingNewOrigin(true);
      setFormData(prev => ({ ...prev, origin: '' }));
      return;
    }
    if (name === 'stoneType' && processedValue === 'ADD_NEW_STONE') {
      setIsAddingNewStoneType(true);
      setFormData(prev => ({ ...prev, stoneType: '' }));
      return;
    }
    if (name === 'material') {
      const newMaterial = processedValue as 'gold' | 'silver' | 'jewelry';
      if (newMaterial !== 'gold') {
        setFormData(prev => ({ ...prev, material: newMaterial, secondHandDestination: 'inventory' }));
      } else {
        setFormData(prev => ({ ...prev, material: newMaterial }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleConfirmNewOrigin = async () => {
    if (!formData.origin.trim()) return;
    setIsConfirmingOrigin(true);
    try {
      await addCountry(formData.origin.trim());
      setIsAddingNewOrigin(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirmingOrigin(false);
    }
  };

  const handleConfirmNewStone = () => {
    if (formData.stoneType.trim()) {
      setIsAddingNewStoneType(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.weight) {
      alert(t('fill_all_fields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedWeight = parseFloat(formData.weight) || 0;
      const parsedPurchasePrice = formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined;
      const parsedSellingPrice = formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined;

      const newProduct: any = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        weight: parsedWeight,
        material: formData.material,
        carat: formData.material !== 'jewelry' ? formData.carat : undefined,
        stoneType: formData.material === 'jewelry' ? formData.stoneType : undefined,
        origin: formData.origin || (language === 'en' ? 'Afghanistan' : 'افغانستان'),
        quantity: parseInt(formData.quantity) || 1,
        minQuantity: parseInt(formData.minQuantity) || 1,
        price: parsedSellingPrice,
        purchasePrice: parsedPurchasePrice,
        image: selectedImage || undefined,
        isReturned: true, // نشانگر آیتم دست دوم
        secondHandDestination: formData.secondHandDestination,
      };

      await addProduct(newProduct);
      setIsModalOpen(false);
      alert(t('item_returned_success'));
    } catch (err) {
      console.error('Failed to submit second hand purchase:', err);
      alert(language === 'en' ? 'Error recording second-hand purchase' : 'خطا در ثبت خرید دست دوم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'en' ? 'Are you sure you want to delete this purchase record?' : 'آیا از حذف این رکورد خرید دست دوم اطمینان دارید؟')) {
      try {
        await removeProduct(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter second-hand products
  const secondHandProducts = useMemo(() => {
    return products.filter((p: any) => p.isReturned || p.secondHandDestination);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return secondHandProducts.filter((p: any) => {
      const matchesSearch = 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.carat && p.carat.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDest = 
        filterDestination === 'all' || 
        (filterDestination === 'inventory' && p.secondHandDestination === 'inventory') ||
        (filterDestination === 'melt' && p.secondHandDestination === 'melt');

      return matchesSearch && matchesDest;
    });
  }, [secondHandProducts, searchQuery, filterDestination]);

  // Calculations for cards
  const stats = useMemo(() => {
    const totalCount = secondHandProducts.length;
    const inventoryCount = secondHandProducts.filter((p: any) => p.secondHandDestination === 'inventory').length;
    const meltCount = secondHandProducts.filter((p: any) => p.secondHandDestination === 'melt').length;
    
    const meltGoldWeight = secondHandProducts
      .filter((p: any) => p.material === 'gold' && p.secondHandDestination === 'melt')
      .reduce((sum, p: any) => sum + (Number(p.weight) || 0) * (Number(p.quantity) || 1), 0);

    const recycledDeductedWeight = products
      .filter((p: any) => p.material === 'gold' && (p.deductFromMelt || p.deduct_from_melt) && p.secondHandDestination !== 'melt' && p.second_hand_destination !== 'melt')
      .reduce((sum, p: any) => sum + (Number(p.weight) || 0) * (Number(p.quantity) || 1), 0);

    const netMeltWeight = Math.max(0, meltGoldWeight - recycledDeductedWeight);

    const totalPaid = secondHandProducts.reduce((sum, p: any) => sum + (Number(p.purchasePrice) || Number(p.price) || 0), 0);

    return {
      totalCount,
      inventoryCount,
      meltCount,
      meltGoldWeight,
      recycledDeductedWeight,
      netMeltWeight,
      totalPaid
    };
  }, [secondHandProducts, products]);

  return (
    <div className={`space-y-6 pb-12 ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-black text-kh-text dark:text-kh-gold flex items-center gap-3">
            <div className="p-2.5 bg-kh-gold/10 rounded-2xl border border-kh-gold/20">
              <ShoppingBag className="text-kh-gold" size={24} />
            </div>
            {language === 'en' ? 'Second-hand Purchases & Buyback' : 'خرید دست دوم و آب‌شده'}
          </h2>
          <p className="text-xs text-kh-muted mt-1 font-medium">
            {language === 'en' 
              ? 'Purchase used gold & silver from customers with conversion to inventory or melt reserve' 
              : 'ثبت خرید طلای مستعمل از مشتریان با قابلیت تفکیک برای انبار فروش یا ذوب و شمش‌سازی'}
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-5 py-3 bg-kh-gold text-black dark:text-black font-black text-xs rounded-xl shadow-lg shadow-kh-gold/20 hover:bg-kh-gold/90 transition-all cursor-pointer"
        >
          <Plus size={18} />
          {language === 'en' ? 'New Second-hand Purchase' : 'خرید دست دوم جدید'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-kh-muted block">{language === 'en' ? 'Total Purchases' : 'کل خریدهای دست دوم'}</span>
            <span className="text-xl font-black text-kh-text dark:text-kh-gold">{stats.totalCount} <span className="text-xs text-kh-muted">{t('items')}</span></span>
          </div>
        </div>

        {/* For Resale */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-kh-muted block">{language === 'en' ? 'For Resale Stock' : 'ثبت برای انبار فروش'}</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.inventoryCount} <span className="text-xs text-kh-muted">{t('items')}</span></span>
          </div>
        </div>

        {/* For Melting */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-kh-muted block">{t('melted_gold')}</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {stats.netMeltWeight.toFixed(2)} <span className="text-xs font-bold">{t('gram')}</span>
            </span>
            {stats.recycledDeductedWeight > 0 && (
              <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 block font-medium mt-0.5">
                {language === 'en'
                  ? `-${stats.recycledDeductedWeight.toFixed(2)}g crafted into stock`
                  : `(-${stats.recycledDeductedWeight.toFixed(2)} گرم کسر برای انبار)`}
              </span>
            )}
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-kh-gold/10 text-kh-gold rounded-xl">
            <Coins size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-kh-muted block">{language === 'en' ? 'Total Buyback Value' : 'مجموع بهای پرداختی'}</span>
            <span className="text-xl font-black text-kh-text dark:text-kh-gold">
              {stats.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-kh-muted">{t('afghani')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-kh-card/5 dark:border-dark-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 bg-kh-bg/50 dark:bg-black/10 px-3.5 py-2 rounded-xl border border-kh-card/10 dark:border-dark-border">
          <Search className="text-kh-muted" size={18} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by code, product name, carat...' : 'جستجو بر اساس کد، نام کالا، عیار...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs font-bold focus:outline-none text-kh-text dark:text-dark-text"
          />
        </div>

        {/* Destination Filter Tabs */}
        <div className="flex bg-kh-bg/50 dark:bg-black/20 p-1 rounded-xl border border-kh-card/10 dark:border-dark-border self-start md:self-auto">
          <button
            onClick={() => setFilterDestination('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              filterDestination === 'all'
                ? 'bg-kh-card dark:bg-kh-gold text-white dark:text-black shadow-sm'
                : 'text-kh-muted hover:text-kh-text'
            }`}
          >
            {language === 'en' ? 'All Records' : 'همه خریدهای دست دوم'} ({secondHandProducts.length})
          </button>
          <button
            onClick={() => setFilterDestination('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              filterDestination === 'inventory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-kh-muted hover:text-kh-text'
            }`}
          >
            <Package size={14} />
            {language === 'en' ? 'For Resale' : 'انبار فروش'} ({stats.inventoryCount})
          </button>
          <button
            onClick={() => setFilterDestination('melt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              filterDestination === 'melt'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-kh-muted hover:text-kh-text'
            }`}
          >
            <Flame size={14} />
            {language === 'en' ? 'For Melting' : 'مخصوص ذوب'} ({stats.meltCount})
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-kh-card/5 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="text-kh-gold" size={20} />
            <h3 className="text-base font-black text-kh-text dark:text-kh-gold">
              {language === 'en' ? 'Second-hand Purchase Records' : 'لیست و وضعیت اقلام دست دوم خریداری شده'}
            </h3>
          </div>
          <span className="text-xs text-kh-muted font-bold">{filteredProducts.length} {t('items')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="text-[11px] font-black text-kh-muted uppercase tracking-wider bg-kh-bg/40 dark:bg-black/10 border-b border-kh-card/5 dark:border-dark-border">
                <th className="py-4 px-5">{t('code')}</th>
                <th className="py-4 px-5">{t('product_name')}</th>
                <th className="py-4 px-5">{t('material')} / {t('carat')}</th>
                <th className="py-4 px-5">{t('weight')}</th>
                <th className="py-4 px-5">{language === 'en' ? 'Buy Price' : 'قیمت خرید'}</th>
                <th className="py-4 px-5">{language === 'en' ? 'Conversion Action' : 'تبدیل / مقصد'}</th>
                <th className="py-4 px-5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kh-card/5 dark:divide-dark-border text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-kh-muted font-bold">
                    <div className="max-w-xs mx-auto space-y-2">
                      <ShoppingBag className="mx-auto text-kh-muted/40" size={36} />
                      <p>{t('no_items')}</p>
                      <button
                        onClick={handleOpenModal}
                        className="text-kh-gold text-xs font-bold hover:underline"
                      >
                        + {language === 'en' ? 'Add first second-hand purchase' : 'ثبت اولین خرید دست دوم'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const isMelt = p.secondHandDestination === 'melt';
                  return (
                    <tr key={p.id} className="hover:bg-kh-bg/20 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5 font-black text-kh-text dark:text-kh-gold flex items-center gap-2">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-kh-card/10 dark:border-dark-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-kh-gold/10 flex items-center justify-center text-kh-gold font-black text-[10px]">
                            {p.material === 'gold' ? 'Au' : p.material === 'silver' ? 'Ag' : 'Jw'}
                          </div>
                        )}
                        <span>{p.code}</span>
                      </td>
                      <td className="py-4 px-5 font-bold text-kh-text dark:text-dark-text">{p.name}</td>
                      <td className="py-4 px-5 text-kh-muted font-medium">
                        <span className="font-bold text-kh-text dark:text-dark-text">
                          {p.material === 'gold' ? t('gold') : p.material === 'silver' ? t('silver') : t('jewelry')}
                        </span>
                        {(p.carat || p.stoneType) && (
                          <span className="text-[11px] block text-kh-muted">{p.carat || p.stoneType}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-black text-kh-text dark:text-dark-text">
                        {Number(p.weight || 0).toFixed(2)} {p.material === 'jewelry' ? t('carat') : t('gram')}
                      </td>
                      <td className="py-4 px-5 font-black text-kh-text dark:text-kh-gold">
                        {p.purchasePrice !== undefined && p.purchasePrice !== null
                          ? `${Number(p.purchasePrice).toLocaleString()} ${t('afghani')}`
                          : p.price 
                            ? `${Number(p.price).toLocaleString()} ${t('afghani')}` 
                            : '-'}
                      </td>
                      <td className="py-4 px-5">
                        {isMelt ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Flame size={12} className="text-amber-500" />
                            {t('destination_melt')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Package size={12} className="text-emerald-500" />
                            {t('destination_inventory')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleDelete(p.id)}
                          title={language === 'en' ? 'Delete record' : 'حذف رکورد'}
                          className="p-1.5 text-kh-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECOND HAND REGISTRATION MODAL (EXACTLY LIKE INVENTORY REGISTRATION) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl shadow-2xl border border-kh-card/10 dark:border-dark-border overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-kh-card/5 dark:border-dark-border flex justify-between items-center bg-kh-bg/20 dark:bg-black/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-kh-gold/10 text-kh-gold rounded-xl">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-kh-text dark:text-kh-gold">
                    {language === 'en' ? 'Second-hand Purchase Registration' : 'ثبت خرید دست دوم (مشابه فرم انبار)'}
                  </h3>
                  <p className="text-[11px] text-kh-muted">
                    {language === 'en' ? 'Enter item specs and select destination (Resale or Melt)' : 'اطلاعات کالا را وارد کرده و تعیین کنید برای فروش یا برای ذوب ثبت شود'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-kh-muted hover:text-kh-text dark:hover:text-white rounded-xl hover:bg-kh-card/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Image Upload */}
                <div className="flex justify-center">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-kh-card/10 dark:border-dark-border flex flex-col items-center justify-center text-kh-text/40 hover:border-kh-gold hover:text-kh-gold transition-all cursor-pointer bg-kh-bg/30 dark:bg-black/20 relative overflow-hidden group shadow-inner"
                  >
                    {selectedImage ? (
                      <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={26} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] mt-1.5 font-bold">{language === 'en' ? 'Item Photo' : 'عکس کالا'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* TWO-WAY CONVERSION DESTINATION SELECTOR (قسمت تبدیل) */}
                <div className="space-y-2">
                  <label className={`text-xs font-black text-kh-text dark:text-kh-gold flex items-center gap-1.5 ${isRtl ? 'pr-1' : 'pl-1'}`}>
                    <ArrowRightLeft size={14} className="text-kh-gold" />
                    {t('second_hand_destination')} <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Inventory for Resale */}
                    <div 
                      onClick={() => setFormData(prev => ({ ...prev, secondHandDestination: 'inventory' }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        formData.secondHandDestination === 'inventory'
                          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                          : 'border-kh-card/10 dark:border-dark-border hover:border-kh-card/20'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        formData.secondHandDestination === 'inventory' ? 'bg-emerald-500 text-white' : 'bg-kh-bg/80 text-kh-muted dark:bg-black/20'
                      }`}>
                        <Package size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-kh-text dark:text-dark-text">
                            {t('destination_inventory')}
                          </span>
                          {formData.secondHandDestination === 'inventory' && (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          )}
                        </div>
                        <p className="text-[10px] text-kh-muted mt-1 leading-relaxed">
                          {t('destination_inventory_desc')}
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Send to Melt - ONLY FOR GOLD */}
                    {formData.material === 'gold' && (
                      <div 
                        onClick={() => setFormData(prev => ({ ...prev, secondHandDestination: 'melt' }))}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          formData.secondHandDestination === 'melt'
                            ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                            : 'border-kh-card/10 dark:border-dark-border hover:border-kh-card/20'
                        }`}
                      >
                        <div className={`p-2 rounded-xl mt-0.5 ${
                          formData.secondHandDestination === 'melt' ? 'bg-amber-500 text-white' : 'bg-kh-bg/80 text-kh-muted dark:bg-black/20'
                        }`}>
                          <Flame size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-kh-text dark:text-dark-text">
                              {t('destination_melt')}
                            </span>
                            {formData.secondHandDestination === 'melt' && (
                              <CheckCircle2 size={16} className="text-amber-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-kh-muted mt-1 leading-relaxed">
                            {t('destination_melt_desc')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Inputs Grid (Identical to Inventory Form) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Code */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('code')}</label>
                    <input 
                      required
                      name="code"
                      type="text" 
                      autoComplete="off"
                      placeholder="SH-101"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text font-bold"
                      value={formData.code}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{language === 'en' ? 'Name' : 'نام کالا'}</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      autoComplete="off"
                      placeholder={language === 'en' ? 'e.g. Second-hand Gold Bangle' : 'مثلاً: النگوی طلای دست دوم'}
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('weight')} ({t('gram')})</label>
                    <input 
                      required
                      name="weight"
                      type="text" 
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text font-bold"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Material */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{language === 'en' ? 'Material' : 'جنس کالا'}</label>
                    <select 
                      required
                      name="material"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text cursor-pointer"
                      value={formData.material}
                      onChange={handleInputChange}
                    >
                      <option value="gold">{t('gold')}</option>
                      <option value="silver">{t('silver')}</option>
                      <option value="jewelry">{t('jewelry')}</option>
                    </select>
                  </div>

                  {/* Carat (Gold) */}
                  {formData.material === 'gold' && (
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('carat')}</label>
                      <select 
                        name="carat"
                        className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                        value={formData.carat}
                        onChange={handleInputChange}
                      >
                        {rates.filter(r => r.type === 'gold').length > 0 ? (
                          rates.filter(r => r.type === 'gold').map(r => (
                            <option key={r.id} value={r.label}>{r.label}</option>
                          ))
                        ) : (
                          <>
                            <option value="۲۴ عیار">۲۴ عیار</option>
                            <option value="۲۲ عیار">۲۲ عیار</option>
                            <option value="۲۱ عیار">۲۱ عیار</option>
                            <option value="۱۸ عیار">۱۸ عیار</option>
                            <option value="۱۴ عیار">۱۴ عیار</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Carat (Silver) */}
                  {formData.material === 'silver' && (
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('carat')}</label>
                      <select 
                        name="carat"
                        className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                        value={formData.carat}
                        onChange={handleInputChange}
                      >
                        {rates.filter(r => r.type === 'silver').length > 0 ? (
                          rates.filter(r => r.type === 'silver').map(r => (
                            <option key={r.id} value={r.label}>{r.label}</option>
                          ))
                        ) : (
                          <>
                            <option value="۹۹۹ عیار">۹۹۹ عیار</option>
                            <option value="۹۲۵ عیار">۹۲۵ عیار</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Stone (Jewelry) */}
                  {formData.material === 'jewelry' && (
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('carat')}</label>
                      {isAddingNewStoneType ? (
                        <div className="flex gap-2">
                          <input 
                            autoFocus
                            name="stoneType"
                            type="text" 
                            autoComplete="off"
                            placeholder={language === 'en' ? 'Stone Name...' : 'نام سنگ...'}
                            className="flex-1 bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                            value={formData.stoneType}
                            onChange={handleInputChange}
                          />
                          <button 
                            type="button"
                            onClick={handleConfirmNewStone}
                            className="bg-kh-gold text-black px-2 rounded-lg text-[10px] font-bold hover:bg-kh-gold/80 transition-colors"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <select 
                          name="stoneType"
                          className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                          value={formData.stoneType}
                          onChange={handleInputChange}
                        >
                          <option value="">{language === 'en' ? 'Select Stone...' : 'انتخاب سنگ...'}</option>
                          {uniqueStoneTypes.length > 0 ? (
                            uniqueStoneTypes.map(stone => (
                              <option key={stone} value={stone}>{stone}</option>
                            ))
                          ) : (
                            <>
                              <option value="عقیق">عقیق</option>
                              <option value="فیروزه">فیروزه</option>
                              <option value="لاجورد">لاجورد</option>
                            </>
                          )}
                          <option value="ADD_NEW_STONE" className="font-bold text-kh-gold">+ {language === 'en' ? 'Add New Stone...' : 'افزودن سنگ جدید...'}</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Origin */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{language === 'en' ? 'Origin' : 'ساخت کشور'}</label>
                    {isAddingNewOrigin ? (
                      <div className="flex gap-1">
                        <input 
                          autoFocus
                          name="origin"
                          type="text" 
                          autoComplete="off"
                          placeholder={language === 'en' ? 'Country Name...' : 'نام کشور را بنویسید...'}
                          className="flex-1 bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                          value={formData.origin}
                          onChange={handleInputChange}
                        />
                        <button 
                          type="button"
                          disabled={isConfirmingOrigin}
                          onClick={handleConfirmNewOrigin}
                          className="bg-kh-gold text-black px-2 rounded-lg text-[10px] font-bold hover:bg-kh-gold/80 transition-colors disabled:opacity-50"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <select 
                        name="origin"
                        className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                        value={formData.origin}
                        onChange={handleInputChange}
                      >
                        <option value="">{language === 'en' ? 'Select Country...' : 'انتخاب کشور...'}</option>
                        {uniqueOrigins.map(origin => (
                          <option key={origin} value={origin}>{origin}</option>
                        ))}
                        <option value="ADD_NEW_ORIGIN" className="font-bold text-kh-gold">+ {language === 'en' ? 'Add New Country...' : 'افزودن کشور جدید...'}</option>
                      </select>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('quantity')}</label>
                    <input 
                      required
                      name="quantity"
                      type="text" 
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="1"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text font-bold"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Purchase Price (مبلغ خرید از مشتری) */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                      {t('purchase_price_label')} ({t('afghani')})
                    </label>
                    <input 
                      name="purchasePrice"
                      type="text" 
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text font-bold"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Selling price if registered for inventory */}
                  {formData.secondHandDestination === 'inventory' && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                        {language === 'en' ? 'Resale / Selling Price in Shop (Optional)' : 'قیمت فروش در فروشگاه (اختیاری)'} ({t('afghani')})
                      </label>
                      <input 
                        name="sellingPrice"
                        type="text" 
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                        value={formData.sellingPrice}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {/* Notes / Reason */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                      {language === 'en' ? 'Notes / Purity Test / Customer' : 'توضیحات عیارسنجی یا مشتری'}
                    </label>
                    <input 
                      name="reason"
                      type="text" 
                      autoComplete="off"
                      placeholder={language === 'en' ? 'Details, purity remarks...' : 'توضیحات تکمیلی، نحوه تسویه یا مشخصات عیار...'}
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.reason}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/20 flex gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-2.5 bg-kh-gold text-black rounded-xl text-xs font-black hover:bg-kh-gold/90 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {language === 'en' ? 'Save Second-hand Purchase' : 'ثبت خرید دست دوم'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-kh-card/10 dark:border-dark-border rounded-xl text-xs font-bold text-kh-text dark:text-kh-gold hover:bg-kh-card/5 transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
