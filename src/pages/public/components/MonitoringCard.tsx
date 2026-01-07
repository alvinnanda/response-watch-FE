import type { PublicRequest } from '../../../api/requests';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { RequestTimer } from './RequestTimer';
import { formatDurationHuman } from '../../../utils/formatters';

// Configure Indonesian relative time
moment.updateLocale('id', {
  relativeTime: {
    future: 'dalam %s',
    past: '%s lalu',
    s: 'beberapa detik',
    ss: '%d detik',
    m: 'semenit',
    mm: '%d menit',
    h: 'sejam',
    hh: '%d jam',
    d: 'sehari',
    dd: '%d hari',
    w: 'seminggu',
    ww: '%d minggu',
    M: 'sebulan',
    MM: '%d bulan',
    y: 'setahun',
    yy: '%d tahun'
  }
});
moment.locale('id');

interface MonitoringCardProps {
  request: PublicRequest;
}

export function MonitoringCard({ request }: MonitoringCardProps) {
  return (
    <Link 
      to={`/t/${request.url_token}`}
      className="block bg-white p-4 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-200 mb-3 group cursor-pointer"
    >
      <div className="flex flex-col gap-1 mb-4">
        <h4 className="flex flex-row font-semibold text-gray-900line-clamp-2 leading-relaxed group-hover: transition-colors">
          {request.title || <span className="text-gray-400 italic">Tidak ada judul</span>} 
        </h4>
        <span 
          className="text-xs text-gray-500 font-medium"
        >
          {request.vendor_name}
        </span>
        {request.status === 'in_progress' && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <RequestTimer startTime={request.started_at} />
          </div>
        )}
      </div>
      

      {request.status === 'done' && (
        <div className="flex flex-col gap-0.5 text-sm text-green-700 bg-green-50/80 px-3 py-1.5 rounded-lg border border-green-100 w-fit">
           <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {request.duration_seconds ? (
              <span className="font-medium text-xs">
                Done - {moment(request.finished_at).format('D MMM HH:mm')}
              </span>
            ) : (
              <span className="font-medium text-xs">Selesai</span>
            )}
           </div>
        </div>
      )}
      
      {request.status === 'waiting' && (
         <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/80 px-2 py-1.5 rounded-lg border border-amber-100 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Waiting -<RequestTimer startTime={request.created_at} />
         </div>
      )}

      {request.status !== 'waiting' && (
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className='flex flex-row gap-2 items-center flex-1 min-w-0'>
              <span className="text-gray-400 whitespace-nowrap">{formatDurationHuman(request.duration_seconds?request.duration_seconds:3000)}</span> 
            </div>
           {request.start_pic && (
                <div className="flex items-center gap-1 pl-2 border-l border-gray-100 min-w-0 max-w-[120px]">
                    <span className="text-gray-400 whitespace-nowrap">by</span>
                    <span 
                      className="font-medium text-gray-600 truncate"
                      title={request.start_pic}
                    >
                      {request.start_pic}
                    </span>
                </div>
           )}
        </div>
      )}
    </Link>
  );
}
