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
    const duration = moment.duration(seconds, 'seconds');
    const hours = Math.floor(duration.asHours());
    const mins = duration.minutes();
    const secs = duration.seconds();
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!startTime) return null;

  return <span className={`font-mono font-medium ${className || ''}`}>{formatDuration(elapsed)}</span>;
}
