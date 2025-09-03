/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

// --- Card Component Implementation ---
const Card = ({ className = '', children }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ className = '', children }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

// --- Ethiopian Calendar Utility Functions ---
const ethiopianEpoch = 8;
const ethiopianMonthLengths = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5, 6];
const ethiopianMonths = ["መስከረም", "ጥቅምት", "ህዳር", "ታህሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜን"];

const toEthiopianDate = (date) => {
  const gDay = Math.floor((date.getTime() / 86400000) - ethiopianEpoch);
  const year = Math.floor(gDay / 365.25) + 1;
  const isLeap = (year) => year % 4 === 3;
  const daysInYear = isLeap(year) ? 366 : 365;
  let dayOfYear = gDay % daysInYear;
  if (dayOfYear < 0) {
    dayOfYear += daysInYear;
  }
  let month = 1;
  while (dayOfYear > ethiopianMonthLengths[month - 1]) {
    dayOfYear -= ethiopianMonthLengths[month - 1];
    month++;
  }
  return { year, month, day: dayOfYear + 1 };
};

const formatEthiopianDate = (date) => {
  return `${ethiopianMonths[date.month - 1]} ${date.day}, ${date.year}`;
};

// --- Main Component ---
interface Holiday {
  name: string;
  date: string; // Gregorian date string from API
  type: string;
}

const EthiopianHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        // Placeholder data for demonstration
        const dummyHolidays: Holiday[] = [
          { name: 'Enkutatash (Ethiopian New Year)', date: '2025-09-11', type: 'National' },
          { name: 'Meskel', date: '2025-09-27', type: 'Religious' },
          { name: 'Mawlid (Prophet\'s Birthday)', date: '2025-09-15', type: 'Religious' },
          { name: 'Christmas (Genna)', date: '2026-01-07', type: 'Religious' },
          { name: 'Timkat', date: '2026-01-19', type: 'Religious' },
        ];

        // Filter for upcoming holidays (simple Gregorian comparison for now)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight for fair comparison
        const upcoming = dummyHolidays.filter(h => new Date(h.date) >= today);
        setHolidays(upcoming);

      } catch (e: any) {
        setError(e.message || 'Failed to fetch holidays');
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading Ethiopian holidays...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-orange-600" />
          Upcoming Ethiopian Holidays
        </CardTitle>
      </CardHeader>
      <CardContent>
        {holidays.length > 0 ? (
          <ul className="space-y-3">
            {holidays.map((holiday, index) => {
              const gregorianDate = new Date(holiday.date);
              const ethiopianDate = toEthiopianDate(gregorianDate);
              return (
                <li key={index} className="flex items-center justify-between text-sm text-gray-700">
                  <div>
                    <p className="font-medium">{holiday.name}</p>
                    <p className="text-xs text-gray-500">{holiday.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatEthiopianDate(ethiopianDate)}</p>
                    <p className="text-xs text-gray-500">{gregorianDate.toLocaleDateString()}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No upcoming holidays found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EthiopianHolidays;