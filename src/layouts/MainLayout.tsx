import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Settings as SettingsIcon,
  Gem,
  Menu,
  X,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const SidebarItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg transition-colors ${
        isActive 
          ? 'bg-kh-gold text-black shadow-lg shadow-kh-gold/20' 
          : 'text-kh-text/60 dark:text-kh-gold/60 hover:bg-kh-card/5 dark:hover:bg-kh-gold/5 hover:text-kh-text dark:hover:text-kh-gold'
      }`
    }
  >
    <Icon size={18} />
    <span className="font-bold text-sm">{label}</span>
  </NavLink>
);

const MainLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, language } = useSettings();

  const isRtl = language !== 'en';

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('khazana_user') || '{}');
    } catch {
      return {};
    }
  })();

  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.username || t('admin'));
  const displayRole = user.role === 'admin' ? t('admin') : t('seller');
  const displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4AF37&color=fff`;

  return (
    <div className={`flex min-h-screen bg-kh-bg dark:bg-dark-bg text-kh-text dark:text-dark-text relative transition-colors duration-300 ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} w-72 border-black/5 dark:border-dark-border bg-white dark:bg-dark-card z-40 transition-transform duration-300 lg:translate-x-0 h-screen
        ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}
      `}>
        <div className="p-6 h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-3">
              <Gem className="text-kh-gold" size={32} />
              <h1 className="text-2xl font-bold text-kh-text dark:text-kh-gold tracking-tight">{t('shop_name')}</h1>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-kh-text/40 hover:text-kh-text"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Profile Info */}
          <div className="mb-6 p-3 bg-kh-bg/30 dark:bg-black/20 rounded-xl border border-kh-card/5 dark:border-dark-border flex items-center gap-3 group hover:border-kh-gold/30 transition-all cursor-pointer shrink-0">
            <div className="w-9 h-9 rounded-lg overflow-hidden shadow-sm shrink-0">
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-[11px] font-black text-kh-text dark:text-kh-gold truncate leading-tight">{displayName}</p>
              <p className="text-[9px] text-kh-muted truncate leading-tight">{displayRole}</p>
            </div>
            {isRtl ? <ChevronLeft size={12} className="text-kh-text/20" /> : <ChevronRight size={12} className="text-kh-text/20" />}
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/inventory" icon={Package} label={t('inventory')} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/pos" icon={ShoppingCart} label={t('pos')} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/rates" icon={TrendingUp} label={t('rates')} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/returns" icon={ShoppingBag} label={t('returns')} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/reports" icon={BarChart3} label={t('reports')} onClick={() => setIsSidebarOpen(false)} />
            {(user.role === 'admin' || user.is_superuser || user.username === 'admin') && (
              <>
                <SidebarItem to="/users" icon={Users} label={t('users')} onClick={() => setIsSidebarOpen(false)} />
                <SidebarItem to="/settings" icon={SettingsIcon} label={t('settings')} onClick={() => setIsSidebarOpen(false)} />
              </>
            )}
          </nav>
          
          <div className="pt-6 mt-6 border-t border-black/5 dark:border-dark-border space-y-4 shrink-0">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold text-sm"
            >
              <LogOut size={20} />
              <span>{t('logout')}</span>
            </button>
            <div className="text-[10px] text-kh-text/30 text-center font-medium">
              {t('khazana_v')}
            </div>
          </div>
        </div>
      </aside>

      {/* Placeholder to reserve space for fixed sidebar on large screens */}
      <div className="hidden lg:block w-72 shrink-0 h-screen" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Header */}
        <header className="lg:hidden flex items-center gap-4 p-4 bg-white dark:bg-dark-card border-b border-black/5 dark:border-dark-border sticky top-0 z-20 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-kh-text dark:text-kh-gold hover:bg-kh-card/5 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Gem className="text-kh-gold" size={24} />
            <span className="text-lg font-bold text-kh-text dark:text-kh-gold">{t('shop_name')}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
