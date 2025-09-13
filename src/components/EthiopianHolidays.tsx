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

import { toEthiopianDate, formatEthiopianDate } from '@/lib/ethiopianCalendar';

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
        // Correct Ethiopian holidays for 2025-2026
        const ethiopianHolidays: Holiday[] = [
          { name: 'Meskel (Finding of the True Cross)', date: '2025-09-27', type: 'Religious' },
          { name: 'Christmas (Genna)', date: '2026-01-07', type: 'Religious' },
          { name: 'Timkat (Epiphany)', date: '2026-01-19', type: 'Religious' },
          { name: 'Adwa Victory Day', date: '2026-03-02', type: 'National' },
          { name: 'Good Friday', date: '2026-04-18', type: 'Religious' },
          { name: 'Easter (Fasika)', date: '2026-04-20', type: 'Religious' },
          { name: 'Labour Day', date: '2026-05-01', type: 'National' },
          { name: 'Patriots\' Victory Day', date: '2026-05-05', type: 'National' },
          { name: 'Downfall of Derg Day', date: '2026-05-28', type: 'National' },
          { name: 'Eid al-Fitr', date: '2026-03-30', type: 'Religious' },
          { name: 'Eid al-Adha', date: '2026-06-06', type: 'Religious' },
        ];

        // Filter for upcoming holidays
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = ethiopianHolidays.filter(h => {
          const holidayDate = new Date(h.date);
          holidayDate.setHours(0, 0, 0, 0);
          return holidayDate >= today;
        }).slice(0, 5); // Show only next 5 holidays

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