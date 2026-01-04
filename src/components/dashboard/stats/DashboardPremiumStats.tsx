import { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type RequestStats, type RequestFilters } from '../../../types/requests';
import { getPremiumRequestStats } from '../../../api/requests';
import { PremiumLock } from '../../common/PremiumLock';

interface DashboardPremiumStatsProps {
  filters: RequestFilters;
  isOpen: boolean;
  isLocked: boolean;
}

const formatDuration = (minutes: number | undefined) => {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return '-';
  if (minutes < 1) return '< 1m';
  
  const duration = moment.duration(minutes, 'minutes');
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const mins = duration.minutes();

  if (days > 0) return `${days}d ${hours} j`;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
};

export function DashboardPremiumStats({ filters, isOpen, isLocked }: DashboardPremiumStatsProps) {
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cache key to prevent re-fetching same data
  const lastFetchedKey = useRef<string>("");

  useEffect(() => {
    // Only fetch if:
    // 1. It is open (visible)
    // 2. Not locked (unless we want to show preview data? Plan said blurred preview. 
    //    Actually, if locked, we might NOT want to fetch real data to save resources, 
    //    but we need 'fake' background data for the blur effect.
    //    Let's fetch if locked too, but maybe the backend restricts it? 
    //    The backend doesn't check 'isLocked' param, it checks user plan.
    //    If plan is free (isLocked=true), backend returns 403 or empty.
    //    WAIT: If backend returns empty for free users, we can't show a nice blurred chart.
    //    We should probably mock the data for the blurred state on the CLIENT side 
    //    to avoid hitting the backend for free users entirely.
    
    if (!isOpen) return;

    const currentKey = JSON.stringify(filters);
    
    // If locked, use mock data and set loading false immediately
    if (isLocked) {
        if (!stats) {
            setStats(getMockStats());
        }
        return;
    }

    // Use cached data if filters haven't changed
    if (stats && lastFetchedKey.current === currentKey) return;

    const fetchPremiumStats = async () => {
      setLoading(true);
      try {
        const data = await getPremiumRequestStats(filters);
        setStats(data);
        lastFetchedKey.current = currentKey;
      } catch (error) {
        console.error("Failed to fetch premium stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumStats();
  }, [isOpen, filters, isLocked]);

  // Mock data for blurred view
  const getMockStats = (): RequestStats => ({
    waiting: 0, in_progress: 0, done: 0, total: 0,
    avg_response_time_minutes: 45,
    avg_completion_time_minutes: 120,
    daily_counts: Array.from({ length: 7 }, (_, i) => ({
      date: moment().subtract(6 - i, 'days').format('YYYY-MM-DD'),
      count: Math.floor(Math.random() * 20) + 5
    })),
    vendor_stats: [
        { vendor_name: "Vendor A", total: 15, avg_response_time_minutes: 30, avg_completion_time_minutes: 100, total_reopen: 1 },
        { vendor_name: "Vendor B", total: 12, avg_response_time_minutes: 45, avg_completion_time_minutes: 150, total_reopen: 0 },
        { vendor_name: "Vendor C", total: 8, avg_response_time_minutes: 60, avg_completion_time_minutes: 200, total_reopen: 2 },
    ]
  });

  if (!stats) return null;

  return (
    <PremiumLock isLocked={isLocked}>
      <div className={`space-y-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
         {/* Speed & Stats Cards Row */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Avg Response */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-blue-200 transition-colors">
                <div>
                <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-medium text-gray-500">Rata-rata Respon</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    Speed
                    </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(stats.avg_response_time_minutes)}
                </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
            </div>

            {/* Avg Completion */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-cyan-200 transition-colors">
                <div>
                <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-medium text-gray-500">Rata-rata Selesai</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(stats.avg_completion_time_minutes)}
                </p>
                </div>
                <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600 group-hover:bg-cyan-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
            </div>

             {/* Scheduled Card */}
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-purple-200 transition-colors">
                 <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Terjadwal</h4>
                    <p className="text-2xl font-bold text-gray-900">{stats.scheduled_count || 0}</p>
                 </div>
                 <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                 </div>
             </div>

             {/* Reopened Card */}
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-orange-200 transition-colors">
                 <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Reopen</h4>
                    <p className="text-2xl font-bold text-gray-900">{stats.reopen_count || 0}</p>
                 </div>
                 <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                 </div>
             </div>
        </div>


        {/* Daily Trend Card (Full) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Trend Permintaan
        </h4>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.daily_counts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                dataKey="date" 
                tickFormatter={(label) => moment(label).format('DD MMM')}
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
                />
                <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                />
                <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#fff' }}
                labelFormatter={(label) => moment(label).format('dddd, DD MMM YYYY')}
                formatter={(value: any) => [value, 'Requests']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {stats.daily_counts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3B82F6' : '#F3F4F6'} />
                ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
        </div>

        {/* Vendor Performance Section */}
        {stats.vendor_stats && stats.vendor_stats.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Top Vendor Performance
            </h4>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Reopen</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kecepatan Respon</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kecepatan Selesai</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {stats.vendor_stats.map((vendor, idx) => {
                    const responseRatio = Math.min(vendor.avg_response_time_minutes / 120, 1) * 100;
                    const completionRatio = Math.min(vendor.avg_completion_time_minutes / 1440, 1) * 100;

                    const getScoreColor = (mins: number, isResponse: boolean) => {
                        if (isResponse) {
                        if (mins < 30) return 'bg-emerald-500';
                        if (mins < 120) return 'bg-amber-400';
                        return 'bg-rose-500';
                        }
                        // Completion
                        if (mins < 120) return 'bg-emerald-500'; // < 2h
                        if (mins < 1440) return 'bg-blue-500'; // < 1d
                        return 'bg-slate-500'; // > 1d
                    };

                    return (
                        <tr key={idx} className="group hover:bg-gray-50/80 transition-all">
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase border border-slate-200">
                                {(vendor.vendor_name || '??').substring(0, 2)}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {vendor.vendor_name || 'Unknown Vendor'}
                                </p>
                            </div>
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {vendor.total} Req
                            </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                             <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    (vendor.total_reopen || 0) > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {(vendor.total_reopen || 0)}x
                                </span>
                                {(vendor.total_reopen || 0) > 0 && (
                                    <span className="text-[10px] text-red-500 font-medium">Attention</span>
                                )}
                             </div>
                        </td>
                        
                        {/* Response Time Column */}
                        <td className="px-4 py-4 whitespace-nowrap align-middle">
                            <div className="w-full max-w-[140px]">
                            <div className="flex justify-between items-end mb-1">
                                <span className={`text-xs font-bold ${
                                vendor.avg_response_time_minutes < 30 ? 'text-emerald-600' : 
                                vendor.avg_response_time_minutes < 120 ? 'text-amber-600' : 'text-rose-600'
                                }`}>
                                {formatDuration(vendor.avg_response_time_minutes)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                className={`h-1.5 rounded-full ${getScoreColor(vendor.avg_response_time_minutes, true)}`} 
                                style={{ width: `${Math.max(responseRatio, 5)}%` }}
                                />
                            </div>
                            </div>
                        </td>

                        {/* Completion Time Column */}
                        <td className="px-4 py-4 whitespace-nowrap align-middle">
                            <div className="w-full max-w-[140px]">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-semibold text-gray-700">
                                {formatDuration(vendor.avg_completion_time_minutes)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                className={`h-1.5 rounded-full ${getScoreColor(vendor.avg_completion_time_minutes, false)}`} 
                                style={{ width: `${Math.max(completionRatio, 5)}%` }}
                                />
                            </div>
                            </div>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            </div>
        )}
      </div>
    </PremiumLock>
  );
}
