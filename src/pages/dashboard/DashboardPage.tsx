import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../components/ui';
import { getRequests, getRequestStats } from '../../api/requests';
import type { Request, RequestStats, Pagination, RequestFilters } from '../../types/requests';
import moment from 'moment';
import { EditRequestModal } from '../../components/request/EditRequestModal';

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    waiting: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20',
    in_progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10',
    done: 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
  };
  const dots: Record<string, string> = {
    waiting: 'bg-yellow-400',
    in_progress: 'bg-blue-400',
    done: 'bg-green-400',
  };
  const labels: Record<string, string> = {
    waiting: 'Waiting',
    in_progress: 'In Progress',
    done: 'Done',
  };
  const style = styles[status] || styles.waiting;
  const dot = dots[status] || dots.waiting;
  const label = labels[status] || status;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {label}
    </span>
  );
};

export function DashboardPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<RequestStats>({ waiting: 0, in_progress: 0, done: 0, total: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState<RequestFilters>({ page: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStats, setShowStats] = useState(window.innerWidth >= 640);
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 640);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const navigate = useNavigate();

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
      const response = await getRequestStats();
      setStats(response);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

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

  const hasActiveFilters = filters.status || filters.start_date || filters.end_date || filters.search;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Section */}
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
            onClick={() => setShowStats(!showStats)}
            className="text-gray-500 hover:bg-gray-100"
          >
            {showStats ? 'Hide' : 'Show'}
            <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${showStats ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
        
        {showStats && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
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
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>

            {/* Completed Card */}
            <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-green-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.done}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
            </div>
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
                  placeholder="Search request by PIC name..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
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

                  {/* Date Range */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="w-full sm:w-auto">
                      <Input 
                        type="date" 
                        value={filters.start_date || ''}
                        onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                        className="py-2.5 bg-gray-50 border-gray-300 focus:bg-white text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <Input 
                        type="date" 
                        value={filters.end_date || ''}
                        onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                        className="py-2.5 bg-gray-50 border-gray-300 focus:bg-white text-sm"
                      />
                    </div>
                  </div>

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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned PIC</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr 
                      key={request.id} 
                      onClick={() => window.open(`/t/${request.url_token}`, '_blank')}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        {statusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{request.title}</span>
                            {request.followup_link && (
                              <a 
                                href={request.followup_link}
                                target="_blank"
                                rel="noopener noreferrer" 
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-400 hover:text-primary"
                                title="Has Followup Link"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">ID: {request.url_token}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                         <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{moment(request.created_at).format('MMM DD, YYYY')}</span>
                          <span className="text-xs text-gray-400">{moment(request.created_at).format('HH:mm')}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {request.start_pic || request.end_pic ? (
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                               {(request.start_pic || request.end_pic)?.charAt(0)}
                             </div>
                             <span className="text-sm text-gray-700">{request.start_pic || request.end_pic}</span>
                           </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full"
                            title="Copy Link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/t/${request.url_token}`);
                              alert('Link copied to clipboard!');
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                          
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title={request.status === 'done' ? "Cannot edit completed request" : "Edit"}
                            disabled={request.status === 'done'}
                            className={`h-8 w-8 p-0 rounded-full ${
                              request.status === 'done' 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (request.status !== 'done') {
                                setEditingRequest(request);
                              }
                            }}
                          >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                             </svg>
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="View Details"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
    </div>
  );
}
