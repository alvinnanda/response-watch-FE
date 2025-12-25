import { useState, useEffect } from 'react';
import moment from 'moment';

interface RequestTimerProps {
  startTime?: string;
  className?: string; // Allow custom styling
}

export function RequestTimer({ startTime, className }: RequestTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = moment(startTime);
    
    // Initial calculate
    setElapsed(moment().diff(start, 'seconds'));

    const interval = setInterval(() => {
      setElapsed(moment().diff(start, 'seconds'));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (seconds: number) => {
    return moment.utc(seconds * 1000).format('HH:mm:ss');
  };

  if (!startTime) return null;

  return <span className={`font-mono font-medium ${className || ''}`}>{formatDuration(elapsed)}</span>;
}
