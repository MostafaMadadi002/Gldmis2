import React, { useMemo, useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  User as UserIcon,
  MapPin,
  Phone,
  Store,
  TrendingUp, 
  DollarSign, 
  Calendar, 
  History, 
  Printer, 
  ChevronLeft, 
  Gem, 
  Search, 
  X, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Trash2,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  Building,
  Users,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/SettingsContext';
import { Sale, Expense } from '../types';
import { calculateSaleProfit } from '../lib/profitUtils';

import { 
  formatToAfghanJalali, 
  getFullAfghanJalaliDate, 
  getAfghanJalaliMonthYear,
  toISODate
} from '../lib/dateUtils';
import moment from 'moment-jalaali';

const Reports: React.FC = () => {
  const { sales, products, expenses, addExpense, removeExpense } = useInventory();
  const { shopInfo, logo, language, t } = useSettings();
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);
  const [printType, setPrintType] = useState<'bill' | 'report'>('bill');
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrintingOverall, setIsPrintingOverall] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'summary'>('sales');

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseFilterAll, setExpenseFilterAll] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'rent' as Expense['category'],
    amount: '',
    date: toISODate(new Date()),
    recipient: '',
    description: '',
  });

  const isRtl = language !== 'en';

  const today = new Date();
  const todayFormatted = language === 'en' 
    ? today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : getFullAfghanJalaliDate(today);

  const calendarDays = useMemo(() => {
    const m = moment(currentCalendarMonth);
    const jYear = m.jYear();
    const jMonth = m.jMonth();
    
    const startOfMonth = moment(`${jYear}/${jMonth + 1}/1`, 'jYYYY/jM/jD');
    const firstDay = startOfMonth.day();
    const daysInMonth = moment.jDaysInMonth(jYear, jMonth);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(moment(`${jYear}/${jMonth + 1}/${i}`, 'jYYYY/jM/jD').toDate());
    }
    return days;
  }, [currentCalendarMonth]);

  const monthName = language === 'en'
    ? currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : getAfghanJalaliMonthYear(currentCalendarMonth);

  const handlePrevMonth = () => {
    const m = moment(currentCalendarMonth);
    setCurrentCalendarMonth(m.subtract(1, 'jMonth').toDate());
  };

  const handleNextMonth = () => {
    const m = moment(currentCalendarMonth);
    setCurrentCalendarMonth(m.add(1, 'jMonth').toDate());
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(toISODate(date));
    setIsHistoryModalOpen(false);
  };
  
  const todayDateStr = toISODate(new Date());
  
  const selectedSalesHistory = useMemo(() => {
    let filtered = sales.filter(s => toISODate(s.date) === toISODate(selectedDate));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName || '').toLowerCase().includes(q) ||
        (s.sellerName || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [sales, selectedDate, searchQuery]);

  const totalSalesOnSelectedDay = useMemo(() => {
    return selectedSalesHistory.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  }, [selectedSalesHistory]);

  // Gross profit for selected day (Sales Price - Purchase Price)
  const selectedDayProfitData = useMemo(() => {
    let grossProfit = 0;
    let totalCogs = 0;

    selectedSalesHistory.forEach(sale => {
      const profitDetail = calculateSaleProfit(sale, products);
      grossProfit += profitDetail.profit;
      totalCogs += profitDetail.cost;
    });

    return {
      grossProfit,
      totalCogs
    };
  }, [selectedSalesHistory, products]);

  // Expenses on selected day & overall
  const expensesList = useMemo(() => Array.isArray(expenses) ? expenses.filter(Boolean) : [], [expenses]);

  const selectedDateExpenses = useMemo(() => {
    return expensesList.filter(e => toISODate(e.date) === toISODate(selectedDate));
  }, [expensesList, selectedDate]);

  const totalExpensesOnSelectedDay = useMemo(() => {
    return selectedDateExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [selectedDateExpenses]);

  // Net profit on selected day (Gross Profit - Expenses)
  const netProfitOnSelectedDay = useMemo(() => {
    return selectedDayProfitData.grossProfit - totalExpensesOnSelectedDay;
  }, [selectedDayProfitData.grossProfit, totalExpensesOnSelectedDay]);

  // Overall all-time financial statistics (سود کلی)
  const allTimeStats = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0;
    let totalCogs = 0;

    sales.forEach(sale => {
      totalSales += Number(sale.totalAmount) || 0;
      const profitDetail = calculateSaleProfit(sale, products);
      totalProfit += profitDetail.profit;
      totalCogs += profitDetail.cost;
    });

    const totalExpenses = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalNetProfit = totalProfit - totalExpenses;

    return {
      totalSales,
      totalProfit,
      totalCogs,
      totalExpenses,
      totalNetProfit
    };
  }, [sales, products, expensesList]);

  const formattedSelectedDate = useMemo(() => {
    if (language === 'en') {
      return new Date(selectedDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return formatToAfghanJalali(selectedDate);
  }, [selectedDate, language]);

  const handleSearch = () => {
    setSearchQuery(tempSearchQuery);
  };

  const handlePrint = (sale: Sale, type: 'bill' | 'report') => {
    setPrintType(type);
    setPrintingSale(sale);
    setTimeout(() => {
      window.print();
      setPrintingSale(null);
    }, 300);
  };

  const handlePrintOverallReport = () => {
    setIsPrintingOverall(true);
    setTimeout(() => {
      window.print();
      setIsPrintingOverall(false);
    }, 500);
  };

  const handleOpenExpenseModal = () => {
    setExpenseForm({
      title: '',
      category: 'rent',
      amount: '',
      date: selectedDate || toISODate(new Date()),
      recipient: '',
      description: '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseForm.amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(language === 'en' ? 'Please enter a valid amount' : 'لطفاً مبلغ معتبری وارد کنید');
      return;
    }
    if (!expenseForm.title.trim()) {
      alert(language === 'en' ? 'Please enter a title or purpose' : 'لطفاً عنوان یا دلیل کسر پول را وارد کنید');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      await addExpense({
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: parsedAmount,
        date: expenseForm.date || toISODate(new Date()),
        recipient: expenseForm.recipient.trim() || undefined,
        description: expenseForm.description.trim() || undefined,
      });
      setIsExpenseModalOpen(false);
    } catch (err) {
      console.error('Failed to add expense:', err);
      alert(language === 'en' ? 'Failed to save withdrawal' : 'خطا در ثبت کسر پول');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm(language === 'en' ? 'Are you sure you want to remove this deduction record?' : 'آیا از حذف این رکورد کسر پول اطمینان دارید؟')) {
      await removeExpense(id);
    }
  };

  const chartData = useMemo(() => {
    const dates = [];
    const centerDate = new Date(selectedDate);
    for (let i = 5; i >= -5; i--) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() - i);
      dates.push(toISODate(d));
    }

    return dates.map(date => {
      const dailySales = sales
        .filter(s => toISODate(s.date) === toISODate(date));
      const dailyAmount = dailySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      
      let dailyProfit = 0;
      dailySales.forEach(s => {
        const pd = calculateSaleProfit(s, products);
        dailyProfit += pd.profit;
      });

      const dailyExpenses = expensesList
        .filter(e => toISODate(e.date) === toISODate(date))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      let label = language === 'en'
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : formatToAfghanJalali(date).split(' ').slice(0, 2).join(' ');
      if (date === todayDateStr) label = t('today');
      
      return {
        name: label,
        fullDate: date,
        sales: dailyAmount,
        profit: dailyProfit,
        expenses: dailyExpenses,
        netProfit: dailyProfit - dailyExpenses,
        isHighlighted: date === selectedDate
      };
    });
  }, [sales, expensesList, products, selectedDate, todayDateStr, language, t]);

  const getCategoryBadge = (cat: Expense['category']) => {
    switch (cat) {
      case 'rent':
        return { label: t('category_rent'), color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' };
      case 'salary':
        return { label: t('category_salary'), color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' };
      case 'utility':
        return { label: t('category_utility'), color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' };
      case 'withdrawal':
        return { label: t('category_withdrawal'), color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' };
      default:
        return { label: t('category_other'), color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20' };
    }
  };

  return (
    <div className={`space-y-8 pb-12 ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h2 className="text-2xl font-black text-kh-text dark:text-kh-gold flex items-center gap-3">
              <div className="p-2 bg-kh-gold/10 rounded-xl">
                <TrendingUp className="text-kh-gold" size={24} />
              </div>
              {t('reports')} &amp; {t('profit')}
            </h2>
            <p className="text-sm text-kh-muted mt-1">{t('reports_desc')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintOverallReport}
              className="flex items-center gap-2 bg-kh-bg dark:bg-white/5 text-kh-text dark:text-kh-gold border border-kh-card/10 dark:border-white/10 px-4 h-10 rounded-lg text-sm font-bold hover:bg-kh-gold hover:text-black transition-all group"
            >
              <Printer size={18} className="text-kh-gold group-hover:text-black" />
              <span>{language === 'en' ? 'Print Overall Report' : 'چاپ گزارش عمومی'}</span>
            </button>
            {/* Add Expense Button */}
            <button
              id="btn-add-expense-modal"
              onClick={handleOpenExpenseModal}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl shadow-md font-bold text-xs transition-all active:scale-95"
            >
              <Plus size={16} />
              <span>{t('expense_deduction')}</span>
            </button>

            <div className="flex items-center gap-3 bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border px-4 py-2 rounded-2xl shadow-sm">
              <Calendar size={18} className="text-kh-gold" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-kh-muted uppercase leading-none mb-1">{language === 'en' ? 'Today' : 'امروز'}</span>
                <span className="text-xs font-black text-kh-text dark:text-kh-gold leading-none">{todayFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar & Date Navigator */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-80 group bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-2xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-kh-gold/20 transition-all">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-kh-muted group-focus-within:text-kh-gold transition-colors`} size={18} />
                <input 
                  type="text"
                  placeholder={language === 'en' ? 'Search invoice, customer...' : 'جستجوی فاکتور، مشتری...'}
                  value={tempSearchQuery}
                  onChange={(e) => setTempSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className={`w-full bg-transparent border-none ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 text-sm font-bold focus:outline-none text-kh-text dark:text-dark-text`}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="bg-kh-gold text-white px-5 py-2 rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                {language === 'en' ? 'Search' : 'جستجو'}
              </button>
            </div>

            <button 
              onClick={() => {
                setCurrentCalendarMonth(new Date(selectedDate));
                setIsHistoryModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-kh-card dark:bg-dark-card border border-kh-card/5 dark:border-dark-border text-kh-text rounded-2xl font-black text-xs transition-all shadow-sm hover:bg-kh-gold hover:text-white group"
            >
              <History size={16} className="text-kh-gold group-hover:text-white transition-colors" />
              <span>{selectedDate === todayDateStr ? (language === 'en' ? 'Today' : 'امروز') : formattedSelectedDate}</span>
              <ChevronDown size={14} className="opacity-40" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-kh-card/20 dark:bg-black/20 rounded-2xl border border-kh-card/10 w-full lg:w-auto justify-center">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sales'
                  ? 'bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black shadow-sm font-black'
                  : 'text-kh-muted hover:text-kh-text dark:hover:text-kh-gold'
              }`}
            >
              {language === 'en' ? 'Sales & Profit' : 'گزارش فروش و مفاد'}
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-kh-muted hover:text-kh-text dark:hover:text-kh-gold'
              }`}
            >
              <span>{language === 'en' ? 'Deductions / Expenses' : 'کسر پول و مصارف'}</span>
              {selectedDateExpenses.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-white text-[10px] flex items-center justify-center font-bold">
                  {selectedDateExpenses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'summary'
                  ? 'bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black shadow-sm font-black'
                  : 'text-kh-muted hover:text-kh-text dark:hover:text-kh-gold'
              }`}
            >
              {language === 'en' ? 'Total Profit & Loss' : 'سود کلی و وضعیت مالی'}
            </button>
          </div>
        </div>
      </div>

      {/* History Date Picker Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-kh-card/5 dark:border-dark-border">
            <div className={`p-5 border-b border-kh-card/5 dark:border-dark-border flex justify-between items-center bg-kh-card text-kh-text ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <h3 className="text-base font-black">{language === 'en' ? 'Select Date' : 'انتخاب تاریخ گزارش'}</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-kh-text/60 hover:text-kh-text transition-colors p-1.5 hover:bg-kh-text/5 rounded-full">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 px-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-kh-bg dark:hover:bg-white/5 rounded-xl transition-colors">
                  {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                <div className="text-sm font-black text-kh-text dark:text-kh-gold">
                  {monthName}
                </div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-kh-bg dark:hover:bg-white/5 rounded-xl transition-colors">
                  {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-kh-muted">
                {language === 'en' 
                  ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => <div key={i}>{d}</div>)
                  : ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d, i) => <div key={i}>{d}</div>)
                }
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((date, idx) => {
                  if (!date) return <div key={idx} className="h-9"></div>;
                  const dStr = toISODate(date);
                  const isSelected = dStr === selectedDate;
                  const isToday = dStr === todayDateStr;
                  const hasSales = sales.some(s => toISODate(s.date) === dStr);
                  const hasExpenses = expensesList.some(e => toISODate(e.date) === dStr);

                  const dayNetProfit = useMemo(() => {
                    const daySales = sales.filter(s => toISODate(s.date) === dStr);
                    const dayExpenses = expensesList.filter(e => toISODate(e.date) === dStr);
                    const gross = daySales.reduce((sum, s) => sum + calculateSaleProfit(s, products).profit, 0);
                    const expTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                    return gross - expTotal;
                  }, [dStr, sales, expensesList, products]);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectDate(date)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center relative font-bold text-xs transition-all ${
                        isSelected 
                          ? 'bg-kh-gold text-white font-black shadow-md' 
                          : isToday 
                            ? 'bg-kh-card/40 text-kh-text border border-kh-gold/50' 
                            : 'hover:bg-kh-bg dark:hover:bg-white/5 text-kh-text dark:text-dark-text'
                      }`}
                    >
                      <span className="text-sm">{language === 'en' ? date.getDate() : moment(date).jDate()}</span>
                      
                      {dayNetProfit !== 0 && (
                        <span className={`text-[8px] font-black mt-0.5 leading-none ${isSelected ? 'text-white' : dayNetProfit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {dayNetProfit > 0 ? '+' : ''}{Math.round(dayNetProfit / 1000)}k
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 absolute bottom-0.5">
                        {hasSales && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></span>}
                        {hasExpenses && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`}></span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex justify-between items-center">
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">
                  {language === 'en' ? 'Profit This Month' : 'سود خالص این ماه'}
                </div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    const monthSales = sales.filter(s => {
                      const d = new Date(s.date);
                      return d.getMonth() === currentCalendarMonth.getMonth() && d.getFullYear() === currentCalendarMonth.getFullYear();
                    });
                    const monthExpenses = expensesList.filter(e => {
                      const d = new Date(e.date);
                      return d.getMonth() === currentCalendarMonth.getMonth() && d.getFullYear() === currentCalendarMonth.getFullYear();
                    });
                    const gross = monthSales.reduce((sum, s) => sum + calculateSaleProfit(s, products).profit, 0);
                    const expTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
                    return (gross - expTotal).toLocaleString();
                  })()}
                  <span className="text-[10px] mr-1 opacity-60 font-normal">{t('afghani')}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-kh-card/5 dark:border-dark-border flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDate(todayDateStr);
                    setIsHistoryModalOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-kh-gold/10 text-kh-gold rounded-xl font-bold text-xs hover:bg-kh-gold/20 transition-colors"
                >
                  {t('today')}
                </button>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="flex-1 py-2.5 bg-kh-bg dark:bg-white/5 text-kh-muted rounded-xl font-bold text-xs hover:bg-kh-card/10 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense / Deduction Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-kh-card/5 dark:border-dark-border">
            <div className={`p-5 border-b border-kh-card/5 dark:border-dark-border flex justify-between items-center bg-rose-600 text-white ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="flex items-center gap-2">
                <Wallet size={20} />
                <h3 className="text-base font-black">
                  {language === 'en' ? 'Record Deduction / Expense' : 'ثبت کسر پول و مصارف (کرایه، کارمند و ...)'}
                </h3>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-kh-text dark:text-kh-gold">{t('expense_category')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'rent', label: t('category_rent'), icon: Building },
                    { key: 'salary', label: t('category_salary'), icon: Users },
                    { key: 'utility', label: t('category_utility'), icon: Zap },
                    { key: 'withdrawal', label: t('category_withdrawal'), icon: Wallet },
                    { key: 'other', label: t('category_other'), icon: HelpCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = expenseForm.category === cat.key;
                    return (
                      <button
                        type="button"
                        key={cat.key}
                        onClick={() => setExpenseForm(prev => ({ ...prev, category: cat.key as Expense['category'] }))}
                        className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500 font-black shadow-sm'
                            : 'border-kh-card/10 text-kh-text dark:text-gray-300 hover:bg-kh-bg/50'
                        }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-rose-600' : 'text-kh-muted'} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-kh-text dark:text-kh-gold">{t('expense_title')}</label>
                <input
                  required
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Shop monthly rent, Ahmad salary' : 'مثلاً: کرایه ماه حوت، معاش احمد'}
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-kh-bg/50 dark:bg-black/20 border border-kh-card/10 dark:border-dark-border rounded-xl p-2.5 text-xs font-bold text-kh-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-kh-text dark:text-kh-gold">{t('expense_amount')}</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-kh-bg/50 dark:bg-black/20 border border-kh-card/10 dark:border-dark-border rounded-xl p-2.5 text-sm font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-xs font-bold text-kh-muted`}>
                    {t('afghani')}
                  </span>
                </div>
              </div>

              {/* Date & Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-kh-text dark:text-kh-gold">{t('date')}</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-kh-bg/50 dark:bg-black/20 border border-kh-card/10 dark:border-dark-border rounded-xl p-2 text-xs font-bold text-kh-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-kh-text dark:text-kh-gold">{t('expense_recipient')}</label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'e.g. Ahmad' : 'نام شخص دریافت‌کننده'}
                    value={expenseForm.recipient}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, recipient: e.target.value }))}
                    className="w-full bg-kh-bg/50 dark:bg-black/20 border border-kh-card/10 dark:border-dark-border rounded-xl p-2 text-xs font-bold text-kh-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-kh-text dark:text-kh-gold">{t('expense_description')}</label>
                <textarea
                  rows={2}
                  placeholder={language === 'en' ? 'Optional extra details...' : 'توضیحات یا یادداشت اختیاری...'}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-kh-bg/50 dark:bg-black/20 border border-kh-card/10 dark:border-dark-border rounded-xl p-2 text-xs text-kh-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              {/* Form Buttons */}
            <div className="pt-3 border-t border-kh-card/5 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingExpense && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                  <span>{t('new_deduction')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 bg-kh-bg dark:bg-white/5 text-kh-muted rounded-xl font-bold text-xs hover:bg-kh-card/10 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Summary Cards for the Selected Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-3xl shadow-sm relative overflow-hidden group">
          <div className={`absolute ${isRtl ? '-left-3' : '-right-3'} -top-3 w-20 h-20 bg-blue-50 dark:bg-blue-500/5 rounded-full opacity-50`}></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-kh-muted">
                {t('total')} {t('sales')} ({selectedDate === todayDateStr ? t('today') : formattedSelectedDate})
              </p>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                <DollarSign size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-kh-text dark:text-kh-gold font-mono">
                {totalSalesOnSelectedDay.toLocaleString()} 
                <span className="text-xs font-bold text-kh-muted mx-1">{t('afghani')}</span>
              </h3>
              <p className="text-[11px] text-kh-muted mt-1">
                {selectedSalesHistory.length} {t('invoice')}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Gross Profit (مفاد ناخالص فروشات) */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-3xl shadow-sm relative overflow-hidden group">
          <div className={`absolute ${isRtl ? '-left-3' : '-right-3'} -top-3 w-20 h-20 bg-emerald-50 dark:bg-emerald-500/5 rounded-full opacity-50`}></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {t('gross_profit')} ({selectedDate === todayDateStr ? t('today') : formattedSelectedDate})
              </p>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                +{selectedDayProfitData.grossProfit.toLocaleString()} 
                <span className="text-xs font-bold text-kh-muted mx-1">{t('afghani')}</span>
              </h3>
              <p className="text-[11px] text-kh-muted mt-1">
                {t('cogs')}: {selectedDayProfitData.totalCogs.toLocaleString()} {t('afghani')}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Cash Deductions / Expenses (کسر پول / مصارف) */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-3xl shadow-sm relative overflow-hidden group">
          <div className={`absolute ${isRtl ? '-left-3' : '-right-3'} -top-3 w-20 h-20 bg-rose-50 dark:bg-rose-500/5 rounded-full opacity-50`}></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                {t('expense_deduction')} ({selectedDate === todayDateStr ? t('today') : formattedSelectedDate})
              </p>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                -{totalExpensesOnSelectedDay.toLocaleString()} 
                <span className="text-xs font-bold text-kh-muted mx-1">{t('afghani')}</span>
              </h3>
              <p className="text-[11px] text-kh-muted mt-1">
                {selectedDateExpenses.length} {t('deductions_count')}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Net Profit (مفاد خالص) */}
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border p-5 rounded-3xl shadow-sm relative overflow-hidden group">
          <div className={`absolute ${isRtl ? '-left-3' : '-right-3'} -top-3 w-20 h-20 bg-kh-gold/5 rounded-full opacity-50`}></div>
          <div className="relative z-10 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-kh-text dark:text-kh-gold">
                {t('net_profit')} ({selectedDate === todayDateStr ? t('today') : formattedSelectedDate})
              </p>
              <div className="p-2.5 bg-kh-gold/10 text-kh-gold rounded-xl">
                <TrendingUp size={20} />
              </div>
            </div>
            <div>
              <h3 className={`text-2xl font-black font-mono ${netProfitOnSelectedDay >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {netProfitOnSelectedDay >= 0 ? '+' : ''}{netProfitOnSelectedDay.toLocaleString()} 
                <span className="text-xs font-bold text-kh-muted mx-1">{t('afghani')}</span>
              </h3>
              <p className="text-[11px] text-kh-muted mt-1">
                {language === 'en' ? 'After expense deductions' : 'پس از کسر کرایه، معاش و مصارف'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main View According to Active Tab */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
          <div className={`p-6 border-b border-kh-card/5 dark:border-dark-border flex items-center justify-between ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className="flex items-center gap-3">
              <History className="text-kh-gold" size={20} />
              <h3 className="text-lg font-bold text-kh-text dark:text-kh-gold">
                {selectedDate === todayDateStr ? t('today') : formattedSelectedDate} {t('sales')}
              </h3>
            </div>
            <span className="text-xs text-kh-muted font-bold">
              {selectedSalesHistory.length} {t('invoice')}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="text-[10px] font-black text-kh-muted uppercase tracking-widest bg-kh-bg/30 dark:bg-black/10 border-b border-kh-card/5 dark:border-dark-border">
                  <th className="py-4 px-6">{t('invoice_number')}</th>
                  <th className="py-4 px-6">{t('customer_name')}</th>
                  <th className="py-4 px-6">{t('seller')}</th>
                  <th className="py-4 px-6">{t('total_amount')} ({t('afghani')})</th>
                  <th className="py-4 px-6">{t('profit')} ({t('afghani')})</th>
                  <th className="py-4 px-6">{t('items')}</th>
                  <th className="py-4 px-6">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kh-card/5 dark:divide-dark-border">
                {selectedSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-kh-muted font-bold">{t('no_items')}</td>
                  </tr>
                ) : (
                  selectedSalesHistory.map((sale) => {
                    const saleProfitDetail = calculateSaleProfit(sale, products);
                    return (
                      <tr key={sale.id} className="hover:bg-kh-bg/20 dark:hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-6 font-black text-kh-text dark:text-kh-gold">{sale.invoiceNumber}</td>
                        <td className="py-4 px-6 text-sm font-bold">{sale.customerName || t('guest_customer')}</td>
                        <td className="py-4 px-6 text-sm font-bold text-kh-muted">{sale.sellerName}</td>
                        <td className="py-4 px-6 text-sm font-black text-kh-text dark:text-kh-gold">{(sale.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full font-mono ${
                            saleProfitDetail.profit > 0 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                              : saleProfitDetail.profit < 0 
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' 
                                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                          }`}>
                            {saleProfitDetail.profit > 0 ? '+' : ''}{(saleProfitDetail.profit || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {sale.items.map((item, idx) => (
                              <span key={idx} className="text-[9px] bg-kh-bg dark:bg-white/5 px-1.5 py-0.5 rounded border border-kh-card/5 text-kh-muted">
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button 
                            onClick={() => handlePrint(sale, 'bill')}
                            className={`flex items-center gap-2 text-emerald-500 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}
                          >
                            <Printer size={14} />
                            {t('print_bill')}
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
      )}

      {/* Deductions & Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
          <div className={`p-6 border-b border-kh-card/5 dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-kh-text dark:text-kh-gold">
                  {t('expense_deduction')}
                </h3>
                <p className="text-xs text-kh-muted">
                  {expenseFilterAll 
                    ? (language === 'en' ? 'All recorded deductions' : 'تمام رکوردهای کسر پول و مصارف') 
                    : `${language === 'en' ? 'Deductions on' : 'برداشت‌های تاریخ'} ${formattedSelectedDate}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setExpenseFilterAll(!expenseFilterAll)}
                className="text-xs font-bold text-kh-gold underline hover:opacity-80"
              >
                {expenseFilterAll 
                  ? t('show_selected_date')
                  : t('show_all')}
              </button>

              <button
                onClick={handleOpenExpenseModal}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus size={14} />
                <span>{t('new_deduction')}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="text-[10px] font-black text-kh-muted uppercase tracking-widest bg-kh-bg/30 dark:bg-black/10 border-b border-kh-card/5 dark:border-dark-border">
                  <th className="py-4 px-6">{t('date')}</th>
                  <th className="py-4 px-6">{t('expense_title')}</th>
                  <th className="py-4 px-6">{t('expense_category')}</th>
                  <th className="py-4 px-6">{t('expense_amount')} ({t('afghani')})</th>
                  <th className="py-4 px-6">{t('expense_recipient')}</th>
                  <th className="py-4 px-6">{t('expense_description')}</th>
                  <th className="py-4 px-6">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kh-card/5 dark:divide-dark-border">
                {(expenseFilterAll ? expensesList : selectedDateExpenses).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-kh-muted font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Wallet size={32} className="text-kh-muted/40" />
                        <span>{language === 'en' ? 'No cash deductions recorded for this period' : 'هیچ کسر پولی برای این تاریخ ثبت نشده است'}</span>
                        <button
                          onClick={handleOpenExpenseModal}
                          className="mt-2 text-rose-600 font-bold text-xs underline"
                        >
                          {t('new_deduction')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (expenseFilterAll ? expensesList : selectedDateExpenses).map((expense) => {
                    const badge = getCategoryBadge(expense.category);
                    return (
                      <tr key={expense.id} className="hover:bg-kh-bg/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 text-xs font-bold text-kh-muted font-mono">
                          {language === 'en' ? expense.date : formatToAfghanJalali(expense.date)}
                        </td>
                        <td className="py-4 px-6 font-bold text-kh-text dark:text-dark-text text-sm">
                          {expense.title}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-black text-rose-600 dark:text-rose-400 font-mono text-sm">
                          -{Number(expense.amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-xs text-kh-text dark:text-gray-300 font-medium">
                          {expense.recipient || '-'}
                        </td>
                        <td className="py-4 px-6 text-xs text-kh-muted max-w-[200px] truncate">
                          {expense.description || '-'}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 size={15} />
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
      )}

      {/* Summary / Total Profit & Loss Tab (سود کلی) */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-black text-kh-text dark:text-kh-gold mb-6 flex items-center gap-2">
              <TrendingUp className="text-kh-gold" size={24} />
              <span>{language === 'en' ? 'Comprehensive Financial & Total Profit Overview' : 'صورت‌حساب سود و زیان و مفاد کلی کسب‌وکار'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-kh-bg/40 dark:bg-black/20 p-4 rounded-2xl border border-kh-card/10">
                <span className="text-xs text-kh-muted font-bold">{language === 'en' ? 'Total All Sales' : 'مجموع کل فروشات'}</span>
                <p className="text-xl font-black text-kh-text dark:text-kh-gold font-mono mt-1">
                  {allTimeStats.totalSales.toLocaleString()} <span className="text-xs font-normal">{t('afghani')}</span>
                </p>
              </div>

              <div className="bg-kh-bg/40 dark:bg-black/20 p-4 rounded-2xl border border-kh-card/10">
                <span className="text-xs text-kh-muted font-bold">{language === 'en' ? 'Cost of Goods Sold (Purchase Price)' : 'مجموع بهای خرید اجناس (قیمت خرید)'}</span>
                <p className="text-xl font-black text-kh-muted font-mono mt-1">
                  {allTimeStats.totalCogs.toLocaleString()} <span className="text-xs font-normal">{t('afghani')}</span>
                </p>
              </div>

              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">{t('gross_profit')} ({t('total')})</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  +{allTimeStats.totalProfit.toLocaleString()} <span className="text-xs font-normal">{t('afghani')}</span>
                </p>
              </div>

              <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                <span className="text-xs text-rose-800 dark:text-rose-300 font-bold">{language === 'en' ? 'Total Deductions (Rent, Salaries)' : 'کل کسر پول و مصارف (کرایه، معاش)'}</span>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                  -{allTimeStats.totalExpenses.toLocaleString()} <span className="text-xs font-normal">{t('afghani')}</span>
                </p>
              </div>
            </div>

            {/* Total Net Profit Banner */}
            <div className="mt-6 p-6 rounded-2xl bg-kh-card dark:bg-dark-card border-2 border-kh-gold flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-kh-text/70 dark:text-kh-gold/70">{t('total_profit')}</span>
                <h2 className="text-3xl font-black text-kh-text dark:text-kh-gold font-mono mt-1">
                  {allTimeStats.totalNetProfit >= 0 ? '+' : ''}{allTimeStats.totalNetProfit.toLocaleString()} <span className="text-sm font-bold">{t('afghani')}</span>
                </h2>
              </div>
              <div className="text-xs text-kh-muted max-w-sm text-center sm:text-right">
                {language === 'en' 
                  ? 'Total net profit is calculated as total sales revenue minus product purchase costs and operational cash deductions (rent, employee salaries, and shop utilities).' 
                  : 'سود و مفاد خالص کلی با احتساب تفاضل نرخ خرید و فروش، منهای تمام برداشت‌ها و مصارف دکان (کرایه، معاش کارمندان و ...) به صورت خودکار محاسبه شده است.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white dark:bg-dark-card border border-kh-card/5 dark:border-dark-border rounded-3xl p-8 shadow-sm">
        <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-bold text-kh-text">{t('daily_sales_changes')} &amp; {t('profit')}</h3>
            <p className="text-xs text-kh-muted mt-1">{t('last_10_days_chart')}</p>
          </div>
          <div className="flex gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-kh-bg dark:bg-black/20 rounded-lg text-[10px] font-bold text-kh-text dark:text-dark-text border border-kh-card/5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="w-2 h-2 bg-kh-gold rounded-full" />
              {t('sales')} ({t('afghani')})
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              {t('profit')} ({t('afghani')})
            </div>
          </div>
        </div>

        <div className="h-[360px] w-full mt-4" style={{ direction: 'ltr' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  direction: isRtl ? 'rtl' : 'ltr',
                  textAlign: isRtl ? 'right' : 'left'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#C5A059" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10B981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorProfit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Printable Section */}
      {(printingSale || isPrintingOverall) && (
        <div className="hidden print:block fixed inset-0 z-[999] bg-white text-black p-0 overflow-visible">
          {isPrintingOverall ? (
            /* OVERALL GENERAL REPORT PRINTABLE (Modern Luxury) */
            <div 
              className={`printable-report bg-white p-12 relative flex flex-col ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} 
              style={{ 
                direction: isRtl ? 'rtl' : 'ltr', 
                minHeight: '297mm', 
                width: '210mm', 
                margin: '0 auto',
                fontFamily: 'Vazirmatn, system-ui, -apple-system, sans-serif',
                color: '#111827'
              }}
            >
              {/* Decorative Accent */}
              <div className={`absolute top-0 ${isRtl ? 'right-0' : 'left-0'} w-32 h-1 bg-[#C6A15B]`} />

              {/* Header Section */}
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-5">
                  {logo ? (
                    <div className="w-20 h-20 bg-[#F8F7F4] rounded-2xl flex items-center justify-center p-3 border border-[#C6A15B]/10">
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-[#111827] rounded-2xl flex items-center justify-center border border-[#C6A15B]/20">
                      <TrendingUp className="text-[#C6A15B]" size={36} />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#111827] mb-1">{shopInfo.name}</h1>
                    <p className="text-[#C6A15B] text-xs font-bold uppercase tracking-widest opacity-80">{t('reports')} &amp; {t('profit')}</p>
                  </div>
                </div>
                <div className={`text-${isRtl ? 'left' : 'right'} pt-2`}>
                  <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.3em] mb-1">{language === 'en' ? 'Daily Closure Report' : 'گزارش تصفیه روزانه'}</div>
                  <div className="text-2xl font-black text-[#111827] mb-1">{formattedSelectedDate}</div>
                  <div className="text-xs font-bold text-[#6B7280]">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              {/* High-Level Stats Bento Grid */}
              <div className="grid grid-cols-4 gap-4 mb-10">
                <div className="bg-[#F8F7F4] rounded-2xl p-5 border border-slate-100">
                  <div className="text-[9px] font-black text-[#6B7280] uppercase tracking-widest mb-3">{t('total')} {t('sales')}</div>
                  <div className="text-xl font-black text-[#111827] font-mono">{(totalSalesOnSelectedDay || 0).toLocaleString()} <span className="text-[10px] opacity-40">{t('afghani')}</span></div>
                  <div className="text-[10px] text-[#6B7280] font-bold mt-1">{selectedSalesHistory.length} {t('invoice')}</div>
                </div>
                <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5">
                  <div className="text-[9px] font-black text-emerald-800/40 uppercase mb-3 tracking-widest">{t('gross_profit')}</div>
                  <div className="text-xl font-black text-emerald-700 font-mono">+{(selectedDayProfitData.grossProfit || 0).toLocaleString()} <span className="text-[10px] opacity-40">{t('afghani')}</span></div>
                  <div className="text-[10px] text-emerald-800/40 font-bold mt-1">{t('cogs')}: {selectedDayProfitData.totalCogs.toLocaleString()}</div>
                </div>
                <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5">
                  <div className="text-[9px] font-black text-rose-800/40 uppercase mb-3 tracking-widest">{t('total_expenses')}</div>
                  <div className="text-xl font-black text-rose-700 font-mono">-{(totalExpensesOnSelectedDay || 0).toLocaleString()} <span className="text-[10px] opacity-40">{t('afghani')}</span></div>
                  <div className="text-[10px] text-rose-800/40 font-bold mt-1">{selectedDateExpenses.length} {language === 'en' ? 'records' : 'قلم کسر'}</div>
                </div>
                <div className="bg-[#111827] rounded-2xl p-5 text-white shadow-lg">
                  <div className="text-[9px] font-black text-[#C6A15B] uppercase mb-3 tracking-widest">{t('net_profit')}</div>
                  <div className={`text-xl font-black font-mono ${netProfitOnSelectedDay >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netProfitOnSelectedDay >= 0 ? '+' : ''}{(netProfitOnSelectedDay || 0).toLocaleString()} <span className="text-[10px] opacity-40">{t('afghani')}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                  <History size={16} className="text-[#C6A15B]" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">{language === 'en' ? 'Daily Transactions' : 'لیست تراکنش‌های فروش'}</h3>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#111827] text-[9px] font-black text-[#6B7280] uppercase tracking-widest">
                      <th className="py-3 px-2 text-center w-8">#</th>
                      <th className={`py-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('invoice')}</th>
                      <th className={`py-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('customer_name')}</th>
                      <th className={`py-3 px-2 ${isRtl ? 'text-left' : 'text-right'}`}>{t('total_amount')}</th>
                      <th className={`py-3 px-2 ${isRtl ? 'text-left' : 'text-right'}`}>{t('profit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedSalesHistory.map((s, i) => (
                      <tr key={s.id} className="text-[11px]">
                        <td className="py-3 px-2 text-center text-slate-300 font-mono">{i + 1}</td>
                        <td className="py-3 px-2 font-black">#{s.invoiceNumber}</td>
                        <td className="py-3 px-2 font-bold text-slate-600">{s.customerName || '-'}</td>
                        <td className={`py-3 px-2 font-black text-[#111827] ${isRtl ? 'text-left' : 'text-right'}`}>{(s.totalAmount || 0).toLocaleString()}</td>
                        <td className={`py-3 px-2 font-black ${isRtl ? 'text-left' : 'text-right'} ${calculateSaleProfit(s, products).profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {calculateSaleProfit(s, products).profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Expenses Subsection */}
                {selectedDateExpenses.length > 0 && (
                  <div className="mt-12">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                      <Wallet size={16} className="text-rose-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">{t('expense_deduction')}</h3>
                    </div>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-rose-100 text-[9px] font-black text-rose-800/40 uppercase tracking-widest">
                          <th className="py-3 px-2 text-center w-8">#</th>
                          <th className={`py-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('expense_title')}</th>
                          <th className={`py-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('category')}</th>
                          <th className={`py-3 px-2 ${isRtl ? 'text-left' : 'text-right'}`}>{t('amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50">
                        {selectedDateExpenses.map((e, i) => (
                          <tr key={e.id} className="text-[11px]">
                            <td className="py-3 px-2 text-center text-rose-200 font-mono">{i + 1}</td>
                            <td className="py-3 px-2 font-bold text-rose-900">{e.title}</td>
                            <td className="py-3 px-2 italic text-rose-800/60">{getCategoryBadge(e.category).label}</td>
                            <td className={`py-3 px-2 font-black text-rose-700 ${isRtl ? 'text-left' : 'text-right'}`}>{(e.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              <div className="mt-20 pt-8 border-t border-slate-100 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-slate-200" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">KHAZANA REPORT</span>
                  <div className="h-px w-8 bg-slate-200" />
                </div>
              </div>
            </div>
          ) : printingSale && (
            <div 
              className="printable-invoice bg-white mx-auto p-12 flex flex-col" 
              style={{ 
                direction: 'rtl', 
                minHeight: '297mm', 
                width: '210mm',
                fontFamily: 'Vazirmatn, system-ui, sans-serif',
                color: '#111827'
              }}
            >
              {/* Elegant Header */}
              <div className="flex justify-between items-start border-b-2 border-[#B8944A]/20 pb-6 mb-6">
                <div className="flex items-center gap-6">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
                  ) : (
                    <div className="w-16 h-16 border-2 border-[#B8944A]/20 flex items-center justify-center rounded-lg bg-[#F8F7F3]">
                      <Gem size={32} className="text-[#B8944A]" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#111827] mb-1">{shopInfo.name}</h1>
                    <p className="text-[#6B7280] text-xs font-bold leading-relaxed">{shopInfo.description}</p>
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-black text-[#B8944A] mb-1">فاکتور فروش</h2>
                  <div className="text-sm font-black text-[#111827]">شماره: #{printingSale.invoiceNumber}</div>
                  <div className="text-xs font-bold text-[#6B7280]">تاریخ: {new Date(printingSale.date).toLocaleDateString('fa-IR')}</div>
                </div>
              </div>

              {/* Contact Info (Horizontal & Delicate) */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-8 text-[11px] font-bold text-[#6B7280] border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#B8944A]" />
                  <span>{shopInfo.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-[#B8944A]" />
                  <span className="font-mono">{shopInfo.phone}</span>
                </div>
              </div>

              {/* Customer & Seller Info */}
              <div className="grid grid-cols-2 gap-10 mb-8">
                <div className="flex gap-2 text-sm">
                  <span className="font-black text-[#B8944A]">مشتری:</span>
                  <span className="font-bold text-[#111827]">{printingSale.customerName || 'مشتری مهمان'}</span>
                </div>
                <div className="flex gap-2 text-sm text-left justify-end">
                  <span className="font-black text-[#B8944A]">فروشنده:</span>
                  <span className="font-bold text-[#111827]">{printingSale.sellerName}</span>
                </div>
              </div>

              {/* Items Table (The Core) */}
              <div className="flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-y border-[#B8944A]/20">
                      <th className="py-3 px-2 text-[10px] font-black text-[#6B7280] text-center w-8">ردیف</th>
                      <th className="py-3 px-3 text-[10px] font-black text-[#6B7280] text-right">شرح کالا</th>
                      <th className="py-3 px-2 text-[10px] font-black text-[#6B7280] text-center w-24">کد کالا</th>
                      <th className="py-3 px-2 text-[10px] font-black text-[#6B7280] text-center w-20">عیار / سنگ</th>
                      <th className="py-3 px-2 text-[10px] font-black text-[#6B7280] text-center w-12">تعداد</th>
                      <th className="py-3 px-2 text-[10px] font-black text-[#6B7280] text-center w-20">وزن</th>
                      <th className="py-3 px-3 text-[10px] font-black text-[#111827] text-left w-32">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printingSale.items.map((item, index) => {
                      return (
                        <tr key={index} className="text-xs">
                          <td className="py-4 px-2 text-center text-slate-300 font-mono">{index + 1}</td>
                          <td className="py-4 px-3 font-black text-[#111827]">{item.name}</td>
                          <td className="py-4 px-2 text-center font-bold text-slate-400 font-mono">{item.code}</td>
                          <td className="py-4 px-2 text-center font-bold text-slate-600">{item.carat || item.stoneType}</td>
                          <td className="py-4 px-2 text-center font-black text-[#111827]">{item.quantity}</td>
                          <td className="py-4 px-2 text-center font-bold text-[#6B7280]">
                            {Number(item.weight || 0).toFixed(2)} <span className="text-[10px] text-slate-300">گرم</span>
                          </td>
                          <td className="py-4 px-3 text-left font-black text-[#111827] font-mono">
                            {(item.totalAmount || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary Section (Immediately after table) */}
                <div className="mt-8 flex justify-between items-start">
                  <div className="text-xs font-bold text-slate-400">
                    تعداد کل اجناس: <span className="text-[#111827]">{printingSale.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                  <div className="bg-[#111827] text-white rounded-xl p-6 min-w-[280px] shadow-lg border-b-4 border-[#B8944A]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-[#B8944A] uppercase tracking-widest">مبلغ قابل پرداخت</span>
                      <span className="text-xs font-bold opacity-60">افغانی</span>
                    </div>
                    <div className="text-3xl font-black text-right tracking-tight">
                      {(printingSale.totalAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-20 mt-20 mb-16">
                <div className="border-t border-slate-200 pt-3 text-center">
                  <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">امضای فروشنده</p>
                  <p className="text-xs font-black text-[#111827]">{printingSale.sellerName}</p>
                </div>
                <div className="border-t border-slate-200 pt-3 text-center">
                  <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">امضای مشتری</p>
                  <div className="h-10"></div>
                </div>
              </div>

              {/* Footer Policy */}
              <div className="mt-auto pt-8 border-t border-slate-50 text-center">
                <p className="text-xs font-bold italic text-[#6B7280] mb-4">" {shopInfo.footerText || 'از خرید شما متشکریم!'} "</p>
                <div className="text-[10px] font-black text-slate-200 tracking-[0.6em] uppercase">KHAZANA</div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
          }
          body * {
            visibility: hidden;
          }
          .hidden.print\\:block, .hidden.print\\:block * {
            visibility: visible;
          }
          .hidden.print\\:block {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .printable-invoice, .printable-report {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
