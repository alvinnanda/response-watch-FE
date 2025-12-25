import type { PublicRequest } from '../../../api/requests';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { RequestTimer } from './RequestTimer';

interface MonitoringCardProps {
  request: PublicRequest;
}

export function MonitoringCard({ request }: MonitoringCardProps) {
  return (
    <Link 
      to={`/t/${request.url_token}`}
      className="block bg-white p-4 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-200 mb-3 group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-400 font-medium tracking-tight">
          {moment(request.created_at).fromNow(true)}
        </span>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-relaxed group-hover: transition-colors">
        {request.title || <span className="text-gray-400 italic">Tidak ada judul</span>}
      </h4>

      {request.status === 'in_progress' && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100 w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <RequestTimer startTime={request.started_at} />
        </div>
      )}

      {request.status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50/80 px-3 py-1.5 rounded-lg border border-green-100 w-fit">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
           {request.duration_seconds ? (
             <span className="font-mono font-medium">
               {moment.utc(request.duration_seconds * 1000).format('HH:mm:ss')}
             </span>
           ) : (
             <span className="font-medium text-xs">Selesai</span>
           )}
        </div>
      )}
      
      {request.status === 'waiting' && (
         <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/80 px-2 py-1.5 rounded-lg border border-amber-100 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Waiting
         </div>
      )}

      {request.status !== 'waiting' && request.start_pic && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
           <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-100 shadow-sm">
                   {request.start_pic.charAt(0).toUpperCase()}
               </div>
               <span className="font-medium">{request.start_pic}</span>
           </div>
           {request.end_pic && request.status === 'done' && (
                <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
                    <span className="text-gray-400">by</span>
                    <span className="font-medium text-gray-600">{request.end_pic}</span>
                </div>
           )}
        </div>
      )}
    </Link>
  );
}
