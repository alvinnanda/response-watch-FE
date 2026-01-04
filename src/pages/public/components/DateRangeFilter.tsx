import { useState, useRef, useEffect } from 'react';
import moment from 'moment';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  minDate: string;
  maxDate: string;
}

export function DateRangeFilter({ startDate, endDate, onChange, minDate, maxDate }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = moment().format('YYYY-MM-DD');
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

  // Helper to determine display label
  const getLabel = () => {
    if (startDate === today && endDate === today) return 'Hari Ini';
    if (startDate === yesterday && endDate === yesterday) return 'Kemarin';
    if (startDate === moment().subtract(2, 'days').format('YYYY-MM-DD') && endDate === today) return '3 Hari Terakhir';
    if (startDate === moment().subtract(6, 'days').format('YYYY-MM-DD') && endDate === today) return '7 Hari Terakhir';
    if (startDate === moment().subtract(29, 'days').format('YYYY-MM-DD') && endDate === today) return '30 Hari Terakhir';
    
    return `${moment(startDate).format('D MMM')} - ${moment(endDate).format('D MMM')}`;
  };

  const handlePreset = (preset: 'today' | 'yesterday' | '3days' | '7days' | '30days') => {
    switch (preset) {
      case 'today':
        onChange(today, today);
        break;
      case 'yesterday':
        onChange(yesterday, yesterday);
        break;
      case '3days':
        onChange(moment().subtract(2, 'days').format('YYYY-MM-DD'), today);
        break;
      case '7days':
        onChange(moment().subtract(6, 'days').format('YYYY-MM-DD'), today);
        break;
      case '30days':
        onChange(moment().subtract(29, 'days').format('YYYY-MM-DD'), today);
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-300 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {getLabel()}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1 mb-4">
            <button onClick={() => handlePreset('today')} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Hari Ini
            </button>
            <button onClick={() => handlePreset('yesterday')} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Kemarin
            </button>
            <button onClick={() => handlePreset('3days')} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              3 Hari Terakhir
            </button>
            <button onClick={() => handlePreset('7days')} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              7 Hari Terakhir
            </button>
            <button onClick={() => handlePreset('30days')} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              30 Hari Terakhir
            </button>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  min={minDate}
                  max={endDate}
                  onChange={(e) => onChange(e.target.value, endDate)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={maxDate}
                  onChange={(e) => onChange(startDate, e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
