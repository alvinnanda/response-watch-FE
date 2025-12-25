import { useState, useEffect } from 'react';
import moment from 'moment';
import type { PublicRequest } from '../../../api/requests';

interface AgentStats {
    name: string;
    maxSeconds: number;
    count: number;
}

interface ActiveAgentsDashboardProps {
  requests: PublicRequest[]; // Primarily "In Progress" requests
  showOverview: boolean;
  setShowOverview: (show: boolean) => void;
}

export function ActiveAgentsDashboard({ 
  requests, 
  showOverview, 
  setShowOverview 
}: ActiveAgentsDashboardProps) {
  const [agents, setAgents] = useState<AgentStats[]>([]);

  useEffect(() => {
    const calculateStats = () => {
      const picMap = new Map<string, AgentStats>();

      requests.forEach(req => {
        // Only count valid, active requests with a start time and PIC
        if (req.status !== 'in_progress' || !req.started_at || !req.start_pic) return;
        
        const now = moment();
        const start = moment(req.started_at);
        const elapsed = now.diff(start, 'seconds');
        
        const current = picMap.get(req.start_pic) || { name: req.start_pic, maxSeconds: 0, count: 0 };
        picMap.set(req.start_pic, {
            name: req.start_pic,
            maxSeconds: Math.max(current.maxSeconds, elapsed),
            count: current.count + 1
        });
      });

      const sortedAgents = Array.from(picMap.values())
        .sort((a, b) => b.maxSeconds - a.maxSeconds);

      setAgents(sortedAgents);
    };

    calculateStats();
    // Update every second to keep timers fresh
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
    
    // Color coding based on duration urgency
    let colorClass = 'text-gray-600';
    if (days >= 7) colorClass = 'text-red-600 font-bold';
    else if (hours >= 24) colorClass = 'text-amber-600 font-bold';
    else if (hours >= 1) colorClass = 'text-indigo-600 font-bold';

    return { text: formatted, className: colorClass };
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl p-2 pointer-events-auto flex flex-col gap-2 transition-all duration-300">
      <div className="flex items-center justify-between px-2 py-1 cursor-pointer select-none hover:bg-gray-50/50 rounded-lg" 
          onClick={() => setShowOverview(!showOverview)}>
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
           <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
           </div>
           Aktif Sekarang
           <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] min-w-[1.25rem] text-center">
             {agents.length}
           </span>
        </h3>
        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className={`w-4 h-4 transition-transform duration-200 ${showOverview ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {showOverview && (
         <div className="flex flex-wrap gap-2 px-1 pb-1">
          {agents.map(agent => {
            const { text, className } = formatDuration(agent.maxSeconds);
            return (
              <div key={agent.name} className="group relative flex items-center gap-2 pl-1 pr-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-default">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-gray-100">
                    {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col leading-none gap-0.5">
                    <span className="font-semibold text-[11px] text-gray-700">{agent.name}</span>
                    <span className={`font-mono text-[10px] font-medium tracking-tight ${className}`}>
                        {text}
                    </span>
                </div>
                
                {/* Task count badge */}
                {agent.count > 1 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {agent.count}
                    </div>
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    <span className="font-semibold">{agent.name}</span> sedang menangani {agent.count} tugas
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
