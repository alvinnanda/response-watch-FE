import { type RequestStats } from '../../../types/requests';

interface DashboardStatsGridProps {
  stats: RequestStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Waiting Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-yellow-200 transition-colors">
        <div>
          <p className="text-sm font-medium text-gray-500">Waiting</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.waiting}</p>
        </div>
        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600 group-hover:bg-yellow-100 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* In Progress Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-blue-200 transition-colors">
        <div>
          <p className="text-sm font-medium text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.in_progress}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Done Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-green-200 transition-colors">
        <div>
          <p className="text-sm font-medium text-gray-500">Selesai</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.done}</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
