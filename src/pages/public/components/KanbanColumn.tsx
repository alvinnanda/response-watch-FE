import { useRef, useEffect } from 'react';
import type { PublicRequest } from '../../../api/requests';
import { MonitoringCard } from './MonitoringCard';

// Hook for infinite scroll moved to here since it's used by the column
function useInfiniteScroll(callback: () => void) {
  const observer = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callbackRef.current();
      }
    }, {
        threshold: 0.1,
        rootMargin: '100px' // Load before reaching the very bottom
    });

    observer.current.observe(el);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return elementRef;
}

interface KanbanColumnProps {
  title: string;
  color: 'yellow' | 'blue' | 'green';
  requests: PublicRequest[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  total: number;
}

export function KanbanColumn({ 
  title, 
  color,
  requests,
  loading,
  hasMore,
  onLoadMore,
  total
}: KanbanColumnProps) {
  const observerRef = useInfiniteScroll(onLoadMore);

  const colorStyles = {
      yellow: 'bg-amber-50/30 border-amber-200/50',
      blue: 'bg-indigo-50/30 border-indigo-200/50',
      green: 'bg-emerald-50/30 border-emerald-200/50'
  };

  const headerStyles = {
      yellow: {
          badge: 'text-amber-700 bg-amber-100/50 border-amber-200',
          dot: 'bg-amber-500',
          count: 'text-amber-600/70 bg-amber-50'
      },
      blue: {
          badge: 'text-indigo-700 bg-indigo-100/50 border-indigo-200',
          dot: 'bg-indigo-500',
          count: 'text-indigo-600/70 bg-indigo-50'
      },
      green: {
          badge: 'text-emerald-700 bg-emerald-100/50 border-emerald-200',
          dot: 'bg-emerald-500',
          count: 'text-emerald-600/70 bg-emerald-50 text-xs' // Fixed class string
      }
  };

  const currentHeaderStyle = headerStyles[color];

  return (
    <div className={`flex flex-col h-full rounded-2xl border ${colorStyles[color]} min-w-[300px] md:min-w-0 transition-colors duration-300`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-100/50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md rounded-t-2xl z-10 shadow-sm">
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${currentHeaderStyle.badge} flex items-center gap-2 transition-colors`}>
            <span className={`w-2 h-2 rounded-full ${currentHeaderStyle.dot} shadow-sm`}></span>
            {title}
        </div>
        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${currentHeaderStyle.count} transition-colors`}>
           {total}
        </span>
      </div>
      
      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar scroll-smooth">
        <div className="flex flex-col gap-1">
            {requests.map(req => (
            <MonitoringCard key={req.id} request={req} />
            ))}
        </div>
        
        {loading && (
           <div className="py-6 flex justify-center">
             <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
           </div>
        )}
        
        {/* Infinite Scroll Trigger */}
        {hasMore && <div ref={observerRef} className="h-4 w-full" />}
        
        {!hasMore && requests.length > 0 && (
            <div className="py-6 text-center">
                <div className="text-[10px] items-center justify-center flex gap-2 text-gray-300 uppercase tracking-widest font-semibold">
                    <span>•</span> End of list <span>•</span>
                </div>
            </div>
        )}
        
        {!loading && requests.length === 0 && (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2 opacity-60">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="text-sm italic">Tidak ada permintaan</div>
            </div>
        )}
      </div>
    </div>
  );
}
