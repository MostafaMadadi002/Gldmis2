import React, { useState, useRef } from 'react';
import { 
  Store, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  Database, 
  Download, 
  Upload, 
  Save,
  Globe,
  Moon,
  Sun,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useSettings, SettingsContextType } from '../context/SettingsContext';

const Settings: React.FC = () => {
  const { 
    language, setLanguage, 
    theme, setTheme, 
    shopInfo, setShopInfo, 
    logo, setLogo,
    saveSettings,
    t 
  } = useSettings() as SettingsContextType;

  const isRtl = language !== 'en';
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShopInfo({ ...shopInfo, [name]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await saveSettings();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = () => {
    const data = {
      settings: localStorage.getItem('khazana_settings'),
      inventory: localStorage.getItem('khazana_inventory'),
      users: localStorage.getItem('khazana_users'),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('khazana_last_backup', JSON.stringify(data));
    alert(t('success_save'));
  };

  const handleExport = () => {
    const data = {
      settings: JSON.parse(localStorage.getItem('khazana_settings') || '{}'),
      inventory: JSON.parse(localStorage.getItem('khazana_inventory') || '[]'),
      users: JSON.parse(localStorage.getItem('khazana_users') || '[]'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khazana_backup_${new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.settings) {
            localStorage.setItem('khazana_settings', JSON.stringify(data.settings));
            window.location.reload();
          }
        } catch (err) {
          alert('Error restoring backup.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-kh-text dark:text-kh-gold flex items-center gap-3">
          <div className="p-2 bg-kh-gold/10 rounded-xl">
            <Store className="text-kh-gold" size={24} />
          </div>
          {t('settings')}
        </h2>
        {showSuccess && (
          <div className={`flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl animate-fade-in ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold">{t('success_save')}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className={`space-y-8 ${isRtl ? 'text-right' : 'text-left'}`}>
        {/* Shop Information Section */}
        <section className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl shadow-sm overflow-hidden">
          <div className={`p-6 border-b border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/20 flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
            <Store size={20} className="text-kh-gold" />
            <h3 className="text-lg font-bold text-kh-text dark:text-kh-gold">
              {t('shop_name')} / {t('inventory')}
            </h3>
          </div>
          <div className="p-8 space-y-8">
            <div className={`flex flex-col md:flex-row gap-10 items-start ${isRtl ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-4 shrink-0 mx-auto md:mx-0">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 rounded-3xl border-2 border-dashed border-kh-card/10 dark:border-dark-border flex flex-col items-center justify-center text-kh-text/40 hover:border-kh-gold hover:text-kh-gold transition-all cursor-pointer bg-kh-bg/30 dark:bg-black/20 relative overflow-hidden group shadow-inner"
                >
                  {logo ? (
                    <img src={logo} alt="Shop Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <Camera size={40} />
                      <span className="text-[11px] mt-2 font-bold text-center px-4">{t('select_logo')}</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-kh-text">
                    <ImageIcon size={24} />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-kh-text/30">{t('suggested_logo')}</p>
              </div>

              {/* Text Inputs */}
              <div className="flex-1 w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-kh-text/60 dark:text-kh-gold/60 px-1 flex items-center gap-1">
                    {t('shop_name')}
                  </label>
                  <div className="relative">
                    <input 
                      required
                      name="name"
                      type="text" 
                      placeholder={language === 'en' ? 'e.g. Khazana Jewelry' : (language === 'ps' ? 'مثلاً: جواهری خزانه' : 'مثلاً: جواهری خزانه')}
                      className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ${isRtl ? 'text-right pr-12' : 'text-left pl-12'}`}
                      value={shopInfo.name}
                      onChange={handleInputChange}
                    />
                    <Store className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-kh-text/20 dark:text-kh-gold/20`} size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-kh-text/60 dark:text-kh-gold/60 px-1 flex items-center gap-1">
                      {t('shop_phone')}
                    </label>
                    <div className="relative">
                      <input 
                        required
                        name="phone"
                        type="tel" 
                        placeholder="07XXXXXXXX"
                        className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ltr ${isRtl ? 'text-right pr-12' : 'text-left pl-12'}`}
                        value={shopInfo.phone}
                        onChange={handleInputChange}
                      />
                      <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-kh-text/20 dark:text-kh-gold/20`} size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-kh-text/60 dark:text-kh-gold/60 px-1 flex items-center gap-1">
                      {t('shop_address')}
                    </label>
                    <div className="relative">
                      <input 
                        required
                        name="address"
                        type="text" 
                        placeholder={language === 'en' ? 'Detailed address...' : (language === 'ps' ? 'بشپړ پته...' : 'آدرس دقیق...')}
                        className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ${isRtl ? 'text-right pr-12' : 'text-left pl-12'}`}
                        value={shopInfo.address}
                        onChange={handleInputChange}
                      />
                      <MapPin className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-kh-text/20 dark:text-kh-gold/20`} size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-kh-text/60 dark:text-kh-gold/60 px-1 flex items-center gap-1">
                    {t('shop_description')}
                  </label>
                  <div className="relative">
                    <input 
                      name="description"
                      type="text" 
                      placeholder={language === 'en' ? 'Short description or slogan...' : (language === 'ps' ? 'لنډ معلومات یا شعار...' : 'توضیحات کوتاه یا شعار فروشگاه...')}
                      className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                      value={shopInfo.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-kh-text/60 dark:text-kh-gold/60 px-1 flex items-center gap-1">
                    {t('invoice_footer')}
                  </label>
                  <div className="relative">
                    <textarea 
                      name="footerText"
                      rows={2}
                      placeholder={language === 'en' ? 'Text that will be printed at the end of the invoice...' : (language === 'ps' ? 'هغه متن چې د فاکتور په پای کې چاپ کیږي...' : 'متنی که در انتهای فاکتور چاپ می‌شود...')}
                      className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all resize-none ${isRtl ? 'text-right' : 'text-left'}`}
                      value={shopInfo.footerText}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Backup and System Data */}
        <section className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl shadow-sm overflow-hidden text-center">
          <div className={`p-6 border-b border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/20 flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
            <Database size={20} className="text-kh-gold" />
            <h3 className="text-lg font-bold text-kh-text dark:text-kh-gold">
              {t('backup_system')}
            </h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                type="button"
                onClick={handleBackup}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-kh-card/5 dark:border-dark-border hover:bg-kh-bg/50 dark:hover:bg-black/20 hover:border-kh-gold/30 transition-all group"
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Database size={24} />
                </div>
                <span className="text-sm font-bold text-kh-text dark:text-dark-text">{t('create_backup')}</span>
              </button>

              <button 
                type="button"
                onClick={handleExport}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-kh-card/5 dark:border-dark-border hover:bg-kh-bg/50 dark:hover:bg-black/20 hover:border-kh-gold/30 transition-all group"
              >
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Download size={24} />
                </div>
                <span className="text-sm font-bold text-kh-text dark:text-dark-text">{t('export_backup')}</span>
              </button>

              <button 
                type="button"
                onClick={handleRestore}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-kh-card/5 dark:border-dark-border hover:bg-kh-bg/50 dark:hover:bg-black/20 hover:border-kh-gold/30 transition-all group"
              >
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <span className="text-sm font-bold text-kh-text dark:text-dark-text">{t('restore_backup')}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Appearance and Language */}
        <div className="grid grid-cols-1 gap-8 text-center">
          {/* Language Selection */}
          <section className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl shadow-sm overflow-hidden">
            <div className={`p-5 border-b border-kh-card/5 dark:border-dark-border bg-kh-bg/30 dark:bg-black/20 flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <Globe size={18} className="text-kh-gold" />
              <h3 className="text-md font-bold text-kh-text dark:text-kh-gold">{t('language')}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'fa', label: 'دری (افغانستان)', desc: 'زبان پیش‌فرض' },
                  { id: 'ps', label: 'پشتو (افغانستان)', desc: 'پښتو ژبه' },
                  { id: 'en', label: 'English', desc: 'System Language' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id as any)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      language === lang.id 
                        ? 'border-kh-gold bg-kh-gold/5 dark:bg-kh-gold/10 shadow-sm' 
                        : 'border-kh-card/5 dark:border-dark-border hover:bg-kh-bg/50 dark:hover:bg-black/20'
                    } ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <div className="text-sm font-bold text-kh-text dark:text-dark-text">{lang.label}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      language === lang.id ? 'border-kh-gold bg-kh-gold' : 'border-kh-card/10'
                    }`}>
                      {language === lang.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-kh-card text-kh-text rounded-2xl text-sm font-black hover:bg-kh-card/90 shadow-xl shadow-kh-gold/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={18} />
                {t('save_settings')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
