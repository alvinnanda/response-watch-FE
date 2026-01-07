import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button, Card, Input } from '../../components/ui';
import { getNotes, deleteNote } from '../../api/notes';
import type { Note, NoteFilters, Pagination } from '../../types/notes';
import moment from 'moment';
import DOMPurify from 'dompurify';
import { EditNoteModal } from '../../components/note/EditNoteModal';
import { getNoteColor } from '../../constants/notes';

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0 });
  const [filters, setFilters] = useState<NoteFilters>({ page: 1, limit: 12 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchValue, page: 1 }));
    }, 300);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getNotes(filters);
      setNotes(response.notes || []);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load notes');
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleFilterChange = (newFilters: Partial<NoteFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        toast.success('Note deleted');
        fetchNotes();
      } catch (err) {
        toast.error('Failed to delete note');
      }
    }
  };

  const hasActiveFilters = searchValue || filters.start_date || filters.end_date;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your private notes and set reminders.</p>
        </div>
        <Button onClick={() => { setEditingNote(null); setIsModalOpen(true); }} variant="primary">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Note
        </Button>
      </div>

       {/* Filter Section */}
       <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h3>
           <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-500 hover:bg-gray-100"
          >
            {showFilters ? 'Hide' : 'Show'}
            <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input 
                      type="date" 
                      value={filters.start_date || ''}
                      onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                      className="py-2.5 bg-gray-50 border-gray-300 focus:bg-white text-sm"
                    />
                    <Input 
                      type="date" 
                      value={filters.end_date || ''}
                      onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                      className="py-2.5 bg-gray-50 border-gray-300 focus:bg-white text-sm"
                    />
                  </div>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      onClick={() => { setSearchValue(''); setFilters({ page: 1, limit: 12 }); }}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors justify-center"
                    >
                      Clear
                    </Button>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">
          <p>{error}</p>
          <Button onClick={fetchNotes} variant="ghost" className="mt-2">Retry</Button>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
           <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
           </svg>
           <p className="text-gray-500">No notes found. Create your first note!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <div 
              key={note.id} 
               onClick={() => { setEditingNote(note); setIsModalOpen(true); }}
              className="h-full cursor-pointer"
            >
              <Card padding="md" className={`flex flex-col h-full hover:shadow-lg transition-shadow group relative ${getNoteColor(note.background_color).class} ${getNoteColor(note.background_color).border}`}>
                 {note.request && (
                   <a 
                     href={`/t/${note.request.url_token}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     onClick={(e) => e.stopPropagation()}
                     className="absolute -top-2 -right-[-20px] bg-white border border-gray-200 shadow-sm rounded-full px-2 py-0.5 max-w-[150px] z-10 hover:bg-gray-50 hover:border-t transition-colors"
                     title={`Request: ${note.request.title}`}
                   >
                     <p className="text-[10px] font-semibold truncate text-center">
                       {note.request.title}
                     </p>
                   </a>
                 )}
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex-grow min-w-0 pr-2">
                      <h3 className="font-semibold text-gray-900 truncate" title={note.title}>{note.title}</h3>
                      {note.tagline && <p className="text-xs text-gray-600 truncate mt-0.5" title={note.tagline}>{note.tagline}</p>}
                   </div>
                   <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          setEditingNote(note); 
                          setIsModalOpen(true); 
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                   </div>
                 </div>
               
               <p className="text-sm text-gray-600 mb-4 flex-grow whitespace-pre-line line-clamp-4">
                 {DOMPurify.sanitize(note.content, { ALLOWED_TAGS: [] })}
               </p>

               <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span>{moment(note.created_at).format('MMM D, YYYY')}</span>
                  {note.is_reminder && note.remind_at && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${moment(note.remind_at).isAfter(moment()) ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                       <span>{moment(note.remind_at).format('MMM D, HH:mm')}</span>
                    </div>
                  )}
               </div>
             </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
         <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-lg border border-gray-100">
            <span className="text-sm text-gray-500">
               Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
             <div className="flex gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
               >Previous</Button>
               <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => handlePageChange(pagination.page + 1)}
               >Next</Button>
             </div>
         </div>
      )}

      <EditNoteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSuccess={fetchNotes}
        note={editingNote}
      />
    </div>
  );
}
