import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import moment from 'moment';
import { getDashboardMonitoring, type PublicRequest } from '../../api/requests';
import { ActiveAgentsDashboard } from '../public/components/ActiveAgentsDashboard';
import { KanbanColumn } from '../public/components/KanbanColumn';
import { DateRangeFilter } from '../public/components/DateRangeFilter';

// Interface for status-grouped data
interface StatusGroupedData {
  waiting: { requests: PublicRequest[]; total: number };
  in_progress: { requests: PublicRequest[]; total: number };
  done: { requests: PublicRequest[]; total: number };
}

// Hook for managing all requests with a single API call
function useAllRequests(startDate: string, endDate: string) {
  const [allRequests, setAllRequests] = useState<PublicRequest[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalAll, setTotalAll] = useState(0);
  
  // Use refs for values that shouldn't trigger effect re-runs
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync refs with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Track last fetched filter state to prevent double fetch
  const lastFetchedFiltersRef = useRef<string>('');

  // Stable fetch function that reads from refs
  const fetchRequests = useCallback(async (isLoadMore: boolean = false) => {
    // If it's a new fetch (not load more), cancel previous
    if (!isLoadMore && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Use refs to check current state to avoid stale closures
    if (loadingRef.current && isLoadMore) return; // Allow new fetch to override loading if filter changed
    if (!hasMoreRef.current && isLoadMore) return;
    
    // Create new controller for this request
    const controller = new AbortController();
    if (!isLoadMore) {
        abortControllerRef.current = controller;
    }

    loadingRef.current = true;
    setLoading(true);
    
    try {
      const currentPage = isLoadMore ? pageRef.current : 1;
      // Fetch all statuses at once (no status filter)
      const data = await getDashboardMonitoring({
        page: currentPage,
        limit: 60, // Fetch more since we're getting all statuses
        start_date: startDate,
        end_date: endDate
      }, controller.signal);
      
      // Check if aborted (though await usually throws, but good to check)
      if (controller.signal.aborted) return;

      setAllRequests(prev => {
         if (!isLoadMore) return data.requests;
         
         const newRequests = data.requests.filter(req => !prev.some(p => p.id === req.id));
         if (newRequests.length === 0) return prev;
         return [...prev, ...newRequests];
      });
      setTotalAll(data.pagination.total);
      
      const noMore = data.pagination.page >= data.pagination.total_pages;
      setHasMore(!noMore);
      hasMoreRef.current = !noMore;
      
      if (!noMore) {
        const nextPage = currentPage + 1;
        setPage(nextPage);
        pageRef.current = nextPage;
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
          console.error('Failed to fetch requests:', err);
      }
    } finally {
      // Only clear loading if this was the active request
      if (!controller.signal.aborted) {
          loadingRef.current = false;
          setLoading(false);
      }
    }
  }, [startDate, endDate]); 

  // Single effect for initial load and filter changes
  useEffect(() => {
    const filterKey = `${startDate}|${endDate}`;
    // In Strict Mode, this might run twice. 
    // If exact same filter, we can skip ONLY if we successfully fetched.
    // But since ref is reset on remount, we can't easily skip.
    // The AbortController in fetchRequests() handles the cancellation of the first request.
    
    lastFetchedFiltersRef.current = filterKey;
    
    // Reset pagination for new filter
    pageRef.current = 1;
    setPage(1);
    hasMoreRef.current = true;
    setHasMore(true);
    
    fetchRequests(false);

    return () => {
        // Cleanup on unmount or dep change
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };
  }, [startDate, endDate, fetchRequests]);

  // Polling for updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!loadingRef.current) {
        // Reset to fetch fresh first page
        pageRef.current = 1;
        setPage(1);
        hasMoreRef.current = true;
        setHasMore(true);
        fetchRequests(false);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Group requests by status using useMemo for performance
  const groupedData = useMemo<StatusGroupedData>(() => {
    const waiting = allRequests.filter(r => r.status === 'waiting');
    const in_progress = allRequests.filter(r => r.status === 'in_progress');
    const done = allRequests.filter(r => r.status === 'done');
    
    return {
      waiting: { requests: waiting, total: waiting.length },
      in_progress: { requests: in_progress, total: in_progress.length },
      done: { requests: done, total: done.length },
    };
  }, [allRequests]);

  return { 
    groupedData, 
    loading, 
    hasMore, 
    totalAll,
    loadMore: () => fetchRequests(true) 
  };
}


export function DashboardMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress' | 'done'>('in_progress');
  const [showOverview, setShowOverview] = useState(false);
  const [showKanban, setShowKanban] = useState(true);
  
  // Date filter with defaults: today for both start and end
  const today = moment().format('YYYY-MM-DD');
  const minDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  // Single API call for all statuses
  const { groupedData, loading, hasMore, loadMore } = useAllRequests(startDate, endDate);
  
  // Extract data for each status - hasMore is false per column since we fetch all at once
  const waitingList = { 
    requests: groupedData.waiting.requests, 
    loading: loading && groupedData.waiting.requests.length === 0, 
    hasMore: false, 
    total: groupedData.waiting.total, 
    loadMore: () => {}
  };
  const inProgressList = { 
    requests: groupedData.in_progress.requests, 
    loading: loading && groupedData.in_progress.requests.length === 0, 
    hasMore: false, 
    total: groupedData.in_progress.total, 
    loadMore: () => {}
  };
  const doneList = { 
    requests: groupedData.done.requests, 
    loading: loading && groupedData.done.requests.length === 0, 
    hasMore: false, 
    total: groupedData.done.total, 
    loadMore: () => {}
  };
  
  // Global load more function if there's more data to fetch
  const handleLoadMore = hasMore ? loadMore : undefined;
  
  return (
    <div className="flex-1 flex flex-col font-sans h-full overflow-hidden">
      {/* Active Agents Section */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 flex-shrink-0 transition-all duration-500 ease-out pt-6">
          <div className="max-w-7xl mx-auto w-full">
               <ActiveAgentsDashboard 
                 requests={inProgressList.requests} 
                 showOverview={showOverview}
                 setShowOverview={setShowOverview}
               />
          </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden px-4 mb-4 flex-shrink-0">
        <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-xl flex border border-gray-200/50 shadow-sm">
          {(['waiting', 'in_progress', 'done'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              {tab === 'waiting' && 'Waiting'}
              {tab === 'in_progress' && 'In Progress'}
              {tab === 'done' && 'Resolved'}
            </button>
          ))}
        </div>
      </div>


      {/* Kanban Board */}
      <div className="px-4 sm:px-6 lg:px-8 flex-1 min-h-0 flex flex-col pb-6">
        <div className="max-w-7xl mx-auto w-full h-full">
          <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-xl shadow-gray-200/40 rounded-3xl p-3 pointer-events-auto flex gap-2 transition-all duration-300 h-full flex-col ring-1 ring-gray-900/5">
            <div className="flex-shrink-0 flex items-center justify-between py-2 px-2 select-none cursor-pointer rounded-lg hover:bg-gray-50/50 transition-colors" 
                  onClick={() => setShowKanban(!showKanban)}>
                <h3 className="text-base font-semibold text-black flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gray-100 text-gray-500">
                    <svg className="w-4.5 h-4.5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
                  </div>
                  Monitoring Board
                </h3>
                <div className="flex items-center gap-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <DateRangeFilter 
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      minDate={minDate}
                      maxDate={today}
                    />
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                    <svg className={`w-5 h-5 transition-transform duration-200 ${showKanban ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {showKanban && (
              <>
              <div className="flex-1 min-h-0 overflow-hidden">
                {/* Desktop Grid */}
                <div className="bg-transparent hidden md:grid grid-cols-3 gap-4 lg:gap-6 h-full">
                   <KanbanColumn 
                     title="Waiting" 
                     color="yellow"
                     requests={waitingList.requests}
                     loading={waitingList.loading}
                     hasMore={waitingList.hasMore}
                     onLoadMore={waitingList.loadMore}
                     total={waitingList.total}
                   />
                   <KanbanColumn 
                     title="In Progress"
                     color="blue"
                     requests={inProgressList.requests}
                     loading={inProgressList.loading}
                     hasMore={inProgressList.hasMore}
                     onLoadMore={inProgressList.loadMore}
                     total={inProgressList.total}
                   />
                   <KanbanColumn 
                     title="Resolved"
                     color="green"
                     requests={doneList.requests}
                     loading={doneList.loading}
                     hasMore={doneList.hasMore}
                     onLoadMore={doneList.loadMore}
                     total={doneList.total}
                   />
                </div>

                {/* Mobile View */}
                <div className="md:hidden h-full">
                  {activeTab === 'waiting' && (
                     <KanbanColumn 
                      title="Waiting" 
                      color="yellow"
                      requests={waitingList.requests}
                      loading={waitingList.loading}
                      hasMore={waitingList.hasMore}
                      onLoadMore={waitingList.loadMore}
                      total={waitingList.total}
                     />
                  )}
                  {activeTab === 'in_progress' && (
                     <KanbanColumn 
                      title="In Progress"
                      color="blue"
                      requests={inProgressList.requests}
                      loading={inProgressList.loading}
                      hasMore={inProgressList.hasMore}
                      onLoadMore={inProgressList.loadMore}
                      total={inProgressList.total}
                     />
                  )}
                  {activeTab === 'done' && (
                     <KanbanColumn 
                      title="Resolved"
                      color="green"
                      requests={doneList.requests}
                      loading={doneList.loading}
                      hasMore={doneList.hasMore}
                      onLoadMore={doneList.loadMore}
                      total={doneList.total}
                     />
                  )}
                </div>
              </div>
              
              {/* Global Load More - for loading additional data across all columns */}
              {handleLoadMore && (
                <div className="flex justify-center py-4">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                  </button>
                </div>
              )}
              </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
