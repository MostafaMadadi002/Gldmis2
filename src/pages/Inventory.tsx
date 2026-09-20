import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  Package, 
  X,
  Camera,
  Layers,
  Scale,
  Edit,
  Trash2,
  Banknote,
  ShoppingCart,
  Flame,
  AlertCircle,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useRates } from '../context/RatesContext';
import { useSettings } from '../context/SettingsContext';
import { Product } from '../types';

const ProductImage: React.FC<{ src?: string, alt: string, className?: string, fallback?: string | null }> = ({ src, alt, className, fallback }) => {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-kh-bg/20 ${className}`}>
        <div className="relative w-full h-full flex items-center justify-center p-2">
          <img 
            src={fallback || "/logo.png"} 
            alt="Logo" 
            className="w-full h-full object-contain" 
            onError={(e) => {
              (e.target as any).style.display = 'none';
              const parent = (e.target as any).parentElement;
              if (parent && !parent.querySelector('.gem-placeholder')) {
                const div = document.createElement('div');
                div.className = 'gem-placeholder flex items-center justify-center';
                div.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="text-kh-gold/30">
                    <path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l3 13 3-13-3-6Z"/><path d="M2 9h20"/>
                  </svg>
                `;
                parent.appendChild(div);
              }
            }} 
          />
        </div>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} />;
};

const Inventory: React.FC = () => {
  const { products, addProduct, updateProduct, removeProduct, countries, addCountry, isLoading: isInventoryLoading, restoreDefaultSampleData } = useInventory();
  const { rates, isLoading: isRatesLoading } = useRates();
  const { logo, t, language } = useSettings();
  const isLoading = isInventoryLoading || isRatesLoading;
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const isRtl = language !== 'en';
  
  // Form State
  const initialFormState = {
    code: '',
    name: '',
    weight: '',
    material: 'gold' as 'gold' | 'silver' | 'jewelry',
    carat: language === 'en' ? '18 Carat' : '۱۸ عیار',
    stoneType: language === 'en' ? 'Agate' : 'عقیق',
    origin: language === 'en' ? 'Afghanistan' : 'افغانستان',
    quantity: '1',
    minQuantity: '1',
    price: '',
    purchasePrice: '',
    purchasePricePerGram: '',
    deductFromMelt: false,
  };

  const toEnglishDigits = (str: string) => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /۹/g];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return result;
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isAddingNewOrigin, setIsAddingNewOrigin] = useState(false);
  const [isAddingNewStoneType, setIsAddingNewStoneType] = useState(false);

  // Live calculation of total purchase price based on weight * price per gram for gold/silver
  const calculatedTotalPurchasePrice = useMemo(() => {
    if (formData.material === 'jewelry') {
      return parseFloat(formData.purchasePrice) || 0;
    }
    const perGram = parseFloat(formData.purchasePricePerGram) || 0;
    const w = parseFloat(formData.weight) || 0;
    return Math.round(perGram * w);
  }, [formData.material, formData.purchasePricePerGram, formData.purchasePrice, formData.weight]);

  // Calculation of available melted gold for current form carat:
  const currentSelectedCarat = (formData.carat || '').trim();
  const availableMeltForCarat = useMemo(() => {
    if (formData.material !== 'gold' || !currentSelectedCarat) return 0;
    
    // Inflow from second-hand purchases marked for melt with matching carat
    const inflow = products
      .filter((p: any) => 
        p && p.material === 'gold' && 
        (p.secondHandDestination === 'melt' || p.second_hand_destination === 'melt') &&
        (p.carat || '').trim() === currentSelectedCarat
      )
      .reduce((sum, p: any) => sum + (Number(p.weight) || 0) * (Number(p.quantity) || 1), 0);

    // Existing deductions for this carat (exclude the product being edited)
    const existingDeductions = products
      .filter((p: any) => 
        p && p.id !== editingId &&
        p.material === 'gold' && 
        (p.deductFromMelt || p.deduct_from_melt) && 
        p.secondHandDestination !== 'melt' && 
        p.second_hand_destination !== 'melt' &&
        (p.carat || '').trim() === currentSelectedCarat
      )
      .reduce((sum, p: any) => sum + (Number(p.weight) || 0) * (Number(p.quantity) || 1), 0);

    return Math.max(0, inflow - existingDeductions);
  }, [products, formData.material, currentSelectedCarat, editingId]);

  const deductionAmount = useMemo(() => {
    const w = parseFloat(formData.weight) || 0;
    const q = parseInt(formData.quantity) || 1;
    return w * q;
  }, [formData.weight, formData.quantity]);

  const remainingMeltAfter = availableMeltForCarat - deductionAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert digits if it's a numeric field
    const processedValue = ['weight', 'quantity', 'minQuantity', 'price', 'purchasePrice', 'purchasePricePerGram'].includes(name) 
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
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const [isConfirmingOrigin, setIsConfirmingOrigin] = useState(false);
  
  const handleConfirmNewOrigin = async () => {
    if (!formData.origin.trim()) return;
    setIsConfirmingOrigin(true);
    try {
      const newCountry = await addCountry(formData.origin.trim());
      if (newCountry) {
        setIsAddingNewOrigin(false);
        setFormData(prev => ({ ...prev, origin: newCountry.name }));
      }
    } finally {
      setIsConfirmingOrigin(false);
    }
  };

  const handleConfirmNewStone = () => {
    if (!formData.stoneType.trim()) return;
    setIsAddingNewStoneType(false);
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

  const openAddModal = () => {
    setFormData(initialFormState);
    setSelectedImage(null);
    setModalMode('add');
    setEditingId(null);
    setIsAddingNewOrigin(false);
    setIsAddingNewStoneType(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    const rawPurchasePrice = product.purchasePrice ?? (product as any).purchase_price;
    const rawPurchasePricePerGram = product.purchasePricePerGram ?? (product as any).purchase_price_per_gram;
    const calculatedPerGram = rawPurchasePricePerGram 
      ? rawPurchasePricePerGram.toString() 
      : (rawPurchasePrice && product.weight ? (rawPurchasePrice / product.weight).toFixed(2) : '');

    setFormData({
      code: product.code,
      name: product.name,
      weight: product.weight.toString(),
      material: product.material,
      carat: product.carat || (language === 'en' ? '18 Carat' : '۱۸ عیار'),
      stoneType: product.stoneType || (language === 'en' ? 'Agate' : 'عقیق'),
      origin: product.origin,
      quantity: product.quantity.toString(),
      minQuantity: (product.minQuantity ?? 1).toString(),
      price: product.price?.toString() || '',
      purchasePrice: rawPurchasePrice ? rawPurchasePrice.toString() : '',
      purchasePricePerGram: calculatedPerGram,
      deductFromMelt: Boolean(product.deductFromMelt || product.deduct_from_melt),
    });
    setSelectedImage(product.image || null);
    setModalMode('edit');
    setEditingId(product.id);
    setIsAddingNewOrigin(false);
    setIsAddingNewStoneType(false);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await removeProduct(productToDelete.id);
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const isGold = formData.material === 'gold';
      const shouldDeduct = isGold && Boolean(formData.deductFromMelt);

      let finalPurchasePrice: number | undefined = undefined;
      let finalPurchasePricePerGram: number | undefined = undefined;

      if (formData.material === 'jewelry') {
        if (formData.purchasePrice) {
          finalPurchasePrice = parseFloat(formData.purchasePrice);
        }
      } else {
        if (formData.purchasePricePerGram) {
          finalPurchasePricePerGram = parseFloat(formData.purchasePricePerGram);
          const w = parseFloat(formData.weight) || 0;
          finalPurchasePrice = finalPurchasePricePerGram * w;
        } else if (formData.purchasePrice) {
          finalPurchasePrice = parseFloat(formData.purchasePrice);
          const w = parseFloat(formData.weight) || 0;
          if (w > 0) finalPurchasePricePerGram = finalPurchasePrice / w;
        }
      }

      const { id, ...dataWithoutId } = {
        id: editingId || '',
        code: formData.code,
        name: formData.name,
        weight: parseFloat(formData.weight) || 0,
        material: formData.material,
        carat: formData.material !== 'jewelry' ? formData.carat : undefined,
        stoneType: formData.material === 'jewelry' ? formData.stoneType : undefined,
        origin: formData.origin,
        quantity: parseInt(formData.quantity) || 0,
        minQuantity: parseInt(formData.minQuantity) || 1,
        image: selectedImage || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        purchasePrice: finalPurchasePrice,
        purchase_price: finalPurchasePrice,
        purchasePricePerGram: finalPurchasePricePerGram,
        purchase_price_per_gram: finalPurchasePricePerGram,
        deductFromMelt: shouldDeduct,
        deduct_from_melt: shouldDeduct,
      };

      if (modalMode === 'add') {
        await addProduct(dataWithoutId as unknown as Product);
      } else {
        await updateProduct({ ...dataWithoutId, id } as Product);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error: any) {
      console.error('Submit failed:', error);
      const errorData = error.response?.data;
      if (errorData) {
        let errorMsg = '';
        if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
            .map(([key, value]) => {
              const label = key === 'code' ? t('code') : 
                            key === 'name' ? t('first_name') :
                            key === 'weight' ? t('weight') :
                            key === 'carat' ? t('carat') :
                            key === 'stoneType' ? t('carat') : key;
              return `${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
            })
            .join('\n');
        } else {
          errorMsg = JSON.stringify(errorData);
        }
        alert(`${language === 'en' ? 'Error saving product' : 'خطا در ثبت محصول'}:\n${errorMsg}`);
      } else {
        alert(language === 'en' ? 'Server error. Please try again.' : 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueOrigins = Array.from(new Set([
    ...products.map(p => p.origin),
    ...countries.map(c => c.name)
  ].filter(Boolean)));
  const uniqueStoneTypes = Array.from(new Set(products.filter(p => p.material === 'jewelry').map(p => p.stoneType).filter(Boolean)));

  return (
    <div className={`space-y-6 relative ${isRtl ? 'font-rtl' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-kh-bg/50 dark:bg-dark-bg/50 backdrop-blur-[2px] flex items-center justify-center rounded-3xl min-h-[400px]">
          <div className="w-8 h-8 border-4 border-kh-gold/20 border-t-kh-gold rounded-full animate-spin"></div>
        </div>
      )}
      {/* Top Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-kh-text dark:text-kh-gold">{t('inventory')}</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link 
              to="/pos"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black px-4 h-10 rounded-lg text-sm font-medium hover:bg-kh-card/90 transition-colors shadow-sm"
            >
              <ShoppingCart size={18} />
              <span className="leading-none mb-0.5">{t('new_sale')}</span>
            </Link>
            <button 
              onClick={openAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black px-4 h-10 rounded-lg text-sm font-medium hover:bg-kh-card/90 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="leading-none mb-0.5">{t('add_item')}</span>
            </button>
            <div className="flex items-center bg-white dark:bg-dark-card border border-kh-card/10 dark:border-dark-border rounded-lg p-1 shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-kh-card text-kh-text dark:bg-kh-gold dark:text-black' : 'text-kh-text/40 hover:text-kh-text dark:text-kh-gold/40 dark:hover:text-kh-gold'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-kh-card text-kh-text dark:bg-kh-gold dark:text-black' : 'text-kh-text/40 hover:text-kh-text dark:text-kh-gold/40 dark:hover:text-kh-gold'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={t('search')}
              className={`w-full bg-white dark:bg-dark-card border border-kh-card/10 dark:border-dark-border rounded-lg py-2.5 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-kh-card/20 transition-all text-kh-text dark:text-dark-text shadow-sm`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-kh-text/40 dark:text-kh-gold/40`} size={18} />
          </div>
        </div>
      </div>

      <div className="h-px bg-kh-card/5 dark:bg-dark-border w-full"></div>

      {/* Products Display Section */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-dark-card border border-dashed border-kh-card/20 dark:border-dark-border rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Package size={32} />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base sm:text-lg font-bold text-kh-text dark:text-kh-gold">
              {products.length === 0 
                ? (language === 'en' ? 'Your inventory is currently empty' : 'انبار اجناس در حال حاضر خالی است')
                : (language === 'en' ? 'No items match your search' : 'هیچ کالایی با این مشخصات یافت نشد')}
            </h3>
            <p className="text-xs sm:text-sm text-kh-muted">
              {products.length === 0 
                ? (language === 'en' ? 'You can add new items or restore sample inventory data with one click.' : 'می‌توانید اجناس جدید ثبت کنید یا با دکمه زیر اجناس و سوابق نمونه را بازیابی نمایید.')
                : (language === 'en' ? 'Try searching with another keyword or clear the search field.' : 'کلمه جستجو را پاک کنید یا عبارت دیگری را امتحان نمایید.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {products.length === 0 && (
              <button 
                onClick={restoreDefaultSampleData}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors"
              >
                <Package size={16} />
                <span>{language === 'en' ? 'Restore Sample Items & History' : 'بارگذاری اجناس و سوابق نمونه'}</span>
              </button>
            )}
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors hover:bg-kh-card/90"
            >
              <Plus size={16} />
              <span>{t('add_item')}</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="aspect-square bg-kh-bg dark:bg-black relative overflow-hidden">
                <ProductImage 
                  src={product.image} 
                  alt={product.name}
                  fallback={logo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute top-1 ${isRtl ? 'right-1' : 'left-1'} flex items-center gap-1 z-10`}>
                  <div className="bg-kh-card/90 dark:bg-dark-card/90 backdrop-blur-sm text-kh-text dark:text-kh-gold text-xs px-2 py-1 rounded font-bold shadow-sm">
                    {product.code}
                  </div>
                  {Boolean(product.deductFromMelt || product.deduct_from_melt) && (
                    <div 
                      className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-1 rounded shadow-sm flex items-center gap-1"
                      title={t('recycled_from_melt')}
                    >
                      <Flame size={11} className="fill-amber-200 animate-pulse" />
                      <span className="hidden sm:inline">{t('recycled_from_melt')}</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons Overlay */}
                <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col ${isRtl ? 'items-end' : 'items-start'} p-1.5 gap-1.5`}>
                  <button 
                    onClick={() => openEditModal(product)}
                    className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm p-1.5 text-kh-text dark:text-kh-gold hover:text-kh-gold rounded-md transition-all shadow-sm"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product)}
                    className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm p-1.5 text-red-500 hover:text-red-600 rounded-md transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3.5 space-y-2.5">
                <h4 className="font-bold text-kh-text dark:text-kh-gold text-base truncate leading-tight">{product.name}</h4>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-kh-muted">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Scale size={12} className="text-kh-gold" />
                      <span>{(Number(product.weight) || 0).toFixed(2)} {t('gram')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-kh-gold font-bold">{t('quantity')}:</span>
                      <span className="font-bold dark:text-dark-text">{product.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 truncate">
                      <Layers size={12} className="text-kh-gold" />
                      <span className="truncate font-medium dark:text-kh-gold/60">{product.carat || product.stoneType}</span>
                    </div>
                    {product.price && (
                      <div className="flex items-center gap-1 text-kh-text dark:text-kh-gold font-black">
                        <Banknote size={12} className="text-green-600" />
                        <span>{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('afghani')}</span>
                      </div>
                    )}
                  </div>

                  {(product.purchasePrice || (product.purchasePricePerGram && product.weight)) ? (
                    <div className="flex items-center justify-between text-[11px] bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-md border border-amber-500/20 font-medium">
                      <span>{t('purchase_price')}:</span>
                      <span className="font-bold font-mono">
                        {(product.purchasePrice || (product.purchasePricePerGram ? product.purchasePricePerGram * product.weight : 0)).toLocaleString()} {t('afghani')}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-sm min-w-[600px]`}>
              <thead>
                <tr className="bg-kh-card/5 dark:bg-black/20 text-kh-text dark:text-kh-gold border-b border-kh-card/5 dark:border-dark-border">
                  <th className="px-4 sm:px-6 py-4 font-bold">{language === 'en' ? 'Photo' : 'عکس'}</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">{language === 'en' ? 'Name & Code' : 'نام و کد کالا'}</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">{language === 'en' ? 'Details' : 'مشخصات'}</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-center">{t('quantity')}</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-center">{t('total_amount')} ({t('afghani')})</th>
                  <th className={`px-4 sm:px-6 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'}`}>{language === 'en' ? 'Actions' : 'عملیات'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kh-card/5 dark:divide-dark-border">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-kh-bg/30 dark:hover:bg-black/10 transition-colors text-xs sm:text-sm">
                    <td className="px-4 sm:px-6 py-3">
                      <ProductImage src={product.image} alt="" fallback={logo} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-kh-card/10 dark:border-dark-border" />
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-kh-text dark:text-dark-text">{product.name}</div>
                        {Boolean(product.deductFromMelt || product.deduct_from_melt) && (
                          <span 
                            className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                            title={t('recycled_from_melt')}
                          >
                            <Flame size={10} className="fill-amber-500 text-amber-600 dark:text-amber-400" />
                            <span>{t('recycled_from_melt')}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-sm text-kh-muted mt-0.5">{product.code}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <span className="bg-kh-bg dark:bg-black/20 text-kh-text dark:text-kh-gold text-xs sm:text-xs px-1.5 py-0.5 rounded border border-kh-card/5 dark:border-dark-border">{(Number(product.weight) || 0).toFixed(2)} {t('gram')}</span>
                        <span className="bg-kh-bg dark:bg-black/20 text-kh-text dark:text-kh-gold text-xs sm:text-xs px-1.5 py-0.5 rounded border border-kh-card/5 dark:border-dark-border">{product.carat || product.stoneType}</span>
                        <span className="bg-kh-bg dark:bg-black/20 text-kh-text dark:text-kh-gold text-xs sm:text-xs px-1.5 py-0.5 rounded border border-kh-card/5 dark:border-dark-border">{product.origin}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-kh-text dark:text-dark-text">{product.quantity}</span>
                        {product.quantity <= (product.minQuantity ?? 1) && (
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                            {language === 'en' ? `Min: ${product.minQuantity ?? 1}` : `حداقل: ${product.minQuantity ?? 1}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-center">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {product.price ? product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </div>
                      {(product.purchasePrice || (product.purchasePricePerGram && product.weight)) ? (
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5" title={t('purchase_price')}>
                          {t('purchase_price')}: {(product.purchasePrice || (product.purchasePricePerGram ? product.purchasePricePerGram * product.weight : 0)).toLocaleString()}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className={`flex items-center ${isRtl ? 'justify-end' : 'justify-start'} gap-2 sm:gap-3`}>
                        <button 
                          onClick={() => openEditModal(product)}
                          className="flex items-center gap-1 sm:gap-1.5 text-kh-text dark:text-kh-gold hover:text-kh-gold transition-colors text-[10px] sm:text-xs font-medium"
                        >
                          <Edit size={12} />
                          <span className="hidden sm:inline">{t('edit')}</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(product)}
                          className="flex items-center gap-1 sm:gap-1.5 text-red-500 hover:text-red-600 transition-colors text-[10px] sm:text-xs font-medium"
                        >
                          <Trash2 size={12} />
                          <span className="hidden sm:inline">{t('delete')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-kh-card/5 dark:border-dark-border flex justify-between items-center bg-kh-card text-kh-text">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-kh-gold" />
                <h3 className="text-lg font-bold">
                  {modalMode === 'add' ? t('add_item') : t('edit')}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-kh-text/60 hover:text-kh-text transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Image Upload Placeholder */}
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
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-kh-card/10 dark:border-dark-border flex flex-col items-center justify-center text-kh-text/40 hover:border-kh-gold hover:text-kh-gold transition-all cursor-pointer bg-kh-bg/30 dark:bg-black/20 relative overflow-hidden"
                  >
                    {selectedImage ? (
                      <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} />
                        <span className="text-[9px] mt-1 font-medium">{language === 'en' ? 'Select Photo' : 'انتخاب عکس'}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('code')}</label>
                    <input 
                      required
                      name="code"
                      type="text" 
                      autoComplete="off"
                      placeholder="G-101"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.code}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{language === 'en' ? 'Name' : 'نام کالا'}</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      autoComplete="off"
                      placeholder={language === 'en' ? 'Product Name' : 'نام محصول'}
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('weight')} ({t('gram')})</label>
                    <input 
                      required
                      name="weight"
                      type="text" 
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{language === 'en' ? 'Material' : 'جنس کالا'}</label>
                    <select 
                      required
                      name="material"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.material}
                      onChange={handleInputChange}
                    >
                      <option value="gold">{t('gold')}</option>
                      <option value="silver">{t('silver')}</option>
                      <option value="jewelry">{t('jewelry')}</option>
                    </select>
                  </div>

                  {/* Conditional Fields Based on Material - Dynamic from Rates */}
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

                  {/* Deduct from Melted Gold (کسر از ذوب) Feature */}
                  {formData.material === 'gold' && (
                    <div className="col-span-1 sm:col-span-2 pt-1">
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        formData.deductFromMelt 
                          ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15 dark:border-amber-500/40 shadow-sm' 
                          : 'bg-kh-bg/40 dark:bg-black/10 border-kh-card/10 dark:border-dark-border hover:border-kh-gold/30'
                      }`}>
                        {/* Header and Switch */}
                        <div 
                          className="flex items-center justify-between gap-3 cursor-pointer select-none"
                          onClick={() => setFormData(prev => ({ ...prev, deductFromMelt: !prev.deductFromMelt }))}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg transition-colors ${
                              formData.deductFromMelt 
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                                : 'bg-kh-card/10 text-kh-muted dark:bg-white/5'
                            }`}>
                              <Flame size={18} className={formData.deductFromMelt ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-kh-text dark:text-dark-text">
                                  {t('deduct_from_melt')}
                                </span>
                                {formData.deductFromMelt && (
                                  <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                    {language === 'en' ? 'Active' : 'فعال'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-kh-muted mt-0.5">
                                {t('deduct_from_melt_subtitle')}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={formData.deductFromMelt}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, deductFromMelt: !prev.deductFromMelt }));
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              formData.deductFromMelt ? 'bg-amber-500 dark:bg-kh-gold' : 'bg-kh-card/20 dark:bg-white/10'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                formData.deductFromMelt ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Live calculation details when active */}
                        {formData.deductFromMelt && (
                          <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="bg-white/70 dark:bg-dark-card/70 p-2 rounded-lg border border-amber-500/15">
                                <span className="text-[10px] text-kh-muted block font-medium">
                                  {t('available_melt_for_carat')} ({formData.carat}):
                                </span>
                                <span className="text-xs font-black text-kh-text dark:text-dark-text mt-0.5 block">
                                  {availableMeltForCarat.toFixed(2)} {t('gram')}
                                </span>
                              </div>

                              <div className="bg-white/70 dark:bg-dark-card/70 p-2 rounded-lg border border-amber-500/15">
                                <span className="text-[10px] text-kh-muted block font-medium">
                                  {t('deduction_amount')} ({formData.weight || 0} × {formData.quantity || 1}):
                                </span>
                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                                  - {deductionAmount.toFixed(2)} {t('gram')}
                                </span>
                              </div>

                              <div className="bg-white/70 dark:bg-dark-card/70 p-2 rounded-lg border border-amber-500/15">
                                <span className="text-[10px] text-kh-muted block font-medium">
                                  {t('remaining_melt_after')}:
                                </span>
                                <span className={`text-xs font-black mt-0.5 block ${
                                  remainingMeltAfter < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {remainingMeltAfter.toFixed(2)} {t('gram')}
                                </span>
                              </div>
                            </div>

                            {remainingMeltAfter < 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 font-bold">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{t('melt_insufficient_warning')}</span>
                              </div>
                            )}

                            {availableMeltForCarat <= 0 && remainingMeltAfter >= 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-medium">
                                <Info size={14} className="shrink-0" />
                                <span>{t('melt_zero_notice')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>{t('quantity')}</label>
                    <input 
                      required
                      name="quantity"
                      type="text" 
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="1"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                      {language === 'en' ? 'Min Stock' : 'حداقل موجودی'}
                    </label>
                    <input 
                      required
                      name="minQuantity"
                      type="text" 
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="1"
                      className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text"
                      value={formData.minQuantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  {formData.material !== 'jewelry' ? (
                    <div className="space-y-1 sm:col-span-2 bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                          {t('purchase_price_per_gram')} ({t('afghani')})
                        </label>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          {language === 'en' ? 'Input cost per gram' : 'قیمت خرید فی گرم'}
                        </span>
                      </div>
                      <input 
                        name="purchasePricePerGram"
                        type="text" 
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder={language === 'en' ? 'e.g. 4200' : 'مثلاً ۴۲۰۰'}
                        className="w-full bg-white dark:bg-black/30 border border-amber-500/30 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-kh-text dark:text-dark-text font-bold"
                        value={formData.purchasePricePerGram}
                        onChange={handleInputChange}
                      />
                      
                      {/* Live calculation banner */}
                      <div className="mt-2 pt-2 border-t border-amber-500/15 flex items-center justify-between text-xs">
                        <span className="text-kh-text/70 dark:text-gray-300 text-[11px]">
                          {t('calculated_total_cost')}:
                        </span>
                        <div className="flex items-center gap-1 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                          <span>{calculatedTotalPurchasePrice > 0 ? calculatedTotalPurchasePrice.toLocaleString() : '۰'}</span>
                          <span className="text-[10px]">{t('afghani')}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 sm:col-span-2 bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                          {t('purchase_price')} ({t('afghani')})
                        </label>
                        <input 
                          name="purchasePrice"
                          type="text" 
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder={language === 'en' ? 'e.g. 12000' : 'مثلاً ۱۲۰۰۰'}
                          className="w-full bg-white dark:bg-black/30 border border-amber-500/30 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-kh-text dark:text-dark-text font-bold"
                          value={formData.purchasePrice}
                          onChange={handleInputChange}
                        />
                        <p className="text-[10px] text-kh-text/60 dark:text-gray-400 mt-1">
                          {language === 'en' ? 'Direct purchase price for profit calculation' : 'قیمت تمام‌شده خرید جهت محاسبه دقیق مفاد و سود'}
                        </p>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className={`text-[11px] font-bold text-kh-text dark:text-kh-gold ${isRtl ? 'pr-1' : 'pl-1'}`}>
                          {t('total_amount')} ({language === 'en' ? 'Selling Price' : 'قیمت فروش قطعه'})
                        </label>
                        <input 
                          name="price"
                          type="text" 
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="0"
                          className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text dark:text-dark-text font-bold"
                          value={formData.price}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={`p-4 border-t border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/20 flex gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black rounded-lg text-xs font-bold hover:bg-kh-card/90 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                  {modalMode === 'add' ? t('save') : t('save')}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-kh-card/10 dark:border-dark-border rounded-lg text-xs font-bold text-kh-text dark:text-kh-gold hover:bg-kh-card/5 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-kh-text dark:text-kh-gold mb-2">{language === 'en' ? 'Confirm Delete' : 'تایید حذف محصول'}</h3>
              <p className="text-sm text-kh-muted dark:text-kh-gold/60 mb-6 leading-relaxed">
                {language === 'en' ? `Are you sure you want to delete "${productToDelete.name}"?` : `آیا از حذف محصول "${productToDelete.name}" اطمینان دارید؟`}
              </p>
              <div className={`flex gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <button 
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    t('delete')
                  )}
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-kh-bg dark:bg-black/20 text-kh-text dark:text-kh-gold font-bold rounded-xl hover:bg-kh-card/10 transition-colors disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
