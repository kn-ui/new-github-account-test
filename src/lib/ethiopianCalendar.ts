import { toEthiopian, toGregorian } from 'ethiopian-date';

export const toEthiopianDate = (gregorianDate: Date): { year: number; month: number; day: number } => {
  // Many libraries expect 1-indexed Gregorian month. Date#getMonth is 0-indexed.
  const year = gregorianDate.getFullYear();
  const month1Indexed = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();
  const [ey, em, ed] = toEthiopian(year, month1Indexed, day);
  return { year: ey, month: em, day: ed };
};

export const fromEthiopianDate = (ethiopianYear: number, ethiopianMonth: number, ethiopianDay: number): Date => {
  // toGregorian returns [year, month (1-indexed), day]
  const [gy, gm1, gd] = toGregorian(ethiopianYear, ethiopianMonth, ethiopianDay);
  // Date month is 0-indexed
  return new Date(gy, gm1 - 1, gd);
};

export const formatEthiopianDate = (ethiopianDate: { year: number; month: number; day: number }): string => {
  const monthNames = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit',
    'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
  ];
  // ethiopianDate.month is 1-indexed from the library's output
  return `${monthNames[ethiopianDate.month - 1]} ${ethiopianDate.day}, ${ethiopianDate.year}`;
};

// Helper for Ethiopian leap year check, as the library doesn't expose isLeapYear directly for Ethiopian year
// Based on the rule: Ethiopian year is a leap year if (year % 4) === 3
export const isEthiopianLeapYear = (year: number): boolean => {
  return (year % 4) === 3;
};

// Helper to get days in Ethiopian month (used in Calendar.tsx)
export const getEthiopianDaysInMonth = (year: number, month: number): number => {
  if (month >= 1 && month <= 12) {
    return 30;
  } else if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return 0; // Invalid month
};

// Helper to get first weekday offset of Ethiopian month (used in Calendar.tsx)
export const getEthiopianFirstWeekdayOffset = (year: number, month: number): number => {
  const firstDayOfMonthGregorian = fromEthiopianDate(year, month, 1);
  return firstDayOfMonthGregorian.getDay(); // 0 for Sunday, 1 for Monday, etc.
};

export const toGeezNumber = (num: number): string => {
  if (num === 0) return '0';
  const geezMap: { [key: number]: string } = {
    1: '፩', 2: '፪', 3: '፫', 4: '፬', 5: '፭', 6: '፮', 7: '፯', 8: '፰', 9: '፱',
    10: '፲', 20: '፳', 30: '፴', 40: '፵', 50: '፶', 60: '፷', 70: '፸', 80: '፹', 90: '፺'
  };

  if (num >= 1 && num <= 9) return geezMap[num];
  if (num >= 10 && num <= 99) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;
    return (geezMap[tens] || '') + (geezMap[ones] || '');
  }
  return String(num);
};