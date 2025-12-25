import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import moment from 'moment';
import { getPublicRequestsByUsername, type PublicRequest } from '../../api/requests';
import { ActiveAgentsDashboard } from './components/ActiveAgentsDashboard';
import { KanbanColumn } from './components/KanbanColumn';
import { DateRangeFilter } from './components/DateRangeFilter';

// Hook for managing a list of requests
function useRequestList(username: string, status: string, startDate: string, endDate: string, enabled: boolean = true) {
  const [requests, setRequests] = useState<PublicRequest[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Use refs for values that shouldn't trigger effect re-runs
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

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
    // Use refs to check current state to avoid stale closures
    if (loadingRef.current) return;
    if (!hasMoreRef.current && isLoadMore) return;
    if (!enabled) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const currentPage = isLoadMore ? pageRef.current : 1;
      const data = await getPublicRequestsByUsername(username, {
        status,
        page: currentPage,
        limit: 20,
        start_date: startDate,
        end_date: endDate
      });
      
      setRequests(prev => {
         if (!isLoadMore) return data.requests;
         
         const newRequests = data.requests.filter(req => !prev.some(p => p.id === req.id));
         if (newRequests.length === 0) return prev;
         return [...prev, ...newRequests];
      });
      setTotal(data.pagination.total);
      
      const noMore = data.pagination.page >= data.pagination.total_pages;
      setHasMore(!noMore);
      hasMoreRef.current = !noMore;
      
      if (!noMore) {
        const nextPage = currentPage + 1;
        setPage(nextPage);
        pageRef.current = nextPage;
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [username, status, enabled, startDate, endDate]); // Stable dependencies only

  // Single effect for initial load and filter changes
  useEffect(() => {
    if (!enabled) return;
    
    const filterKey = `${username}|${status}|${startDate}|${endDate}`;
    if (lastFetchedFiltersRef.current === filterKey) return; // Already fetched with these filters
    
    lastFetchedFiltersRef.current = filterKey;
    
    // Reset pagination for new filter
    pageRef.current = 1;
    setPage(1);
    hasMoreRef.current = true;
    setHasMore(true);
    
    fetchRequests(false);
  }, [enabled, username, status, startDate, endDate, fetchRequests]);

  // Polling for updates (every 30 seconds) - only for fresh data, not pagination
  useEffect(() => {
    if (!enabled) return;
    
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
  }, [enabled, fetchRequests]);

  return { requests, loading, hasMore, total, loadMore: () => fetchRequests(true) };
}


export function PublicMonitoringPage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress' | 'done'>('in_progress');
  const [showOverview, setShowOverview] = useState(false);
  const [showKanban, setShowKanban] = useState(true);
  
  // Date filter with defaults: today for both start and end
  const today = moment().format('YYYY-MM-DD');
  const minDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  // Lifted state for data requests
  const waitingList = useRequestList(username || '', 'waiting', startDate, endDate, true);
  const inProgressList = useRequestList(username || '', 'in_progress', startDate, endDate, true);
  const doneList = useRequestList(username || '', 'done', startDate, endDate, true);
  
  if (!username) return null;

  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none mix-blend-multiply animate-pulse" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none mix-blend-multiply animate-pulse delay-700" />

      {/* Floating Navbar */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 flex justify-center w-full pointer-events-none">
        <div className="bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg shadow-gray-200/10 rounded-full px-5 py-2.5 pointer-events-auto flex items-center justify-between gap-6 w-full max-w-2xl transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/20 ring-1 ring-white/40">
             <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                 <div className="relative w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105 group-active:scale-95 overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-700"></div>
                     <svg className="w-4.5 h-4.5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 leading-none tracking-tight hidden sm:block">ResponseWatch</span>
                    <span className="text-[10px] text-gray-500 font-medium hidden sm:block">Public Monitor</span>
                 </div>
             </Link>
             
             <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>

             <div className="flex flex-col items-end sm:items-end">
                <div className="text-lg font-bold text-gray-900 leading-none tracking-tight font-mono">
                    {currentTime.format('HH:mm')}
                </div>
                <div className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase mt-0.5">
                    {currentTime.format('D MMM YYYY')}
                </div>
             </div>
        </div>
      </nav>

      <div className="flex-1 pt-28 pb-8 h-screen overflow-hidden flex flex-col">


          {/* Active Agents Section */}
          <div className="px-4 sm:px-6 lg:px-8 mb-6 flex-shrink-0 transition-all duration-500 ease-out">
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
          <div className="px-4 sm:px-6 lg:px-8 flex-1 min-h-0 flex flex-col">
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
                      Response Watch
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
                  )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
