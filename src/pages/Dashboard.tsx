import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Database, Diamond, TrendingUp, ShoppingCart, AlertTriangle, ArrowRight, Package, Flame, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useInventory } from '../context/InventoryContext';
import { useRates } from '../context/RatesContext';
import { getFullAfghanJalaliDate, toISODate } from '../lib/dateUtils';
import { calculateSaleProfit } from '../lib/profitUtils';

const StatCard = ({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  detail, 
  totalValue,
  accentColor
}: { 
  label: string; 
  value: string; 
  unit: string; 
  icon: any; 
  detail?: React.ReactNode; 
  totalValue?: number;
  accentColor?: string;
}) => {
  const { t } = useSettings();
  const hasTotalValue = typeof totalValue === 'number' && !isNaN(totalValue);

  return (
    <div className="bg-kh-card dark:bg-dark-card border border-black/5 dark:border-dark-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <p className="text-kh-text/70 dark:text-kh-gold/70 text-sm mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-kh-text dark:text-kh-gold">{value}</span>
              <span className="text-kh-text/50 dark:text-kh-gold/50 text-xs">{unit}</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            accentColor === 'amber' 
              ? 'bg-amber-500/15 text-amber-500' 
              : 'bg-white/10 dark:bg-kh-gold/10 text-kh-gold'
          }`}>
            <Icon size={24} />
          </div>
        </div>
        
        {detail && (
          <div className="border-t border-black/5 dark:border-white/5 pt-3">
            {detail}
          </div>
        )}
      </div>
      
      {hasTotalValue && (
        <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-3 flex justify-between items-center">
          <span className="text-[10px] text-kh-text/50 dark:text-kh-gold/50 font-bold uppercase">{t('total_value')}</span>
          <span className="text-sm font-black text-kh-gold">
            {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-[10px] font-normal">{t('afghani')}</span>
          </span>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { products, sales, expenses, isLoading: isInventoryLoading } = useInventory();
  const { rates: allRates, isLoading: isRatesLoading } = useRates();
  const { t, language } = useSettings();

  const isLoading = isInventoryLoading || isRatesLoading;

  const ratesArray = Array.isArray(allRates) ? allRates : [];
  const goldRates = ratesArray.filter(r => r && r.type === 'gold');
  const silverRates = ratesArray.filter(r => r && r.type === 'silver');
  const currencyRates = ratesArray.filter(r => r && r.type === 'currency');

  const todayDate = language === 'en' 
    ? new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : getFullAfghanJalaliDate(new Date());

  const stats = useMemo(() => {
    const productsArray = Array.isArray(products) ? products.filter(Boolean) : [];
    
    // Smart rate finder
    const getRate = (ratesList: any[], carat?: string) => {
      if (!carat) return 0;
      const found = ratesList.find(r => r && (r.label === carat || r.label?.includes(carat) || carat.includes(r.label)));
      return found ? (Number(found.value) || 0) : 0;
    };

    // Gold stats
    // Products that are active inventory or stock for resale (exclude melted products from regular sellable gold)
    const activeGoldProducts = productsArray.filter(
      (p: any) => p && p.material === 'gold' && p.secondHandDestination !== 'melt' && p.second_hand_destination !== 'melt'
    );
    const goldByCarat: Record<string, { weight: number; value: number }> = {};
    let totalGoldWeight = 0;
    let totalGoldValue = 0;
    
    activeGoldProducts.forEach((p: any) => {
      const weight = (Number(p.weight) || 0) * (Number(p.quantity) || 0);
      const caratLabel = p.carat ? p.carat.trim() : (language === 'en' ? 'Other' : 'سایر');
      const rate = getRate(goldRates, p.carat);
      const value = weight * rate;
      
      if (!goldByCarat[caratLabel]) {
        goldByCarat[caratLabel] = { weight: 0, value: 0 };
      }
      goldByCarat[caratLabel].weight += weight;
      goldByCarat[caratLabel].value += value;
      totalGoldWeight += weight;
      totalGoldValue += value;
    });

    // Melted Gold stats (Gold categorized by carat intended for melting)
    // 1. Inflow from second-hand purchases marked for melt
    const meltedGoldInflow = productsArray.filter(
      (p: any) => p && p.material === 'gold' && (p.secondHandDestination === 'melt' || p.second_hand_destination === 'melt')
    );

    // 2. Outflow: products registered in inventory that deducted from melted gold reserve (weight * quantity for that carat)
    const meltedDeductions = productsArray.filter(
      (p: any) => p && p.material === 'gold' && (p.deductFromMelt || p.deduct_from_melt) && p.secondHandDestination !== 'melt' && p.second_hand_destination !== 'melt'
    );

    const meltedInflowByCarat: Record<string, number> = {};
    const meltedDeductionsByCarat: Record<string, number> = {};
    let totalDeductedMeltWeight = 0;

    meltedGoldInflow.forEach((p: any) => {
      const weight = (Number(p.weight) || 0) * (Number(p.quantity) || 1);
      const caratLabel = p.carat ? p.carat.trim() : (language === 'en' ? 'Other' : 'سایر');
      meltedInflowByCarat[caratLabel] = (meltedInflowByCarat[caratLabel] || 0) + weight;
    });

    meltedDeductions.forEach((p: any) => {
      const weight = (Number(p.weight) || 0) * (Number(p.quantity) || 1);
      const caratLabel = p.carat ? p.carat.trim() : (language === 'en' ? 'Other' : 'سایر');
      meltedDeductionsByCarat[caratLabel] = (meltedDeductionsByCarat[caratLabel] || 0) + weight;
      totalDeductedMeltWeight += weight;
    });

    const allMeltCarats = Array.from(new Set([...Object.keys(meltedInflowByCarat), ...Object.keys(meltedDeductionsByCarat)]));
    const meltedByCarat: Record<string, { weight: number; value: number; rawWeight: number; deductedWeight: number }> = {};
    let totalMeltedGoldWeight = 0;
    let totalMeltedGoldValue = 0;

    allMeltCarats.forEach((caratLabel) => {
      const rawWeight = meltedInflowByCarat[caratLabel] || 0;
      const deductedWeight = meltedDeductionsByCarat[caratLabel] || 0;
      const netWeight = Math.max(0, rawWeight - deductedWeight);
      const rate = getRate(goldRates, caratLabel);
      const value = netWeight * rate;

      meltedByCarat[caratLabel] = {
        weight: netWeight,
        value,
        rawWeight,
        deductedWeight
      };
      totalMeltedGoldWeight += netWeight;
      totalMeltedGoldValue += value;
    });

    // Silver stats
    const silverProducts = productsArray.filter((p: any) => p && p.material === 'silver');
    const silverByCarat: Record<string, { weight: number; value: number }> = {};
    let totalSilverWeight = 0;
    let totalSilverValue = 0;
    
    silverProducts.forEach((p: any) => {
      const weight = (Number(p.weight) || 0) * (Number(p.quantity) || 0);
      const caratLabel = p.carat ? p.carat.trim() : (language === 'en' ? 'Other' : 'سایر');
      const rate = getRate(silverRates, p.carat);
      const value = weight * rate;
      
      if (!silverByCarat[caratLabel]) {
        silverByCarat[caratLabel] = { weight: 0, value: 0 };
      }
      silverByCarat[caratLabel].weight += weight;
      silverByCarat[caratLabel].value += value;
      totalSilverWeight += weight;
      totalSilverValue += value;
    });

    // Jewelry stats
    const jewelryProducts = productsArray.filter((p: any) => p && p.material === 'jewelry');
    const jewelryCount = jewelryProducts.reduce((sum, p: any) => sum + (Number(p?.quantity) || 0), 0);
    const totalJewelryValue = jewelryProducts.reduce((sum, p: any) => {
      const itemPrice = Number(p?.price) || 0;
      const itemQuantity = Number(p?.quantity) || 0;
      return sum + (itemPrice * itemQuantity);
    }, 0);
    
    // Financial Stats: Sales, Profit, and Deductions/Expenses
    const todayISODate = toISODate(new Date());
    const salesArray = Array.isArray(sales) ? sales.filter(Boolean) : [];
    const expensesArray = Array.isArray(expenses) ? expenses.filter(Boolean) : [];

    const todaySalesList = salesArray.filter((s: any) => s && s.date && toISODate(s.date) === todayISODate);
    const todaySalesAmount = todaySalesList.reduce((sum, s: any) => sum + (Number(s?.totalAmount) || 0), 0);

    // Calculate profit for today's sales
    let todayProfitAmount = 0;
    todaySalesList.forEach((sale: any) => {
      const breakdown = calculateSaleProfit(sale, productsArray);
      todayProfitAmount += breakdown.profit;
    });

    // Calculate today's expenses / deductions
    const todayExpensesAmount = expensesArray
      .filter((e: any) => e && e.date && toISODate(e.date) === todayISODate)
      .reduce((sum, e: any) => sum + (Number(e?.amount) || 0), 0);

    const todayNetProfitAmount = todayProfitAmount - todayExpensesAmount;

    // Calculate this month's profit
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthSales = salesArray.filter((s: any) => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    let thisMonthGrossProfit = 0;
    thisMonthSales.forEach((sale: any) => {
      const breakdown = calculateSaleProfit(sale, productsArray);
      thisMonthGrossProfit += breakdown.profit;
    });

    const thisMonthExpenses = expensesArray
      .filter((e: any) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e: any) => sum + (Number(e?.amount) || 0), 0);

    const thisMonthNetProfit = thisMonthGrossProfit - thisMonthExpenses;

    // Calculate total all-time profit and expenses
    let totalAllSalesAmount = 0;
    let totalAllProfitAmount = 0;
    salesArray.forEach((sale: any) => {
      totalAllSalesAmount += Number(sale?.totalAmount) || 0;
      const breakdown = calculateSaleProfit(sale, productsArray);
      totalAllProfitAmount += breakdown.profit;
    });

    const totalAllExpensesAmount = expensesArray.reduce((sum, e: any) => sum + (Number(e?.amount) || 0), 0);
    const totalAllNetProfitAmount = totalAllProfitAmount - totalAllExpensesAmount;

    // Low stock items (quantity <= minQuantity or quantity === 0)
    const lowStockItems = productsArray.filter((p: any) => p && !p.isReturned && (Number(p.quantity) || 0) <= (p.minQuantity ?? 1));

    return {
      gold: totalGoldWeight.toFixed(2),
      goldValue: totalGoldValue,
      goldByCarat,
      meltedGold: totalMeltedGoldWeight.toFixed(2),
      meltedGoldValue: totalMeltedGoldValue,
      meltedByCarat,
      totalDeductedMeltWeight,
      silver: totalSilverWeight.toFixed(2),
      silverValue: totalSilverValue,
      silverByCarat,
      jewelry: jewelryCount.toString(),
      jewelryValue: totalJewelryValue,
      todaySales: todaySalesAmount,
      todayProfit: todayProfitAmount,
      todayExpenses: todayExpensesAmount,
      todayNetProfit: todayNetProfitAmount,
      thisMonthProfit: thisMonthNetProfit,
      totalSales: totalAllSalesAmount,
      totalProfit: totalAllProfitAmount,
      totalExpenses: totalAllExpensesAmount,
      totalNetProfit: totalAllNetProfitAmount,
      lowStockItems,
      lowStockCount: lowStockItems.length
    };
  }, [products, sales, expenses, goldRates, silverRates]);

  return (
    <div className="space-y-8 relative">
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-kh-bg/50 dark:bg-dark-bg/50 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
          <div className="w-8 h-8 border-4 border-kh-gold/20 border-t-kh-gold rounded-full animate-spin"></div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className={language === 'en' ? 'text-left' : 'text-right'}>
          <h2 className="text-3xl font-bold mb-2 text-kh-text dark:text-kh-gold">{t('welcome')}</h2>
          <p className="text-kh-muted">{language === 'en' ? 'Welcome to Khazana Management System.' : 'به سیستم مدیریت خزانه خوش آمدید.'}</p>
        </div>
        <div className={`flex flex-col ${language === 'en' ? 'items-start' : 'items-end'} gap-3 w-full sm:w-auto`}>
          <p className="text-kh-muted text-sm">{t('today')}: {todayDate}</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link 
              to="/showroom"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-kh-bg dark:bg-white/5 text-kh-text dark:text-kh-gold border border-kh-card/10 dark:border-white/10 px-4 h-10 rounded-lg text-sm font-bold hover:bg-kh-gold hover:text-black transition-all group"
            >
              <Flame size={18} className="text-kh-gold group-hover:text-black" />
              <span className="leading-none mb-0.5">{t('start_showroom')}</span>
            </Link>
            <Link 
              to="/pos"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-kh-card dark:bg-kh-gold text-black dark:text-black px-4 h-10 rounded-lg text-sm font-medium hover:bg-kh-card/90 transition-colors shadow-sm"
            >
              <ShoppingCart size={18} />
              <span className="leading-none mb-0.5">{t('new_sale')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory & Low Stock Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* طلای ساخته‌شده / موجودی فروش */}
        <StatCard 
          label={t('gold')} 
          value={stats.gold} 
          unit={t('gram')} 
          icon={Coins} 
          totalValue={stats.goldValue}
          detail={
            <div className="space-y-1">
              {(Object.entries(stats.goldByCarat) as [string, { weight: number; value: number }][]).length === 0 ? (
                <p className="text-xs text-kh-muted text-center py-1">
                  {language === 'en' ? 'No stock' : 'موجودی خالی'}
                </p>
              ) : (
                (Object.entries(stats.goldByCarat) as [string, { weight: number; value: number }][]).map(([carat, data]) => (
                  <div key={carat} className="flex justify-between items-center text-[13px] py-0.5">
                    <span className="text-kh-muted font-medium">{carat}</span>
                    <span className="font-bold text-kh-text dark:text-kh-gold">
                      {(Number(data?.weight) || 0).toFixed(2)} {t('gram')}
                    </span>
                  </div>
                ))
              )}
            </div>
          }
        />

        {/* کارت اختصاصی طلای ذوب شده (آب‌شده) به تفکیک عیار */}
        <StatCard 
          label={t('melted_gold')} 
          value={stats.meltedGold} 
          unit={t('gram')} 
          icon={Flame} 
          totalValue={stats.meltedGoldValue}
          accentColor="amber"
          detail={
            <div className="space-y-1.5">
              {(Object.entries(stats.meltedByCarat) as [string, { weight: number; value: number; rawWeight?: number; deductedWeight?: number }][]).length === 0 ? (
                <p className="text-xs text-kh-muted text-center py-1">
                  {language === 'en' ? 'No melted gold' : 'طلای ذوبی ثبت نشده'}
                </p>
              ) : (
                <>
                  {(Object.entries(stats.meltedByCarat) as [string, { weight: number; value: number; rawWeight?: number; deductedWeight?: number }][]).map(([carat, data]) => (
                    <div key={carat} className="flex justify-between items-center text-[12px] bg-amber-500/5 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/10">
                      <div className="flex flex-col">
                        <span className="font-bold text-amber-700 dark:text-amber-400">{carat}</span>
                        {(Number(data?.deductedWeight) || 0) > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400/90 font-medium">
                            {language === 'en' ? `-${data.deductedWeight?.toFixed(2)}g crafted` : `(-${data.deductedWeight?.toFixed(2)} گرم کسر ساخت)`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-kh-text dark:text-dark-text">
                            {(Number(data?.weight) || 0).toFixed(2)} {t('gram')}
                          </span>
                          {Number(data?.value) > 0 && (
                            <span className="text-[10px] text-kh-muted">
                              ({Math.round(data.value).toLocaleString()} {t('afghani')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {Number(stats.totalDeductedMeltWeight) > 0 && (
                    <div className="pt-1 mt-1 border-t border-dashed border-amber-500/20 flex justify-between text-[11px] text-amber-700 dark:text-amber-400 font-bold px-1">
                      <span>{language === 'en' ? 'Total Crafted to Inventory:' : 'مجموع کسر شده برای انبار:'}</span>
                      <span>{Number(stats.totalDeductedMeltWeight).toFixed(2)} {t('gram')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          }
        />

        {/* نقره */}
        <StatCard 
          label={t('silver')} 
          value={stats.silver} 
          unit={t('gram')} 
          icon={Database} 
          totalValue={stats.silverValue}
          detail={
            <div className="space-y-1">
              {(Object.entries(stats.silverByCarat) as [string, { weight: number; value: number }][]).length === 0 ? (
                <p className="text-xs text-kh-muted text-center py-1">
                  {language === 'en' ? 'No stock' : 'موجودی خالی'}
                </p>
              ) : (
                (Object.entries(stats.silverByCarat) as [string, { weight: number; value: number }][]).map(([carat, data]) => (
                  <div key={carat} className="flex justify-between items-center text-[13px] py-0.5">
                    <span className="text-kh-muted font-medium">{carat}</span>
                    <span className="font-bold text-kh-text dark:text-kh-gold">
                      {(Number(data?.weight) || 0).toFixed(2)} {t('gram')}
                    </span>
                  </div>
                ))
              )}
            </div>
          }
        />

        {/* جواهرات */}
        <StatCard 
          label={t('jewelry')} 
          value={stats.jewelry} 
          unit={t('piece')} 
          icon={Diamond} 
          totalValue={stats.jewelryValue}
        />

        {/* کارت هشدار حداقل موجودی */}
        <div 
          id="dashboard-low-stock-alert-card"
          className={`border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all ${
            stats.lowStockCount > 0 
              ? 'bg-amber-500/10 dark:bg-amber-500/[0.08] border-amber-500/30 dark:border-amber-400/30' 
              : 'bg-kh-card dark:bg-dark-card border-black/5 dark:border-dark-border'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-right">
                <p className="text-amber-700 dark:text-amber-400 text-xs font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500 animate-pulse" />
                  {language === 'en' ? 'Low Stock Alerts' : 'هشدار حداقل موجودی'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${stats.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-kh-text dark:text-kh-gold'}`}>
                    {stats.lowStockCount}
                  </span>
                  <span className="text-kh-text/50 dark:text-kh-gold/50 text-xs">
                    {language === 'en' ? 'Items' : 'قلم کالا'}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stats.lowStockCount > 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-white/10 text-kh-gold'
              }`}>
                <AlertTriangle size={24} />
              </div>
            </div>

            {stats.lowStockCount > 0 ? (
              <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto pr-1">
                {stats.lowStockItems.slice(0, 3).map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between text-xs bg-white/40 dark:bg-black/20 p-1.5 rounded-lg border border-amber-500/15">
                    <span className="font-bold truncate max-w-[110px] text-kh-text dark:text-dark-text">{item.name}</span>
                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                      {item.quantity} / <span className="opacity-60">{item.minQuantity ?? 1}</span>
                    </span>
                  </div>
                ))}
                {stats.lowStockCount > 3 && (
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 text-center font-bold">
                    + {stats.lowStockCount - 3} {language === 'en' ? 'more items' : 'کالای دیگر'}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                ✓ {language === 'en' ? 'All stock above minimum limits' : 'تمام موجودی‌ها در وضعیت مطلوب است'}
              </p>
            )}
          </div>

          <Link
            id="dashboard-low-stock-alert-card-link"
            to="/low-stock"
            className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors group"
          >
            <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all group-hover:after:w-full">
              {language === 'en' ? 'View All Alerts' : 'مشاهده تمام هشدارها'}
            </span>
            <div className="p-1 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-all">
              <ArrowRight size={14} className={language === 'en' ? 'group-hover:translate-x-0.5 transition-transform' : 'rotate-180 group-hover:-translate-x-0.5 transition-transform'} />
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* Sales & Profit Financial Summary (30%) */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          <div className={`bg-kh-card dark:bg-dark-card rounded-2xl p-5 sm:p-6 text-kh-text dark:text-kh-gold flex flex-col justify-between shadow-xl h-full border border-black/5 dark:border-dark-border ${language === 'en' ? 'text-left' : 'text-right'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-kh-text/70 dark:text-kh-gold/70 text-xs font-bold">{t('today_sales')}</p>
                  <h3 className="text-2xl font-black mt-0.5 text-kh-text dark:text-kh-gold font-mono">
                    {Number(stats.todaySales || 0).toLocaleString()} <span className="text-xs font-normal">{t('afghani')}</span>
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} />
                </div>
              </div>

              {/* Profit and Expense Breakdown */}
              <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-kh-text/70 dark:text-kh-gold/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {t('today_profit')}:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                    +{Number(stats.todayProfit || 0).toLocaleString()} {t('afghani')}
                  </span>
                </div>

                {stats.todayExpenses > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-red-500/90 dark:text-red-400/90 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      {t('expense_deduction')}:
                    </span>
                    <span className="font-bold text-red-500 dark:text-red-400 font-mono">
                      -{Number(stats.todayExpenses || 0).toLocaleString()} {t('afghani')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5 font-black text-xs">
                  <span className="text-kh-text dark:text-kh-gold">{t('net_profit')} ({t('today')}):</span>
                  <span className={`font-mono ${stats.todayNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {stats.todayNetProfit >= 0 ? '+' : ''}{Number(stats.todayNetProfit || 0).toLocaleString()} {t('afghani')}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5 font-black text-xs bg-kh-gold/5 -mx-5 px-5 py-2">
                  <span className="text-kh-text dark:text-kh-gold">{language === 'en' ? 'Profit This Month' : 'سود خالص این ماه'}:</span>
                  <span className={`font-mono ${stats.thisMonthProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {stats.thisMonthProfit >= 0 ? '+' : ''}{Number(stats.thisMonthProfit || 0).toLocaleString()} {t('afghani')}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Profit & Navigation */}
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-kh-text/60 dark:text-kh-gold/60 font-bold">{t('total_profit')}:</span>
                <span className={`font-black font-mono ${stats.totalNetProfit >= 0 ? 'text-kh-gold' : 'text-red-400'}`}>
                  {stats.totalNetProfit >= 0 ? '+' : ''}{Number(stats.totalNetProfit || 0).toLocaleString()} {t('afghani')}
                </span>
              </div>

              <Link
                to="/reports"
                className="w-full mt-2 flex items-center justify-between text-[11px] font-bold text-kh-gold hover:underline pt-1"
              >
                <span>{language === 'en' ? 'Financial Reports & Deductions' : 'گزارش مفاد و کسر پول / مصارف'}</span>
                <ArrowRight size={13} className={language === 'en' ? '' : 'rotate-180'} />
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Rates (70%) */}
        <div className="lg:col-span-7 bg-kh-card dark:bg-dark-card border border-black/5 dark:border-dark-border rounded-2xl p-5 shadow-xl h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-kh-gold" />
              <h3 className="text-lg font-bold text-kh-text dark:text-kh-gold">{t('rates')}</h3>
            </div>
            <p className="text-[10px] text-kh-text/50 dark:text-kh-gold/50">{todayDate}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gold Table */}
            <div className="space-y-1">
              <h4 className={`text-[14px] font-bold text-kh-gold border-kh-gold ${language === 'en' ? 'border-l-2 pl-2' : 'border-r-2 pr-2'}`}>{t('gold_rates')}</h4>
              <div className="overflow-hidden rounded-lg border border-black/5 dark:border-white/10">
                <table className={`w-full ${language === 'en' ? 'text-left' : 'text-right'} text-[15px]`}>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                    {goldRates.map((rate, index) => (
                      <tr key={rate.id || index} className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <td className="px-2 py-0.5 text-kh-text/80 dark:text-kh-gold/80">{rate.label}</td>
                        <td className={`px-2 py-0.5 ${language === 'en' ? 'text-right' : 'text-left'} font-bold text-kh-text dark:text-kh-gold`}>
                          {Number(rate.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Silver Table */}
            <div className="space-y-1">
              <h4 className={`text-[14px] font-bold text-kh-gold border-kh-gold ${language === 'en' ? 'border-l-2 pl-2' : 'border-r-2 pr-2'}`}>{t('silver_rates')}</h4>
              <div className="overflow-hidden rounded-lg border border-black/5 dark:border-white/10">
                <table className={`w-full ${language === 'en' ? 'text-left' : 'text-right'} text-[15px]`}>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                    {silverRates.map((rate, index) => (
                      <tr key={rate.id || index} className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <td className="px-2 py-0.5 text-kh-text/80 dark:text-kh-gold/80">{rate.label}</td>
                        <td className={`px-2 py-0.5 ${language === 'en' ? 'text-right' : 'text-left'} font-bold text-kh-text dark:text-kh-gold`}>
                          {Number(rate.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Currency Table */}
            <div className="space-y-1">
              <h4 className={`text-[14px] font-bold text-kh-gold border-kh-gold ${language === 'en' ? 'border-l-2 pl-2' : 'border-r-2 pr-2'}`}>{t('currency_rates')}</h4>
              <div className="overflow-hidden rounded-lg border border-black/5 dark:border-white/10">
                <table className={`w-full ${language === 'en' ? 'text-left' : 'text-right'} text-[15px]`}>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                    {currencyRates.map((rate, index) => (
                      <tr key={rate.id || index} className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <td className="px-2 py-0.5 text-kh-text/80 dark:text-kh-gold/80">{rate.label}</td>
                        <td className={`px-2 py-0.5 ${language === 'en' ? 'text-right' : 'text-left'} font-bold text-kh-text dark:text-kh-gold`}>
                          {Number(rate.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[9px] text-kh-text/30 dark:text-kh-gold/30 text-center">{t('all_rates_afn')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
