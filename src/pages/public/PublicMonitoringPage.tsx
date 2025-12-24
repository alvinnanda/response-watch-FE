import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicRequestsByUsername, type PublicRequest } from '../../api/requests';
import { Button } from '../../components/ui';
import moment from 'moment';

// Hook for infinite scroll
function useInfiniteScroll(callback: () => void) {
  const observer = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!elementRef.current) return;

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callbackRef.current();
      }
    });

    observer.current.observe(elementRef.current);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return elementRef;
}

// Hook for managing a list of requests
function useRequestList(username: string, status: string, enabled: boolean = true) {
  const [requests, setRequests] = useState<PublicRequest[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const initialized = useRef(false);

  const fetchRequests = useCallback(async (isLoadMore: boolean = false) => {
    if (loading || (!hasMore && isLoadMore) || !enabled) return;
    
    setLoading(true);
    try {
      const currentPage = isLoadMore ? page : 1;
      const data = await getPublicRequestsByUsername(username, {
        status,
        page: currentPage,
        limit: 20
      });
      
      setRequests(prev => {
         if (!isLoadMore) return data.requests;
         
         const newRequests = data.requests.filter(req => !prev.some(p => p.id === req.id));
         if (newRequests.length === 0) return prev;
         return [...prev, ...newRequests];
      });
      setTotal(data.pagination.total);
      
      if (data.pagination.page >= data.pagination.total_pages) {
        setHasMore(false);
      } else {
        setPage(p => p + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username, status, page, loading, hasMore, enabled]);

  // Initial load
  useEffect(() => {
    if (enabled && !initialized.current) {
      fetchRequests(false);
      initialized.current = true;
    }
  }, [enabled, fetchRequests]);

  return { requests, loading, hasMore, total, loadMore: () => fetchRequests(true) };
}

// Timer Component
function RequestTimer({ startTime }: { startTime?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = moment(startTime);
    setElapsed(moment().diff(start, 'seconds'));
    const interval = setInterval(() => {
      setElapsed(moment().diff(start, 'seconds'));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (seconds: number) => {
    return moment.utc(seconds * 1000).format('HH:mm:ss');
  };

  return <span className="font-mono font-medium">{formatDuration(elapsed)}</span>;
}

// Card Component
function MonitoringCard({ request }: { request: PublicRequest }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-3">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-400">
          {moment(request.created_at).fromNow(true)}
        </span>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">
        {request.title}
      </h4>

      {request.status === 'in_progress' && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <RequestTimer startTime={request.started_at} />
        </div>
      )}

      {request.status === 'done' && request.duration_seconds && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100/50">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
           <span className="font-mono font-medium">
             {moment.utc(request.duration_seconds * 1000).format('HH:mm:ss')}
           </span>
        </div>
      )}
      
      {request.status === 'waiting' && (
         <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100/50 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            Waiting
         </div>
      )}

      {request.status !== 'waiting' && request.start_pic && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
           <div className="flex items-center gap-1">
               <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">
                   {request.start_pic.charAt(0).toUpperCase()}
               </div>
               <span>{request.start_pic}</span>
           </div>
           {request.end_pic && request.status === 'done' && (
               <span>Resolved by {request.end_pic}</span>
           )}
        </div>
      )}
    </div>
  );
}

// Column Component (Pure Presentational)
function KanbanColumn({ 
  title, 
  color,
  requests,
  loading,
  hasMore,
  onLoadMore,
  total
}: { 
  title: string; 
  color: 'yellow' | 'blue' | 'green';
  requests: PublicRequest[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  total: number;
}) {
  const observerRef = useInfiniteScroll(onLoadMore);

  const colorStyles = {
      yellow: 'bg-gray-50/50 border-gray-200/50',
      blue: 'bg-blue-50/30 border-blue-100/50',
      green: 'bg-green-50/30 border-green-100/50'
  }

  const headerColors = {
      yellow: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
      blue: 'text-blue-700 bg-blue-50 ring-blue-600/20',
      green: 'text-green-700 bg-green-50 ring-green-600/20'
  }

  return (
    <div className={`flex flex-col h-full rounded-2xl border ${colorStyles[color]} min-w-[300px] md:min-w-0`}>
      <div className="p-4 border-b border-gray-100/50 flex justify-between items-center sticky top-0 bg-white/50 backdrop-blur-sm rounded-t-2xl z-10">
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${headerColors[color]} flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500`}></span>
            {title}
        </div>
        <span className="text-xs font-mono text-gray-400">{total}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {requests.map(req => (
          <MonitoringCard key={req.id} request={req} />
        ))}
        
        {loading && (
           <div className="py-4 flex justify-center">
             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
           </div>
        )}
        
        {hasMore && <div ref={observerRef} className="h-4" />}
        
        {!hasMore && requests.length > 0 && (
            <div className="py-4 text-center text-xs text-gray-300">
                End of list
            </div>
        )}
        
        {!loading && requests.length === 0 && (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">
                Tidak ada permintaan
            </div>
        )}
      </div>
    </div>
  );
}

// Active Agents Dashboard Component
function ActiveAgentsDashboard({ 
  requests, 
  showOverview, 
  setShowOverview 
}: { 
  requests: PublicRequest[];
  showOverview: boolean;
  setShowOverview: (show: boolean) => void;
}) {
  const [agents, setAgents] = useState<{ name: string; maxSeconds: number; count: number }[]>([]);

  useEffect(() => {
    const calculateStats = () => {
      const picMap = new Map<string, { maxSeconds: number; count: number }>();

      requests.forEach(req => {
        if (req.status !== 'in_progress' || !req.started_at) return;
        
        const now = moment();
        const start = moment(req.started_at);
        const elapsed = now.diff(start, 'seconds');
        
        if (req.start_pic) {
          const current = picMap.get(req.start_pic) || { maxSeconds: 0, count: 0 };
          picMap.set(req.start_pic, {
            maxSeconds: Math.max(current.maxSeconds, elapsed),
            count: current.count + 1
          });
        }
      });

      const sortedAgents = Array.from(picMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.maxSeconds - a.maxSeconds);

      setAgents(sortedAgents);
    };

    calculateStats();
    const interval = setInterval(calculateStats, 1000);
    return () => clearInterval(interval);
  }, [requests]);

  if (agents.length === 0) return null;

  const formatDuration = (totalSeconds: number) => {
    const duration = moment.duration(totalSeconds, 'seconds');
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const formatted = `${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    let colorClass = 'text-gray-500';
    if (days >= 7) colorClass = 'text-red-600 font-bold';
    else if (days >= 1) colorClass = 'text-amber-500 font-bold';

    return { text: formatted, className: colorClass };
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl p-2 pointer-events-auto flex-row gap-2 transition-all duration-300">
      <div className="flex items-center justify-between mb-2 px-1" 
          onClick={() => setShowOverview(!showOverview)}>
        <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Ringkasan
        </h3>
        <button
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {showOverview ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        </button>
      </div>
      
      {showOverview && (
      <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl p-2 pointer-events-auto flex gap-2 transition-all duration-300">
          {agents.map(agent => {
            const { text, className } = formatDuration(agent.maxSeconds);
            return (
              <div key={agent.name} className="group relative flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm hover:border-gray-300 transition-colors">
                <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold border border-gray-200">
                    {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-gray-700">{agent.name}</span>
                    <div className="w-px h-3 bg-gray-200"></div>
                    <span className={`font-mono text-[10px] font-medium tabular-nums ${className}`}>
                        {text}
                    </span>
                </div>
                {/* Tooltip for task count */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Menangani {agent.count} tugas
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            );
          })}
      </div>
      )}
    </div>
  );
}

export function PublicMonitoringPage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress' | 'done'>('in_progress');
  const [showOverview, setShowOverview] = useState(true);
  const [showKanban, setShowKanban] = useState(true);
  
  // Lifted state for data requests
  const waitingList = useRequestList(username || '', 'waiting', true);
  const inProgressList = useRequestList(username || '', 'in_progress', true);
  const doneList = useRequestList(username || '', 'done', true);
  
  if (!username) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Floating Navbar */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 flex justify-center w-full pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-4 py-2 pointer-events-auto flex items-center justify-between gap-4 w-full max-w-2xl transition-all duration-300">
             <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                 <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform hover:scale-105 active:scale-95">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                 </div>
                 <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:block">ResponseWatch</span>
             </Link>
             
             <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

             <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-2">
                    Masuk
                </Link>
                <Link to="/login">
                    <Button size="sm" className="rounded-full px-4 text-xs h-8">Mulai</Button>
                </Link>
             </div>
        </div>
      </nav>

      <div className="flex-1 pt-24 pb-8 h-screen overflow-hidden flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 mb-4 flex-shrink-0">
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
            <div className="bg-white/50 backdrop-blur-sm p-1 rounded-xl flex border border-gray-200/50 shadow-sm">
              {(['waiting', 'in_progress', 'done'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab 
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700'
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
          
          <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl p-2 pointer-events-auto flex gap-2 transition-all duration-300 mx-8">
              <div className="max-w-7xl mx-auto w-full h-full">

                  <div className="flex items-center justify-between py-2" 
                      onClick={() => setShowKanban(!showKanban)}>
                    <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                       </svg>
                      Response Watch
                    </h3>
                    <button
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showKanban ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {showKanban && (
                  <>
                  {/* Desktop Grid */}
                    <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl p-2 pointer-events-auto flex gap-2 transition-all duration-300 hidden md:grid grid-cols-3 gap-6 h-full">
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

                  {/* Mobile View - Conditional rendering but data preserved in parent */}
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
                  </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
