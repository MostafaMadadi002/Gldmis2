declare module 'moment-jalaali' {
  import moment from 'moment';

  namespace jMoment {
    interface MomentJalaali extends moment.Moment {
      jYear(): number;
      jYear(y: number): MomentJalaali;
      jMonth(): number;
      jMonth(m: number): MomentJalaali;
      jDate(): number;
      jDate(d: number): MomentJalaali;
      jDayOfYear(): number;
      jDayOfYear(d: number): MomentJalaali;
      jWeek(): number;
      jWeek(d: number): MomentJalaali;
      jWeekYear(): number;
      jWeekYear(d: number): MomentJalaali;
      add(amount: string | number, unit: string): MomentJalaali;
      subtract(amount: string | number, unit: string): MomentJalaali;
      startOf(unit: string): MomentJalaali;
      endOf(unit: string): MomentJalaali;
    }

    interface JalaaliStatic extends moment.MomentStatic {
      (date?: moment.MomentInput, format?: moment.MomentFormatSpecification, strict?: boolean): MomentJalaali;
      (date?: moment.MomentInput, format?: moment.MomentFormatSpecification, language?: string, strict?: boolean): MomentJalaali;
      jDaysInMonth(year: number, month: number): number;
      jIsLeapYear(year: number): boolean;
      loadPersian(options?: { dialect?: string; usePersianDigits?: boolean }): void;
    }
  }

  const jMoment: jMoment.JalaaliStatic;
  export = jMoment;
}
