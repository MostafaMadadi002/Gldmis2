import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  ShoppingCart,
  User as UserIcon,
  Package,
  ChevronRight,
  ChevronLeft,
  Store,
  MapPin,
  Phone,
  Gem,
  LayoutGrid,
  List as ListIcon,
  X,
  Camera,
  Building
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/SettingsContext';
import { useRates } from '../context/RatesContext';
import { Product, CartItem, Sale } from '../types';
import { toISODate } from '../lib/dateUtils';

const POS: React.FC = () => {
  const toEnglishDigits = (str: string) => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return result;
  };

  const { products, addProduct, completeSale, countries, addCountry } = useInventory();
  const { rates, isLoading: isRatesLoading } = useRates();
  const { shopInfo, t, language, logo } = useSettings();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('khazana_user') || '{}');
    } catch {
      return {};
    }
  })();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog');
  const [catalogView, setCatalogView] = useState<'grid' | 'list'>('grid');

  // Add Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddingNewOrigin, setIsAddingNewOrigin] = useState(false);
  const [isAddingNewStoneType, setIsAddingNewStoneType] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const initialFormState = {
    code: '',
    name: '',
    weight: '',
    material: 'gold' as 'gold' | 'silver' | 'jewelry',
    carat: language === 'en' ? '18 Carat' : '۱۸ عیار',
    stoneType: language === 'en' ? 'Agate' : 'عقیق',
    origin: language === 'en' ? 'Afghanistan' : 'افغانستان',
    quantity: '1',
    price: '',
  };

  const [formData, setFormData] = useState(initialFormState);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert digits if it's a numeric field
    const processedValue = ['weight', 'quantity', 'price'].includes(name) 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { id, ...productData } = {
        id: '',
        code: formData.code,
        name: formData.name,
        weight: parseFloat(formData.weight) || 0,
        material: formData.material,
        carat: formData.material !== 'jewelry' ? formData.carat : undefined,
        stoneType: formData.material === 'jewelry' ? formData.stoneType : undefined,
        origin: formData.origin,
        quantity: parseInt(formData.quantity) || 0,
        image: selectedImage || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
      };

      await addProduct(productData as Product);
      setIsModalOpen(false);
      setFormData(initialFormState);
      setSelectedImage(null);
    } catch (error: any) {
      console.error('Submit failed:', error);
      const errorData = error.response?.data;
      if (errorData) {
        let errorMsg = '';
        if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
            .map(([key, value]) => {
              const label = key === 'code' ? t('code') : 
                            key === 'name' ? t('product_name') :
                            key === 'weight' ? t('weight') :
                            key === 'carat' ? t('carat') :
                            key === 'stoneType' ? t('stone_type') : key;
              return `${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
            })
            .join('\n');
        } else {
          errorMsg = JSON.stringify(errorData);
        }
        alert(`${language === 'en' ? 'Error adding product' : 'خطا در ثبت محصول'}:\n${errorMsg}`);
      } else {
        alert(language === 'en' ? 'Server connection error. Please try again.' : 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueOrigins = Array.from(new Set([
    ...products.map(p => p.origin),
    ...countries.map(c => c.name)
  ].filter(Boolean)));
  const uniqueStoneTypes = Array.from(new Set(products.filter(p => p.material === 'jewelry').map(p => p.stoneType).filter(Boolean)));

  const isRtl = language !== 'en';

  // Search filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.selectedQuantity >= product.quantity) {
        alert(language === 'en' ? 'Not enough stock' : (language === 'ps' ? 'په ګودام کې کافي نشته' : 'موجودی انبار کافی نیست'));
        return;
      }
      updateCartItem(product.id, { selectedQuantity: existingItem.selectedQuantity + 1 });
      return;
    }

    if (product.quantity <= 0) {
      alert(language === 'en' ? 'Product out of stock' : (language === 'ps' ? 'محصول په ګودام کې نشته' : 'محصول در انبار موجود نیست'));
      return;
    }

    // Simplified calculation: Weight x Unit Price from Rates
    let defaultUnitPrice = 0;
    
    // For Jewelry, default to its own price. For Gold/Silver, try to find matching rate.
    if (product.material === 'jewelry') {
      defaultUnitPrice = product.price || 0;
    } else {
      // Try to find matching rate by label (e.g. "۱۸ عیار")
      const matchingRate = rates.find(r => r.label === product.carat);
      if (matchingRate) {
        defaultUnitPrice = matchingRate.value;
      } else {
        // Fallback to manual product price if set
        defaultUnitPrice = product.price || 0;
      }
    }

    const cartItem: CartItem = {
      ...product,
      selectedWeight: product.weight,
      selectedPrice: defaultUnitPrice,
      selectedQuantity: 1,
      selectedStone: product.stoneType
    };
    setCart([...cart, cartItem]);
    // Switch to cart tab on mobile for visibility
    if (window.innerWidth < 1024) setActiveTab('cart');
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        // Stock validation on quantity update
        if (updatedItem.selectedQuantity > item.quantity) {
          alert(language === 'en' ? 'Cannot exceed stock' : (language === 'ps' ? 'تاسو نشئ کولی د موجودي څخه ډیر ثبت کړئ' : 'بیشتر از موجودی انبار نمی‌توانید ثبت کنید'));
          return item;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const totalAmount = useMemo(() => {
    const rawTotal = cart.reduce((sum, item) => {
      // For jewelry, the base calculation is Price * Quantity. For others, Weight * Price * Quantity.
      const calculated = (item.selectedPrice || 0) * 
                        (item.material === 'jewelry' ? 1 : (item.selectedWeight || 0)) * 
                        (item.selectedQuantity || 1);
      return sum + (item.manualPrice !== undefined ? item.manualPrice : calculated);
    }, 0);
    return parseFloat(Number(rawTotal).toFixed(2));
  }, [cart]);

  // Seller info derived from logged-in user
  const loggedInUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('khazana_user') || '{}');
    } catch {
      return {};
    }
  }, []);
  
  const sellerDisplayName = useMemo(() => {
    // Check both camelCase and snake_case for user profile fields
    const fName = loggedInUser.firstName || loggedInUser.first_name;
    const lName = loggedInUser.lastName || loggedInUser.last_name;
    
    if (fName) {
      return `${fName} ${lName || ''}`.trim();
    }
    // Fallback to name field from mock or username
    return loggedInUser.name || loggedInUser.username || (language === 'en' ? 'System Admin' : 'مدیر سیستم');
  }, [loggedInUser, language]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerName,
      sellerName: sellerDisplayName,
      items: cart,
      totalAmount,
      date: toISODate(new Date()),
      timestamp: Date.now()
    };

    try {
      await completeSale(newSale);
      setCart([]);
      setCustomerName('');
      alert(t('success_save'));
    } catch (error) {
      console.error('Sale completion failed:', error);
      alert(t('error_saving_sale'));
    }
  };

  const handlePrint = () => {
    if (cart.length === 0) {
      alert(language === 'en' ? "Cart is empty!" : (language === 'ps' ? "د پیرود لیست خالي دی!" : "لیست خرید خالی است!"));
      return;
    }
    
    // Switch to cart tab on mobile to ensure visibility
    setActiveTab('cart');
    
    // Small delay to allow tab switch/DOM updates
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Stable invoice number for the current session
  const currentInvoiceNum = useMemo(() => `INV-${Math.floor(1000 + Math.random() * 9000)}`, []);

  return (
    <div className={`flex flex-col gap-4 ${isRtl ? 'font-rtl' : ''} min-h-full pb-10`}>
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-white dark:bg-dark-card p-1 rounded-xl border border-kh-card/5 dark:border-dark-border shadow-sm shrink-0 no-print">
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-xs transition-all ${activeTab === 'catalog' ? 'bg-kh-gold text-black shadow-md shadow-kh-gold/20' : 'text-kh-muted'}`}
        >
          <Package size={16} />
          {t('catalog')}
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-xs transition-all relative ${activeTab === 'cart' ? 'bg-kh-gold text-black shadow-md shadow-kh-gold/20' : 'text-kh-muted'}`}
        >
          <ShoppingCart size={16} />
          {t('bill')}
          {cart.length > 0 && (
            <span className={`absolute top-1.5 ${isRtl ? 'right-1/4' : 'left-1/4'} w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white dark:border-dark-card`}>
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Header Search */}
      <div className={`bg-white dark:bg-dark-card p-3 rounded-xl border border-kh-card/5 dark:border-dark-border shadow-sm flex flex-col md:flex-row gap-3 items-center shrink-0 no-print ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="relative flex-1 w-full">
          <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-kh-text/20 dark:text-kh-gold/20`} size={18} />
          <input 
            type="text"
            placeholder={t('search')}
            className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-xl p-2.5 ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} text-xs focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-kh-gold text-black dark:text-white px-8 py-2.5 rounded-xl font-bold text-xs hover:bg-kh-gold/90 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {t('add_item')}
          </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-130px)] min-h-[600px]">
        {/* Left: Product Catalog Area (60%) */}
        <div className={`lg:w-[60%] flex flex-col gap-3 min-w-0 no-print h-full ${activeTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="bg-white dark:bg-dark-card h-full rounded-2xl border border-kh-card/5 dark:border-dark-border shadow-sm flex flex-col overflow-hidden lg:sticky lg:top-4">
            <div className="p-4 border-b border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/10 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-black text-kh-text dark:text-kh-gold flex items-center gap-2 uppercase tracking-widest">
                <Package size={16} className="text-kh-gold" />
                {t('inventory')}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex bg-kh-bg/50 dark:bg-black/20 p-1 rounded-lg border border-kh-card/5">
                  <button 
                    onClick={() => setCatalogView('grid')}
                    className={`p-1 rounded-md transition-all ${catalogView === 'grid' ? 'bg-white dark:bg-dark-card shadow-sm text-kh-gold' : 'text-kh-muted'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button 
                    onClick={() => setCatalogView('list')}
                    className={`p-1 rounded-md transition-all ${catalogView === 'list' ? 'bg-white dark:bg-dark-card shadow-sm text-kh-gold' : 'text-kh-muted'}`}
                  >
                    <ListIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {catalogView === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      className="bg-kh-bg/30 dark:bg-black/10 border border-kh-card/5 dark:border-dark-border rounded-xl overflow-hidden group hover:border-kh-gold transition-all"
                    >
                      <div className="h-24 relative overflow-hidden bg-kh-bg/20 flex items-center justify-center">
                        <img 
                          src={product.image || logo || '/logo.png'} 
                          alt={product.name} 
                          className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${!product.image ? 'object-contain p-2' : 'object-cover'}`} 
                          onError={(e) => {
                            (e.target as any).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlPSIjRDRAOTNEIiBvcGFjaXR5PSIwLjMiPjxwYXRoIGQ9Ik02IDNoMTJsNCA2LTEwIDEzTDIgOVoiLz48cGF0aSBkPSJNMTEgMyA4IDlsMyAxMyAzLTEzLTMtNloiLz48cGF0aSBkPSJNMiA5aDIwIi8+PC9zdmc+';
                            (e.target as any).className = 'w-10 h-10 object-contain opacity-30';
                          }}
                        />
                        <div className={`absolute top-1.5 ${isRtl ? 'right-1.5' : 'left-1.5'} bg-kh-card/90 backdrop-blur-sm text-kh-text text-base px-3 py-1.5 rounded-lg font-black shadow-sm z-10`}>
                          {product.code}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-black text-kh-text dark:text-dark-text truncate mb-2">{product.name}</h4>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-kh-muted font-black">{Number(product.weight || 0).toFixed(2)} {product.material === 'jewelry' ? t('carat') : t('gram')}</span>
                          <span className={`text-sm font-black ${product.quantity <= 0 ? 'text-red-500' : 'text-kh-muted'}`}>
                            {product.quantity <= 0 ? t('out_of_stock') : `${t('quantity')}: ${product.quantity}`}
                          </span>
                        </div>
                        <div className="mb-4">
                          <span className="text-sm font-black text-kh-gold">{product.carat || product.stoneType}</span>
                        </div>
                        <button 
                          onClick={() => addToCart(product)}
                          disabled={product.quantity <= 0 || cart.some(i => i.id === product.id)}
                          className="w-full bg-white dark:bg-dark-card border-2 border-kh-card/10 dark:border-dark-border text-kh-text dark:text-dark-text rounded-2xl py-3 text-base font-black hover:bg-kh-gold hover:text-kh-text dark:hover:bg-kh-gold dark:hover:text-kh-text transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                        >
                          <Plus size={16} />
                          {product.quantity <= 0 ? t('out_of_stock') : t('add_item')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-4 p-3 bg-kh-bg/30 dark:bg-black/10 border-2 border-kh-card/5 dark:border-dark-border rounded-xl hover:border-kh-gold transition-all group shadow-sm"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-kh-card/10 bg-kh-bg/20 flex items-center justify-center relative">
                        <img 
                          src={product.image || logo || '/logo.png'} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as any).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlPSIjRDRAOTNEIiBvcGFjaXR5PSIwLjMiPjxwYXRoIGQ9Ik02IDNoMTJsNCA2LTEwIDEzTDIgOVoiLz48cGF0aSBkPSJNMTEgMyA4IDlsMyAxMyAzLTEzLTMtNloiLz48cGF0aSBkPSJNMiA5aDIwIi8+PC9zdmc+';
                            (e.target as any).className = 'w-6 h-6 object-contain opacity-30';
                          }}
                        />
                        <div className={`absolute top-1 ${isRtl ? 'right-1' : 'left-1'} bg-kh-card/90 backdrop-blur-sm text-kh-text text-[11px] px-2 py-0.5 rounded font-black shadow-sm z-10`}>
                          {product.code}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-black text-kh-text dark:text-dark-text truncate">{product.name}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-kh-muted">{product.carat || product.stoneType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-sm font-black text-kh-text dark:text-kh-gold bg-kh-bg/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-kh-card/5">
                            {Number(product.weight || 0).toFixed(2)} {product.material === 'jewelry' ? t('carat') : t('gram')}
                          </div>
                          <div className={`text-sm font-black hidden md:block ${product.quantity <= 0 ? 'text-red-500' : 'text-kh-muted'}`}>
                            {product.quantity <= 0 ? t('out_of_stock') : `${t('quantity')}: ${product.quantity}`}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        disabled={product.quantity <= 0 || cart.some(i => i.id === product.id)}
                        className="p-3 bg-white dark:bg-dark-card border-2 border-kh-card/10 dark:border-dark-border rounded-xl text-kh-gold hover:bg-kh-gold hover:text-kh-text transition-all disabled:opacity-30 flex items-center justify-center"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-kh-card/5 dark:border-dark-border flex justify-center gap-2 shrink-0">
              <button className="p-1.5 rounded-lg border border-kh-card/10 text-kh-text/40 hover:bg-kh-bg transition-all">
                <ChevronRight size={16} />
              </button>
              <div className="flex items-center justify-center gap-2 px-3 text-[10px] font-bold text-kh-text/40">
                {t('page')} ۱
              </div>
              <button className="p-1.5 rounded-lg border border-kh-card/10 text-kh-text/40 hover:bg-kh-bg transition-all">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Invoice/Cart Area (40%) */}
        <div className={`w-full lg:w-[40%] flex flex-col gap-3 printable-bill lg:sticky lg:top-4 lg:h-[calc(100vh-130px)] min-h-[500px] ${activeTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between px-2 print:hidden shrink-0">
            <h3 className="text-[10px] font-black text-kh-muted uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart size={14} />
              {t('bill')}
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-[8px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded transition-all"
              >
                {t('clear_all')}
              </button>
            )}
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-kh-card/5 dark:border-dark-border shadow-sm flex flex-col overflow-hidden print:shadow-none print:border-none h-full">
            {/* Invoice Header */}
            <div className={`p-6 border-b-4 border-kh-gold/30 dark:border-dark-border bg-kh-bg/30 dark:bg-black/10 print:bg-white print:border-b-4 print:border-black flex justify-between items-center shrink-0 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="w-16 h-16 bg-white rounded-xl border-2 border-kh-gold/20 flex items-center justify-center p-1.5 shadow-md overflow-hidden print:border-none print:shadow-none">
                  {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <Gem className="text-kh-gold" size={32} />}
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h2 className="text-xl font-black text-kh-text dark:text-kh-gold print:text-2xl print:text-black mb-1">{shopInfo.name}</h2>
                  <div className="text-xs text-kh-muted line-clamp-1 print:text-sm print:text-black font-bold">{shopInfo.address}</div>
                  <div className="hidden print:block text-sm text-black mt-1 font-bold">{shopInfo.phone}</div>
                </div>
              </div>
              <div className={isRtl ? 'text-left' : 'text-right'}>
                <div className="text-[12px] font-black text-kh-gold dark:text-kh-gold uppercase tracking-[0.2em] print:text-black mb-1">{t('official_invoice')}</div>
                <div className="text-2xl font-black text-kh-text dark:text-kh-gold print:text-2xl print:text-black">#{currentInvoiceNum}</div>
                <div className="text-xs font-bold text-kh-muted dark:text-kh-muted mt-1 print:text-black">{t('date')}: {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}</div>
              </div>
            </div>

            {/* Customer Info Section */}
            <div className="p-5 border-b border-kh-card/5 dark:border-dark-border bg-kh-bg/10 dark:bg-black/5 print:bg-white print:border-b-2 print:border-black shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 max-w-md">
                    <span className="text-sm font-black text-kh-text dark:text-kh-gold whitespace-nowrap print:text-base print:text-black">{t('customer_name')}:</span>
                    <input 
                      type="text"
                      autoComplete="off"
                      className="flex-1 bg-transparent border-b-2 border-kh-gold/20 dark:border-kh-gold/10 text-base font-black text-kh-text dark:text-dark-text outline-none focus:border-kh-gold transition-colors py-1 placeholder:text-kh-muted/30 print:hidden"
                      placeholder={t('customer_name')}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <span className="hidden print:block text-base font-black text-black border-b border-black flex-1 min-w-[150px] pb-1">
                      {customerName || '................................'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Cart List / Print Table */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 print:p-6 print:overflow-visible">
              <div className="hidden print:grid grid-cols-12 gap-3 pb-3 mb-3 border-b-4 border-black text-[12px] font-black uppercase">
                <div className="col-span-1">#</div>
                <div className="col-span-4">{t('description')}</div>
                <div className="col-span-2 text-center">{t('quantity')}</div>
                <div className="col-span-2 text-center">{t('weight')}</div>
                <div className="col-span-3 text-left">{t('total_amount')} ({t('afghani')})</div>
              </div>
              {cart.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-kh-text/20 dark:text-kh-gold/20 gap-3 no-print">
                  <ShoppingCart size={40} strokeWidth={1} />
                  <p className="text-sm font-bold">{language === 'fa' ? "بل خرید خالی است" : "Bill is empty"}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map((item, index) => {
                    const rawSuggested = (item.selectedPrice || 0) * (item.material === 'jewelry' ? 1 : (item.selectedWeight || 0)) * (item.selectedQuantity || 1);
                    const suggestedPrice = parseFloat(Number(rawSuggested).toFixed(2));
                    const currentPrice = item.manualPrice !== undefined ? item.manualPrice : suggestedPrice;

                    return (
                      <div 
                        key={item.id} 
                        className={`
                          relative group bg-white dark:bg-black/40 rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-kh-gold/5
                          ${item.material === 'gold' ? 'border-kh-gold/20 dark:border-kh-gold/10' : 
                            item.material === 'silver' ? 'border-slate-400/20 dark:border-slate-400/10' : 
                            'border-purple-500/20 dark:border-purple-500/10'}
                          print:grid print:grid-cols-12 print:gap-3 print:p-2.5 print:border-black/20 print:border-b print:rounded-none print:border-x-0 print:border-t-0 print:bg-transparent print:shadow-none
                        `}
                      >
                        {/* Material Accent Bar */}
                        <div className={`
                          absolute top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-1 rounded-full my-4
                          ${item.material === 'gold' ? 'bg-kh-gold' : 
                            item.material === 'silver' ? 'bg-slate-400' : 
                            'bg-purple-500'}
                          print:hidden
                        `} />

                        {/* Header: Name and Delete */}
                        <div className="flex justify-between items-center mb-5 print:contents">
                          <div className="flex items-center gap-4 print:col-span-5">
                            <span className={`
                              w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black print:hidden
                              ${item.material === 'gold' ? 'bg-kh-gold/10 text-kh-gold' : 
                                item.material === 'silver' ? 'bg-slate-400/10 text-slate-500' : 
                                'bg-purple-500/10 text-purple-600'}
                            `}>
                              {index + 1}
                            </span>
                            <div className="print:flex print:items-center print:gap-2">
                               <span className="hidden print:inline text-xs font-black">{index + 1}-</span>
                               <div>
                                 <h4 className="text-lg font-black text-kh-text dark:text-dark-text print:text-black leading-tight">{item.name}</h4>
                                 <p className="text-[10px] font-bold text-kh-muted mt-0.5 print:hidden">
                                   {item.material === 'gold' ? t('gold') : item.material === 'silver' ? t('silver') : t('jewelry')} - {item.carat || item.stoneType}
                                 </p>
                               </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all no-print"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:contents">
                          {/* Quantity */}
                          <div className="space-y-1.5 print:col-span-2 print:text-center">
                            <label className="text-[9px] font-black text-kh-muted uppercase tracking-widest pl-1 print:hidden">{t('quantity')}</label>
                            <div className="flex items-center bg-kh-bg/50 dark:bg-white/5 border border-kh-card/5 rounded-xl px-3 py-2 print:border-none print:bg-transparent print:p-0">
                              <input 
                                type="text"
                                inputMode="numeric"
                                className="w-full bg-transparent text-sm font-black focus:outline-none text-kh-text dark:text-dark-text text-center quantity-input print:hidden"
                                value={item.selectedQuantity || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = toEnglishDigits(e.target.value);
                                  if (val === '') {
                                    updateCartItem(item.id, { selectedQuantity: 0 });
                                  } else {
                                    const numericVal = parseInt(val.replace(/[^0-9]/g, '')) || 0;
                                    updateCartItem(item.id, { selectedQuantity: numericVal });
                                  }
                                }}
                              />
                              <span className="hidden print:inline text-sm font-black">{item.selectedQuantity}</span>
                            </div>
                          </div>

                          {/* Weight */}
                          <div className="space-y-1.5 print:col-span-2 print:text-center">
                            <label className="text-[9px] font-black text-kh-muted uppercase tracking-widest pl-1 print:hidden">{t('weight')} ({t('gram')})</label>
                            <div className="flex items-center bg-kh-bg/50 dark:bg-white/5 border border-kh-card/5 rounded-xl px-3 py-2 print:border-none print:bg-transparent print:p-0">
                              <input 
                                type="text"
                                inputMode="decimal"
                                className="w-full bg-transparent text-sm font-black focus:outline-none text-kh-text dark:text-dark-text text-center weight-input print:hidden"
                                value={item.selectedWeight || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = toEnglishDigits(e.target.value);
                                  // Clean value to allow only numbers and one decimal point
                                  const cleanVal = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                  if (cleanVal === '' || /^\d*\.?\d{0,2}$/.test(cleanVal)) {
                                    updateCartItem(item.id, { selectedWeight: cleanVal === '' ? 0 : parseFloat(cleanVal) });
                                  }
                                }}
                              />
                              <span className="hidden print:inline text-sm font-black">{Number(item.selectedWeight || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Rate Selection */}
                          <div className="space-y-1.5 no-print">
                            <label className="text-[9px] font-black text-kh-muted uppercase tracking-widest pl-1">{language === 'en' ? 'Rate' : 'نرخ'}</label>
                            <div className="flex items-center bg-kh-bg/50 dark:bg-white/5 border border-kh-card/5 rounded-xl px-3 h-[38px]">
                              <select 
                                className="w-full bg-transparent text-[11px] font-black focus:outline-none text-kh-text dark:text-dark-text cursor-pointer"
                                value={item.selectedPrice}
                                onChange={(e) => updateCartItem(item.id, { selectedPrice: parseFloat(e.target.value) || 0 })}
                              >
                                {item.material === 'jewelry' && (
                                  <option value={item.price || 0}>{language === 'en' ? 'Product Price' : 'قیمت محصول'} ({item.price || 0})</option>
                                )}
                                {rates.filter(r => 
                                  (item.material === 'gold' && r.type === 'gold') || 
                                  (item.material === 'silver' && r.type === 'silver')
                                ).map(r => (
                                  <option key={r.id} value={r.value}>{r.label} - {r.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Final Item Price (Editable) */}
                          <div className="col-span-2 sm:col-span-1 space-y-1.5 print:col-span-3 print:text-left">
                            <label className="text-[9px] font-black text-kh-gold uppercase tracking-widest pl-1 print:hidden">{t('total_amount')}</label>
                            <div className="flex items-center bg-kh-gold/5 dark:bg-kh-gold/5 border border-kh-gold/20 rounded-xl px-3 py-2 print:border-none print:bg-transparent print:p-0">
                              <input 
                                type="text"
                                inputMode="decimal"
                                className="w-full bg-transparent text-sm font-black focus:outline-none text-kh-text dark:text-kh-gold text-left price-input print:hidden"
                                value={currentPrice || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = toEnglishDigits(e.target.value);
                                  // Clean value to allow only numbers and one decimal point
                                  const cleanVal = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                  if (cleanVal === '' || /^\d*\.?\d{0,2}$/.test(cleanVal)) {
                                    updateCartItem(item.id, { manualPrice: cleanVal === '' ? 0 : parseFloat(cleanVal) });
                                  }
                                }}
                              />
                              <span className="hidden print:inline text-sm font-black text-left">{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Invoice Footer */}
            <div className="p-4 border-t border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/10 mt-auto no-print">
              <div className="flex justify-between items-end mb-4">
                <div className={`text-${isRtl ? 'right' : 'left'} flex-1 pr-2`}>
                  <div className="text-base font-black text-black dark:text-white">{language === 'en' ? 'Seller' : 'فروشنده'}: {sellerDisplayName}</div>
                </div>
                <div className={`text-${isRtl ? 'left' : 'right'} shrink-0`}>
                  <div className="text-[9px] font-black text-kh-muted mb-0.5 uppercase tracking-tighter">{t('total_amount')} ({t('afghani')})</div>
                  <div className="text-2xl font-black text-kh-text dark:text-kh-gold">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="flex-1 h-10 bg-white dark:bg-dark-card border border-kh-card/10 dark:border-dark-border text-kh-text dark:text-dark-text rounded-xl font-black text-[10px] hover:bg-kh-bg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer size={14} />
                  {t('print')}
                </button>
                <button 
                  onClick={handleCompleteSale}
                  className="flex-[2] h-10 bg-kh-card dark:bg-kh-gold text-black dark:text-black rounded-xl font-black text-[10px] hover:bg-kh-card/90 dark:hover:bg-kh-gold/90 transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-kh-gold/20"
                >
                  <CheckCircle2 size={14} />
                  {t('save')}
                </button>
              </div>
            </div>

            {/* Unified Printable Invoice */}
            <div className="hidden print:block fixed inset-0 z-[999] bg-white text-black p-0 overflow-visible">
              {cart.length > 0 && (
                <div className={`printable-invoice bg-white text-black p-10 font-serif border-[12px] border-double border-black ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} style={{ direction: isRtl ? 'rtl' : 'ltr', minHeight: '297mm' }}>
                {/* Header */}
                <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                  <div className={`flex items-center gap-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                    {logo ? (
                      <img src={logo} alt="Shop Logo" className="w-28 h-28 object-contain border-2 border-black p-1" />
                    ) : (
                      <div className="w-28 h-28 border-2 border-black flex items-center justify-center bg-gray-50">
                        <Gem size={56} className="text-black" />
                      </div>
                    )}
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <h1 className="text-5xl font-black mb-2 tracking-tight">{shopInfo.name}</h1>
                      <p className="text-lg font-bold text-gray-700 leading-tight">{shopInfo.description}</p>
                    </div>
                  </div>
                  <div className={isRtl ? 'text-left' : 'text-right'}>
                    <div className="text-3xl font-black mb-3 border-b-4 border-black pb-1 inline-block uppercase tracking-wider">{t('official_invoice')}</div>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-gray-900">{t('invoice_no')}: <span className="text-xl">#{currentInvoiceNum}</span></div>
                      <div className="text-sm font-bold text-gray-700">{t('date')}: <span className="font-black text-black">{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}</span></div>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-2 gap-12 mb-10 border-b-2 border-black pb-8">
                  <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-end gap-3 border-b border-gray-300 pb-1">
                      <span className="text-sm font-black text-gray-500 uppercase min-w-[100px]">{t('customer_name')}:</span>
                      <span className="text-xl font-black text-black flex-1">{customerName || t('guest_customer')}</span>
                    </div>
                    <div className="flex items-end gap-3 border-b border-gray-300 pb-1">
                      <span className="text-sm font-black text-gray-500 uppercase min-w-[100px]">{t('seller')}:</span>
                      <span className="text-xl font-black text-black flex-1">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || (language === 'en' ? 'System Admin' : 'مدیر سیستم'))}</span>
                    </div>
                  </div>
                  <div className={`space-y-2 pt-2 ${isRtl ? 'text-left' : 'text-right'}`}>
                    <div className="text-base font-black text-gray-900 flex items-start gap-2 justify-end">
                      <span className="max-w-[250px]">{shopInfo.address}</span>
                      <Building size={18} className="mt-1 opacity-50" />
                    </div>
                    <div className="text-lg font-black text-black flex items-center gap-2 justify-end font-mono">
                      <span>{shopInfo.phone}</span>
                      <Phone size={18} className="opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-12 flex-1">
                  {['gold', 'silver', 'jewelry', 'other'].map((mat) => {
                    const items = cart.filter(i => {
                      if (mat === 'other') return !['gold', 'silver', 'jewelry'].includes(i.material);
                      return i.material === mat;
                    });
                    if (items.length === 0) return null;
                    
                    const totalWeight = items.reduce((sum, i) => sum + (Number(i.selectedWeight || 0) * i.selectedQuantity), 0);

                    return (
                      <div key={mat} className="mb-8">
                        <div className={`bg-gray-900 text-white px-6 py-2 border-black mb-3 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          <h3 className="text-sm font-black uppercase tracking-widest">
                            {mat === 'gold' ? t('gold') : mat === 'silver' ? t('silver') : mat === 'jewelry' ? t('jewelry') : t('other')}
                          </h3>
                          <span className="text-[10px] font-bold opacity-80 italic">
                            {language === 'en' ? 'Subtotal Weight' : 'مجموع وزن بخش'}: {totalWeight.toFixed(2)} {mat === 'jewelry' ? t('carat') : t('gram_short')}
                          </span>
                        </div>
                        <table className={`w-full border-collapse ${isRtl ? 'text-right' : 'text-left'}`}>
                          <thead>
                            <tr className={`border-b-2 border-black text-[11px] font-black text-gray-600 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>
                              <th className="py-3 px-3 w-12 text-center">#</th>
                              <th className="py-3 px-3">{t('description')}</th>
                              <th className="py-3 px-3 text-center">{t('code')}</th>
                              <th className="py-3 px-3 text-center">{t('quantity')}</th>
                              <th className="py-3 px-3 text-center">{t('weight')}/{t('carat')}</th>
                              <th className={`py-3 px-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('unit_price')}</th>
                              <th className={`py-3 px-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('total_amount')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-gray-200">
                            {items.map((item, index) => {
                              let unitPrice = item.selectedPrice;
                              if (item.manualPrice !== undefined) {
                                const divisor = (item.material === 'jewelry' ? 1 : item.selectedWeight) * item.selectedQuantity;
                                unitPrice = divisor > 0 ? item.manualPrice / divisor : 0;
                              }
                              const totalPrice = (item.manualPrice !== undefined) ? item.manualPrice : (unitPrice * item.selectedQuantity * (item.material === 'jewelry' ? 1 : item.selectedWeight));
                              
                              return (
                                <tr key={index} className="text-base font-medium">
                                  <td className="py-4 px-3 text-center text-gray-400 font-bold">{index + 1}</td>
                                  <td className="py-4 px-3">
                                    <div className="font-black text-black text-lg leading-tight">{item.name}</div>
                                    <div className="text-xs font-bold text-gray-500 mt-0.5">{item.carat || item.stoneType || ''}</div>
                                  </td>
                                  <td className="py-4 px-3 text-center font-mono text-xs font-bold bg-gray-50">{item.code}</td>
                                  <td className="py-4 px-3 text-center font-black text-lg">{item.selectedQuantity}</td>
                                  <td className="py-4 px-3 text-center font-black text-lg">
                                    {Number(item.selectedWeight || 0).toFixed(2)} <span className="text-xs">{item.material === 'jewelry' ? t('carat') : t('gram_short')}</span>
                                  </td>
                                  <td className={`py-4 px-3 font-bold text-gray-700 ${isRtl ? 'text-left' : 'text-right'}`}>
                                    {(unitPrice || 0).toLocaleString()}
                                  </td>
                                  <td className={`py-4 px-3 font-black text-black text-lg ${isRtl ? 'text-left' : 'text-right'}`}>
                                    {(totalPrice || 0).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                {/* Totals & Signatures */}
                <div className="mt-auto">
                  <div className={`flex justify-between items-stretch gap-10 pt-10 border-t-4 border-black ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Signatures */}
                    <div className="flex-1 grid grid-cols-2 gap-12 text-center pt-2">
                      <div className="flex flex-col justify-between">
                        <p className="text-sm font-black border-b-2 border-black pb-2 uppercase tracking-tighter">{t('seller_signature')}</p>
                        <div className="h-24 flex items-center justify-center italic text-gray-300">Signature</div>
                        <p className="text-base font-black border-t border-gray-200 pt-2">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || (language === 'en' ? 'System Admin' : 'مدیر سیستم'))}</p>
                      </div>
                      <div className="flex flex-col justify-between">
                        <p className="text-sm font-black border-b-2 border-black pb-2 uppercase tracking-tighter">{t('customer_signature')}</p>
                        <div className="h-24 flex items-center justify-center italic text-gray-300">Seal/Signature</div>
                      </div>
                    </div>
                    
                    {/* Summary Card */}
                    <div className={`bg-gray-50 p-8 rounded-3xl min-w-[360px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className="space-y-4 divide-y divide-gray-300">
                        <div className={`flex justify-between items-center pb-3 text-gray-700 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                          <span className="text-base font-black uppercase">{t('total')} {t('items')}:</span>
                          <span className="text-xl font-black">{cart.reduce((sum, i) => sum + i.selectedQuantity, 0)} {t('product_name')}</span>
                        </div>
                        <div className={`flex justify-between items-center py-4 text-black ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                          <span className="text-2xl font-black uppercase">{t('total_payable')}:</span>
                          <div className={isRtl ? 'text-right' : 'text-left'}>
                            <span className="text-5xl font-black font-mono">{(totalAmount || 0).toLocaleString()}</span>
                            <span className="text-lg font-black mx-2 text-gray-600">{t('afghani')}</span>
                          </div>
                        </div>
                        <div className="pt-4">
                           <p className="text-[10px] font-black text-gray-400 italic text-center uppercase leading-tight">
                             {language === 'en' 
                               ? 'Amount in words: One Hundred Twenty Thousand Afghanis Only' 
                               : 'مبلغ به حروف: طبق ارقام فوق معتبر می‌باشد'}
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Terms */}
                  <div className="mt-12 pt-8 border-t-2 border-gray-200 text-center">
                    <p className="text-base font-black mb-4 leading-relaxed max-w-3xl mx-auto italic text-gray-700">" {shopInfo.footerText} "</p>
                    <div className="flex items-center justify-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1.5"><Gem size={12} /> KHAZANA JEWELRY SYSTEM</div>
                      <span className="opacity-30">•</span>
                      <span>SECURE & AUTHENTIC</span>
                      <span className="opacity-30">•</span>
                      <span>EST. {new Date().getFullYear()}</span>
                    </div>
                  </div>
                </div>

                <style>{`
                  @media screen {
                    .printable-invoice {
                      display: none;
                    }
                  }
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    .printable-invoice, .printable-invoice * {
                      visibility: visible;
                    }
                    .printable-invoice {
                      display: block !important;
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      margin: 0 !important;
                      padding: 20px !important;
                      background: white !important;
                    }
                  }
                `}</style>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal (Same as Inventory) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-kh-card/5 dark:border-dark-border flex justify-between items-center bg-kh-card text-kh-text">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-kh-gold" />
                <h3 className="text-lg font-bold">{t('add_item')}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-kh-text/60 hover:text-kh-text">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4">
                <div className="flex justify-center">
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-kh-card/10 flex flex-col items-center justify-center text-kh-text/40 cursor-pointer bg-kh-bg/30 relative overflow-hidden">
                    {selectedImage ? <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" /> : <Camera size={24} />}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-kh-text pr-1">{t('code')}</label>
                    <input required name="code" type="text" autoComplete="off" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.code} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-kh-text pr-1">{t('product_name')}</label>
                    <input required name="name" type="text" autoComplete="off" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-kh-text pr-1">{t('weight')} ({t('gram')})</label>
                    <input required name="weight" type="text" inputMode="decimal" autoComplete="off" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.weight} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-kh-text pr-1">{t('material')}</label>
                    <select required name="material" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.material} onChange={handleInputChange}>
                      <option value="gold">{t('gold')}</option>
                      <option value="silver">{t('silver')}</option>
                      <option value="jewelry">{t('jewelry')}</option>
                    </select>
                  </div>

                  {/* Conditional Fields Based on Material - Dynamic from Rates */}
                  {formData.material === 'gold' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-kh-text pr-1">{t('carat')}</label>
                      <select 
                        name="carat"
                        className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text"
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

                  {formData.material === 'silver' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-kh-text pr-1">{t('carat')}</label>
                      <select 
                        name="carat"
                        className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text"
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
                      <label className="text-[11px] font-bold text-kh-text pr-1">{t('stone_type')}</label>
                      {isAddingNewStoneType ? (
                        <div className="flex gap-2">
                          <input 
                            autoFocus
                            name="stoneType"
                            type="text" 
                            autoComplete="off"
                            placeholder={t('stone_type')}
                            className="flex-1 bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text"
                            value={formData.stoneType}
                            onChange={handleInputChange}
                          />
                          <button 
                            type="button"
                            onClick={handleConfirmNewStone}
                            className="bg-kh-gold text-white px-2 rounded-lg text-[10px] font-bold hover:bg-kh-gold/80 transition-colors"
                          >
                            {t('confirm')}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsAddingNewStoneType(false)}
                            className="bg-kh-card text-kh-text px-2 rounded-lg text-[10px] font-bold"
                          >
                            {t('list')}
                          </button>
                        </div>
                      ) : (
                        <select 
                          name="stoneType"
                          className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-kh-card/20 text-kh-text"
                          value={formData.stoneType}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('stone_type')}</option>
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
                          <option value="ADD_NEW_STONE" className="font-bold text-kh-gold">+ {t('add_item')}</option>
                        </select>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-kh-text pr-1">{t('origin')}</label>
                    {isAddingNewOrigin ? (
                      <div className="flex gap-1">
                        <input 
                          autoFocus 
                          name="origin" 
                          type="text" 
                          autoComplete="off"
                          className="flex-1 bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-[10px] text-kh-text" 
                          placeholder={t('origin')}
                          value={formData.origin} 
                          onChange={handleInputChange} 
                        />
                        <button 
                          type="button"
                          disabled={isConfirmingOrigin}
                          onClick={handleConfirmNewOrigin}
                          className="bg-kh-gold text-white px-2 rounded-lg text-[10px] font-bold hover:bg-kh-gold/80 transition-colors disabled:opacity-50"
                        >
                          {isConfirmingOrigin ? '...' : t('confirm')}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingNewOrigin(false)} 
                          className="bg-kh-card text-kh-text px-2 rounded-lg text-[10px] font-bold"
                        >
                          {t('list')}
                        </button>
                      </div>
                    ) : (
                      <select name="origin" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.origin} onChange={handleInputChange}>
                        <option value="">{t('origin')}</option>
                        {uniqueOrigins.map(origin => <option key={origin} value={origin}>{origin}</option>)}
                        <option value="ADD_NEW_ORIGIN" className="font-bold text-kh-gold">+ {t('add_item')}</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-kh-text pr-1">{t('quantity')}</label>
                    <input required name="quantity" type="text" inputMode="numeric" autoComplete="off" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.quantity} onChange={handleInputChange} />
                  </div>

                  {formData.material === 'jewelry' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-kh-text pr-1">{t('price')}</label>
                      <input name="price" type="text" inputMode="decimal" autoComplete="off" className="w-full bg-kh-bg/50 border border-kh-card/10 rounded-lg p-2 text-xs text-kh-text" value={formData.price} onChange={handleInputChange} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-kh-card/5 bg-kh-bg/30 flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-kh-card/10 rounded-lg text-xs font-bold text-kh-text">{t('cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-2 px-4 py-2.5 bg-kh-card text-kh-text rounded-lg text-xs font-bold shadow-md">
                  {isSubmitting ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    <style>{`
      @media screen {
        .printable-invoice {
          display: none;
        }
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-invoice, .printable-invoice * {
          visibility: visible;
        }
        .printable-invoice {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 20px !important;
          background: white !important;
        }
      }
    `}</style>
    </div>
  );
};

export default POS;
