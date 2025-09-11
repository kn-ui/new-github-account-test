/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { fromEthiopianDate, toEthiopianDate, getEthiopianDaysInMonth } from '@/lib/ethiopianCalendar';

interface DualDateInputProps {
  label?: string;
  value?: Date;
  defaultMode?: 'ethiopian' | 'gregorian';
  onChange: (date: Date) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function DualDateInput({ label = 'Date', value, defaultMode = 'ethiopian', onChange }: DualDateInputProps) {
  const [mode, setMode] = useState<'ethiopian' | 'gregorian'>(defaultMode);
  const initialDate = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();
  const [gregorianIso, setGregorianIso] = useState<string>(`${initialDate.getFullYear()}-${pad(initialDate.getMonth() + 1)}-${pad(initialDate.getDate())}`);

  const et = useMemo(() => toEthiopianDate(new Date(gregorianIso)), [gregorianIso]);
  const [ethiopianYmd, setEthiopianYmd] = useState<{ year: number; month: number; day: number }>(et);

  useEffect(() => {
    // Keep Ethiopian fields in sync when Gregorian changes
    setEthiopianYmd(et);
  }, [et]);

  const daysInEtMonth = useMemo(() => getEthiopianDaysInMonth(ethiopianYmd.year, ethiopianYmd.month), [ethiopianYmd.year, ethiopianYmd.month]);

  const handleGregorianChange = (iso: string) => {
    setGregorianIso(iso);
    const d = new Date(iso);
    if (!isNaN(d.getTime())) onChange(d);
  };

  const handleEthiopianChange = (next: Partial<{ year: number; month: number; day: number }>) => {
    const y = next.year ?? ethiopianYmd.year;
    const m = next.month ?? ethiopianYmd.month;
    const d = next.day ?? ethiopianYmd.day;
    const safeDay = Math.min(d, getEthiopianDaysInMonth(y, m));
    const g = fromEthiopianDate(y, m, safeDay);
    setEthiopianYmd({ year: y, month: m, day: safeDay });
    const iso = `${g.getFullYear()}-${pad(g.getMonth() + 1)}-${pad(g.getDate())}`;
    setGregorianIso(iso);
    onChange(g);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === 'ethiopian'} onChange={() => setMode('ethiopian')} /> Ethiopian
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === 'gregorian'} onChange={() => setMode('gregorian')} /> Gregorian
        </label>
      </div>

      {mode === 'gregorian' ? (
        <input
          type="date"
          value={gregorianIso}
          onChange={(e) => handleGregorianChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            value={ethiopianYmd.year}
            onChange={(e) => handleEthiopianChange({ year: parseInt(e.target.value || '0') })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Year"
          />
          <input
            type="number"
            min={1}
            max={13}
            value={ethiopianYmd.month}
            onChange={(e) => handleEthiopianChange({ month: Math.max(1, Math.min(13, parseInt(e.target.value || '1'))) })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Month"
          />
          <input
            type="number"
            min={1}
            max={daysInEtMonth}
            value={Math.min(ethiopianYmd.day, daysInEtMonth)}
            onChange={(e) => handleEthiopianChange({ day: Math.max(1, Math.min(daysInEtMonth, parseInt(e.target.value || '1'))) })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Day"
          />
        </div>
      )}

      <div className="text-xs text-gray-500">
        Synced: Ethiopian {ethiopianYmd.year}-{pad(ethiopianYmd.month)}-{pad(Math.min(ethiopianYmd.day, daysInEtMonth))} • Gregorian {gregorianIso}
      </div>
    </div>
  );
}

