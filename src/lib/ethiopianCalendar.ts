import { toEthiopian, toGregorian } from 'ethiopian-date';

export const toEthiopianDate = (gregorianDate: Date): { year: number; month: number; day: number } => {
  // toEthiopian expects year, month (0-indexed), day
  const ethiopianArray = toEthiopian(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate());
  return {
    year: ethiopianArray[0],
    month: ethiopianArray[1],
    day: ethiopianArray[2],
  };
};

export const fromEthiopianDate = (ethiopianYear: number, ethiopianMonth: number, ethiopianDay: number): Date => {
  // toGregorian expects year, month, day (1-indexed for Ethiopian month)
  const gregorianArray = toGregorian(ethiopianYear, ethiopianMonth, ethiopianDay);
  // Date constructor expects year, month (0-indexed), day
  return new Date(gregorianArray[0], gregorianArray[1], gregorianArray[2]);
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