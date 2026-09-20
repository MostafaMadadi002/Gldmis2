import moment from 'moment-jalaali';

// Set up moment-jalaali
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

const jalaliMonths = [
  'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'
];

/**
 * Formats a date string or object into Afghanistan Jalali format
 */
export function formatToAfghanJalali(date: Date | string): string {
  const m = moment(date);
  const year = m.jYear();
  const monthIdx = m.jMonth();
  const day = m.jDate();

  return `${day} ${jalaliMonths[monthIdx]} ${year}`;
}

/**
 * Gets the Jalali month and year for a date
 */
export function getAfghanJalaliMonthYear(date: Date): string {
  const m = moment(date);
  const year = m.jYear();
  const monthIdx = m.jMonth();

  return `${jalaliMonths[monthIdx]} ${year}`;
}

/**
 * Gets a full localized weekday and Jalali date
 */
export function getFullAfghanJalaliDate(date: Date): string {
  const m = moment(date);
  const weekday = m.locale('fa').format('dddd');
  const jalali = formatToAfghanJalali(date);
  return `${weekday}، ${jalali}`;
}

/**
 * Returns Jalali components for a date
 */
export function getJalaliParts(date: Date) {
  const m = moment(date);
  return {
    year: m.jYear(),
    month: m.jMonth(),
    day: m.jDate()
  };
}

/**
 * Standardizes date to YYYY-MM-DD for consistent database storage and comparison
 */
export function toISODate(date: Date | string): string {
  return moment(date).format('YYYY-MM-DD');
}

/**
 * Creates a date from Jalali components
 */
export function fromJalali(year: number, month: number, day: number): Date {
  return moment(`${year}/${month + 1}/${day}`, 'jYYYY/jM/jD').toDate();
}
