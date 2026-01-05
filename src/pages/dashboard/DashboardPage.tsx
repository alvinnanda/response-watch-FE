
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { getRequests, deleteRequest, getRequestStats, reopenRequest } from '../../api/requests';
import { getGroups, type VendorGroup } from '../../api/groups';
import type { Request, RequestStats, Pagination, RequestFilters } from '../../types/requests';
import moment from 'moment';
import { EditRequestModal } from '../../components/request/EditRequestModal';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { UpcomingReminders } from '../../components/dashboard/UpcomingReminders';
import { DashboardStatsGrid } from '../../components/dashboard/stats/DashboardStatsGrid';
import { DashboardPremiumStats } from '../../components/dashboard/stats/DashboardPremiumStats';
import { EditNoteModal } from '../../components/note/EditNoteModal';
import type { Note } from '../../types/notes';
import { DateRangeFilter } from '../public/components/DateRangeFilter';

const statusBadge = (request: Request) => {
  const status = request.status;
  
  const styles: Record<string, string> = {
    waiting: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20',
    in_progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10',
    done: 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
    scheduled: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20', // Monochrome for scheduled
  };
  const dots: Record<string, string> = {
    waiting: 'bg-yellow-400',
    in_progress: 'bg-blue-400',
    done: 'bg-green-400',
    scheduled: 'bg-gray-400',
  };
  const labels: Record<string, string> = {
    waiting: 'Waiting',
    in_progress: 'In Progress',
    done: 'Done',
    scheduled: 'Scheduled',
  };

  const style = styles[status] || styles.waiting;
  const dot = dots[status] || dots.waiting;
  const label = labels[status] || status;
  
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
        {label}
      </span>
      {(request.reopen_count || 0) > 0 && (
         <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1">
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
           </svg>
           Reopened {request.reopen_count}x
         </span>
      )}
    </div>
  );
};



export function DashboardPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<RequestStats>({ waiting: 0, in_progress: 0, done: 0, total: 0, daily_counts: [] });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  
  // Date filter with default 7 days
  const today = moment().format('YYYY-MM-DD');
  const minDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
  const [startDate, setStartDate] = useState(moment().subtract(6, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(today);
  
  const [filters, setFilters] = useState<RequestFilters>({ 
    page: 1, 
    limit: 10,
    start_date: moment().subtract(6, 'days').format('YYYY-MM-DD'),
    end_date: today
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOverview, setShowOverview] = useState(true);
  const [showPremiumStats, setShowPremiumStats] = useState(false);
  const [showFilters, setShowFilters] = useState(true );
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  
  // Note Modal State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);

  // Vendor groups for filter (lazy loaded)
  const [vendorGroups, setVendorGroups] = useState<VendorGroup[]>([]);
  const [vendorGroupsLoaded, setVendorGroupsLoaded] = useState(false);

  // Search debounce state
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search - skip if search value is effectively unchanged
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        // Treat undefined and empty string as equivalent
        const currentSearch = prev.search || '';
        if (currentSearch === searchTerm) return prev;
        return { ...prev, search: searchTerm || undefined, page: 1 };
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Delete confirmation state
  const [deletingRequest, setDeletingRequest] = useState<Request | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reopen confirmation state
  const [reopeningRequest, setReopeningRequest] = useState<Request | null>(null);
  const [isReopening, setIsReopening] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Handle date range change
  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setFilters(prev => ({ ...prev, start_date: start, end_date: end, page: 1 }));
  };

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getRequests(filters);
      setRequests(response.requests);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load requests');
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Pass filters to stats API to ensure trends and metrics reflect current view
      const response = await getRequestStats(filters);
      setStats(response);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [filters]);

  // Track last fetched filter to prevent duplicate fetches
  const lastFetchedFilterRef = useRef<string | null>(null);

  // Single effect for data fetching - handles both initial load and filter changes
  useEffect(() => {
    const filterKey = JSON.stringify(filters);
    
    // Skip if we already fetched with these exact filters
    if (lastFetchedFilterRef.current === filterKey) {
      return;
    }
    
    lastFetchedFilterRef.current = filterKey;
    fetchRequests();
    fetchStats();
  }, [filters, fetchRequests, fetchStats]);

  // Lazy load vendor groups when filter section opens
  useEffect(() => {
    if (showFilters && !vendorGroupsLoaded) {
      getGroups(1, 100)
        .then((res: any) => {
          setVendorGroups(res.vendor_groups);
          setVendorGroupsLoaded(true);
        })
        .catch(console.error);
    }
  }, [showFilters, vendorGroupsLoaded]);

  // Handle filter change with debounce for search
  const handleFilterChange = (newFilters: Partial<RequestFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
  };

  const hasActiveFilters = filters.status || filters.start_date || filters.end_date || filters.search || filters.vendor_group_id;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Public Monitoring Link */}
      {user?.username && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Public Monitoring</h4>
                <p className="text-xs text-gray-500">Share this link to let others view your request status</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link 
                to={`/m/${user.username}`}
                target="_blank"
                className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors text-center"
              >
                Open Monitor
              </Link>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => {
                  const url = `${window.location.origin}/m/${user.username}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Public monitoring link copied!');
                }}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Reminders Section */}
      <UpcomingReminders 
        start={filters.start_date} 
        end={filters.end_date} 
        onNoteClick={(note) => {
          setEditingNote(note);
          setIsEditNoteModalOpen(true);
        }}
      />

      {/* Overview Stats Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowOverview(!showOverview)}
            className="text-gray-500 hover:bg-gray-100"
          >
            {showOverview ? 'Hide' : 'Show'}
            <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${showOverview ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
        
        {showOverview && (
          <div className="animate-fade-in">
             <DashboardStatsGrid stats={stats} />
          </div>
        )}
      </div>

      {/* Premium Analytics Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Premium Analytics
            {user?.plan === 'free' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                LOCKED
              </span>
            )}
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowPremiumStats(!showPremiumStats)}
            className="text-gray-500 hover:bg-gray-100"
          >
            {showPremiumStats ? 'Hide' : 'Show'}
            <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${showPremiumStats ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>

        {showPremiumStats && (
          <div className="animate-fade-in">
             <DashboardPremiumStats filters={filters} isOpen={showPremiumStats} isLocked={user?.plan === 'free'} />
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h3>
           <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-500 hover:bg-gray-100"
          >
            {showFilters ? 'Hide' : 'Show'}
            <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Search Group */}
              <div className="flex-1 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search request by Title or PIC..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

               <div className="flex flex-col sm:flex-row gap-3">
                  {/* Status Dropdown */}
                  <div className="w-full sm:w-40">
                    <div className="relative">
                      <select
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange({ status: e.target.value as RequestFilters['status'] })}
                      >
                        <option value="">All Status</option>
                        <option value="waiting">Waiting</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Completed</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Filter Dropdown */}
                  <div className="w-full sm:w-44">
                    <div className="relative">
                      <select
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        value={filters.vendor_group_id || ''}
                        onChange={(e) => handleFilterChange({ vendor_group_id: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                      >
                        <option value="">All Vendors</option>
                        {vendorGroups.map(vg => (
                          <option key={vg.id} value={vg.id}>{vg.group_name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <DateRangeFilter 
                    startDate={startDate}
                    endDate={endDate}
                    onChange={handleDateRangeChange}
                    minDate={minDate}
                    maxDate={today}
                  />

                  {/* Clear Button */}
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      onClick={clearFilters}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors justify-center"
                    >
                      <span className="sr-only">Clear Filters</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Table */}
      <Card padding="none" shadow="lg" className="overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Request History</h2>
          <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200">
            {pagination.total} records
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchRequests} className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Details</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PIC / Vendor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Response</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length > 0 ? (
                  requests.map((request) => (
                      <tr 
                        key={request.id} 
                        onClick={() => window.open(`/t/${request.url_token}`, '_blank')}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group valign-top"
                      >
                        {/* Status Column */}
                        <td className="px-6 py-4 align-top">
                          {statusBadge(request)}
                        </td>

                        {/* Request Details Column */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1.5 max-w-[250px]">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors truncate" title={request.title}>{request.title}</span>
                              {request.followup_link && (
                                <a 
                                  href={request.followup_link}
                                  target="_blank"
                                  rel="noopener noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-400 hover:text-primary shrink-0"
                                  title="Has Followup Link"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 font-mono">ID: {request.url_token}</span>
                          </div>
                        </td>
                        
                        {/* PIC / Vendor Combined Column */}
                        <td className="px-6 py-4 text-gray-600 align-top">
                          <div className="flex flex-col gap-2">
                             {/* Vendor */}
                             <div>
                                {request.vendor_name ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
                                    {request.vendor_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-xs">No Vendor</span>
                                )}
                             </div>

                             {/* PIC */}
                             {request.start_pic && (
                               <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" title="Assigned PIC">
                                    <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {request.start_pic}
                                  </span>
                               </div>
                             )}
                          </div>
                        </td>

                        {/* Vendor Response Column */}
                        <td className="px-6 py-4 text-gray-600 align-top max-w-[250px] whitespace-normal">
                           <div className="flex flex-col gap-2">
                              {/* Issue Mismatch Alert */}
                              {request.checkbox_issue_mismatch && (
                                <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100">
                                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span className="leading-tight">Judul tidak sesuai</span>
                                </div>
                              )}

                              {/* Resolution Notes Snippet */}
                              {request.resolution_notes ? (
                                <div className="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="line-clamp-3 leading-tight italic" title={request.resolution_notes}>
                                    "{request.resolution_notes}"
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs italic">-</span>
                              )}
                           </div>
                        </td>

                        {/* Timeline Column */}
                        <td className="px-6 py-4 text-gray-600 align-top">
                           <div className="flex flex-col gap-1">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 uppercase tracking-wider text-[10px]">Created</span>
                              <span className="text-sm text-gray-900">{moment(request.created_at).format('MMM DD, YYYY')}</span>
                              <span className="text-xs text-gray-400">{moment(request.created_at).format('HH:mm')}</span>
                            </div>

                            {request.scheduled_time && (
                              <div className="flex flex-col mt-1 pt-1 border-t border-gray-100">
                                <span className="text-xs text-gray-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Scheduled
                                </span>
                                <span className="text-xs font-medium text-gray-700">{moment(request.scheduled_time).format('MMM DD, HH:mm')}</span>
                              </div>
                            )}

                            {request.reopened_at && (
                               <div className="flex flex-col mt-1 pt-1 border-t border-gray-100">
                                <span className="text-xs text-gray-400 uppercase tracking-wider text-[10px] text-orange-400">Last Reopen</span>
                                <span className="text-xs text-gray-500">{moment(request.reopened_at).fromNow()}</span>
                              </div>
                            )}
                           </div>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full"
                            title="Copy Link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${import.meta.env.VITE_SHARE_URL || window.location.origin}/share/${request.url_token}`);
                              toast.success('Link copied to clipboard!');
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                          
                          
                          {request.status === 'done' ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Reopen Request"
                                className="h-8 w-8 p-0 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReopeningRequest(request);
                                }}
                              >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                 </svg>
                              </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Edit"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRequest(request);
                              }}
                            >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                               </svg>
                            </Button>
                          )}

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete Request"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingRequest(request);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/20">
                       <div className="flex flex-col items-center justify-center">
                         <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <p>No requests found{hasActiveFilters ? ' matching your filters' : ''}.</p>
                         {hasActiveFilters && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="mt-2 text-primary"
                             onClick={clearFilters}
                           >
                             Clear all filters
                           </Button>
                         )}
                       </div>
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === pagination.total_pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editingRequest && (
        <EditRequestModal
          request={editingRequest}
          isOpen={true}
          onClose={() => setEditingRequest(null)}
          onSuccess={() => {
            setEditingRequest(null);
            fetchRequests(); // Refresh list
          }}
        />
      )}
      {/* Floating Action Button for Create Request */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          variant="primary"
          className="rounded-full shadow-xl w-12 h-12 p-0 flex items-center justify-center hover:scale-105 transition-transform duration-200"
          onClick={() => navigate('/dashboard/create')}
          title="Create New Request"
        >
        <svg 
              className="w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
        </Button>
      </div>
      {/* Note Modals */}
      <EditNoteModal
        isOpen={isEditNoteModalOpen}
        onClose={() => { setIsEditNoteModalOpen(false); setEditingNote(null); }}
        onSuccess={() => {
           // We might need to refresh reminders, but UpcomingReminders fetches on mount/prop change.
           // Since we don't have a trigger mechanism to refresh UpcomingReminders from here easily without a key or context, 
           // and the note update usually happens on NotesPage, we accept that reminders might be slightly stale until refresh 
           // or we can force refresh by toggling a key. 
           // For now, simple close is fine.
        }}
        note={editingNote}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRequest}
        onClose={() => setDeletingRequest(null)}
        title="Hapus Request"
        width="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus request <span className="font-semibold text-gray-900">"{deletingRequest?.title}"</span>?
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setDeletingRequest(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
              onClick={() => {
                if (!deletingRequest) return;
                setIsDeleting(true);
                deleteRequest(deletingRequest.uuid)
                  .then(() => {
                    toast.success('Request berhasil dihapus');
                    setDeletingRequest(null);
                    fetchRequests();
                    fetchStats();
                  })
                  .catch((err: any) => {
                    toast.error(err.message || 'Gagal menghapus request');
                  })
                  .finally(() => setIsDeleting(false));
              }}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reopen Confirmation Modal */}
      <Modal
        isOpen={!!reopeningRequest}
        onClose={() => setReopeningRequest(null)}
        title="Reopen Request"
        width="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
             <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Apakah Anda yakin ingin membuka kembali request <span className="font-semibold text-gray-900">"{reopeningRequest?.title}"</span>?<br/>
            Status akan kembali menjadi <span className="font-bold text-blue-600">In Progress</span>.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setReopeningRequest(null)}
              disabled={isReopening}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
              disabled={isReopening}
              onClick={() => {
                if (!reopeningRequest) return;
                setIsReopening(true);
                reopenRequest(reopeningRequest.id)
                  .then(() => {
                    toast.success('Request berhasil dibuka kembali');
                    setReopeningRequest(null);
                    fetchRequests();
                    fetchStats();
                  })
                  .catch((err: any) => {
                    toast.error(err.message || 'Gagal membuka kembali request');
                  })
                  .finally(() => setIsReopening(false));
              }}
            >
              {isReopening ? 'Memproses...' : 'Reopen Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
