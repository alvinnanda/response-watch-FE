import { useState, useEffect } from 'react';
import { Card } from '../../components/ui';
import { getUpcomingReminders } from '../../api/notes';
import type { Note } from '../../types/notes';
import moment from 'moment';
import DOMPurify from 'dompurify';
import { getNoteColor } from '../../constants/notes';

interface UpcomingRemindersProps {
  start?: string;
  end?: string;
  onNoteClick?: (note: Note) => void;
}

export function UpcomingReminders({ start, end, onNoteClick }: UpcomingRemindersProps) {
  const [reminders, setReminders] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const data = await getUpcomingReminders(start, end);
        // Filter out past reminders
        const now = moment();
        const futureReminders = (data || []).filter(note => {
           // Checks if remind_at is after now.
           return note.remind_at && moment(note.remind_at).isAfter(now);
        });
        setReminders(futureReminders);
      } catch (err) {
        console.error('Failed to load upcoming reminders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [start, end]);

  if (loading || reminders.length === 0) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
         <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Upcoming Reminders
         </h3>
         <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
           {reminders.length}
         </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reminders.slice(0, 4).map((note) => (
          <div key={note.id} onClick={() => onNoteClick?.(note)} className="cursor-pointer">
            <Card padding="sm" className={`transition-colors h-full ${getNoteColor(note.background_color).class} ${getNoteColor(note.background_color).border}`}>
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
                  {moment(note.remind_at).format('MMM D, HH:mm')}
                </span>
                {moment(note.remind_at).isBefore(moment()) && (
                   <span className="text-[10px] font-bold text-green-500 uppercase border border-green-100 bg-green-50 px-1.5 rounded">Selesai</span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1" title={note.title}>{note.title}</h4>
              <p className="text-xs text-gray-600 line-clamp-2">{DOMPurify.sanitize(note.content, { ALLOWED_TAGS: [] })}</p>
            </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
