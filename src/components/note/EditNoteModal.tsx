import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { createNote, updateNote } from '../../api/notes';
import type { Note, CreateNoteRequest } from '../../types/notes';
import moment from 'moment';
import { getNoteColor } from '../../constants/notes';
import { NoteEditor, type NoteEditorData } from './NoteEditor';

interface EditNoteModalProps {
  note?: Note | null; // If null, creating new note
  initialData?: NoteEditorData; // Optional initial data for new notes (local state)
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSave?: (data: NoteEditorData) => Promise<void> | void; // Optional override for API save
  requestUUID?: string; // Optional context linking
  variant?: 'default' | 'simple'; // Simple mode hides title/tagline/settings
}

export function EditNoteModal({ note, initialData, isOpen, onClose, onSuccess, onSave, requestUUID, variant = 'default' }: EditNoteModalProps) {
  const { user } = useAuth();
  const isSimpleMode = variant === 'simple';

  // Determine initial data strictly from props to avoid stale state issues during remount
  const initialEditorData: NoteEditorData = useMemo(() => {
     if (note) {
        return {
          title: note.title,
          content: note.content,
          tagline: note.tagline || '',
          background_color: note.background_color || 'white',
          is_reminder: note.is_reminder,
          remind_at: note.remind_at ? moment(note.remind_at).format('YYYY-MM-DDTHH:mm') : '',
          webhook_url: note.webhook_url || '',
          webhook_payload: note.webhook_payload || '{\n  "message": "Reminder: {{title}}",\n  "content": "{{content}}"\n}',
          whatsapp_phone: note.whatsapp_phone || ''
        };
     }
     return initialData || {
        title: '',
        content: '',
        tagline: '',
        background_color: 'white',
        is_reminder: false,
        remind_at: '',
        webhook_url: '',
        webhook_payload: '{\n  "message": "Reminder: {{title}}",\n  "content": "{{content}}"\n}',
        whatsapp_phone: ''
     };
  }, [note, initialData]);

  // key state for form
  const [editorData, setEditorData] = useState<NoteEditorData>(initialEditorData);
  const [loading, setLoading] = useState(false);

  // Sync state when note changes so handleSubmit has correct data if no edits occur
  // NoteEditor uses initialEditorData for its own initialization
  useEffect(() => {
      setEditorData(initialEditorData);
  }, [initialEditorData]);

  // Determine if content has changed
  const isDirty = useMemo(() => {
    if (!note) {
        // For new note, it's dirty if user typed anything relevant
        // If initialData provided, compare with it
        if (initialData) {
            return JSON.stringify(editorData) !== JSON.stringify(initialData);
        }
        return !!editorData.title || !!editorData.content;
    } 
    
    // For existing note, compare with original values
    const normalize = (val: any) => val ===  null || val === undefined ? '' : val;
    return (
        editorData.title !== note.title ||
        editorData.content !== note.content ||
        normalize(editorData.tagline) !== normalize(note.tagline) ||
        (editorData.background_color || 'white') !== (note.background_color || 'white') ||
        editorData.is_reminder !== note.is_reminder ||
        normalize(editorData.remind_at) !== (note.remind_at ? moment(note.remind_at).format('YYYY-MM-DDTHH:mm') : '') ||
        normalize(editorData.webhook_url) !== normalize(note.webhook_url) ||
        normalize(editorData.webhook_payload) !== normalize(note.webhook_payload) ||
        normalize(editorData.whatsapp_phone) !== normalize(note.whatsapp_phone)
    );
  }, [editorData, note, initialData]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isDirty && note) {
        onClose();
        return;
    }
    
    // In simple mode, title might be hidden/empty, so allow saving if content exists
    if (!editorData.title.trim() && !editorData.content.trim()) {
         // Empty note
         onClose();
         return;
    }

    setLoading(true);

    try {
      // If onSave is provided, use it and skip API
      if (onSave) {
          await onSave(editorData);
          onSuccess();
          onClose();
          return;
      }

      // Prepare Payload
      const payload: CreateNoteRequest = {
          title: editorData.title || 'Untitled Note',
          content: editorData.content,
          tagline: editorData.tagline,
          background_color: editorData.background_color,
          is_reminder: editorData.is_reminder || false,
          request_uuid: note?.request_uuid || requestUUID,
          
          // Reminder fields
          remind_at: editorData.remind_at ? moment(editorData.remind_at).toISOString() : undefined,
          reminder_channel: editorData.is_reminder ? (editorData.reminder_channel) : undefined,
          webhook_url: editorData.webhook_url,
          webhook_payload: editorData.webhook_payload,
          whatsapp_phone: editorData.whatsapp_phone
      };
      
      // Validation
      if (editorData.is_reminder) {
          if (!editorData.remind_at) {
              toast.error('Please set a reminder time');
              setLoading(false);
              return;
          }
          
          if (editorData.reminder_channel === 'webhook') {
              if (!editorData.webhook_url) {
                  toast.error('Webhook URL is required');
                  setLoading(false);
                  return;
              }
              if (!editorData.webhook_url.startsWith('http')) {
                   toast.error('Invalid Webhook URL');
                   setLoading(false);
                   return;
              }
          }

          if (editorData.reminder_channel === 'whatsapp') {
              if (!editorData.whatsapp_phone) {
                  toast.error('WhatsApp phone number is required');
                  setLoading(false);
                  return;
              }
          }
      }

      if (note) {
        await updateNote(note.id, payload);
        toast.success('Note updated successfully');
      } else {
        await createNote(payload);
        toast.success('Note created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  // State for settings visibility
  const [showSettings, setShowSettings] = useState(false);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in transition-all">
      <div className={`w-full h-full md:h-[95vh] md:max-w-5xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up relative bg-white transition-colors duration-300 border ${getNoteColor(editorData.background_color).border}`}>
        
        {/* --- HEADER: ALWAYS VISIBLE --- */}
        <div className={`flex-shrink-0 px-4 py-3 border-b flex items-center justify-between transition-colors duration-300 ${getNoteColor(editorData.background_color).class} ${getNoteColor(editorData.background_color).border}`}>
            {/* Left: Status / Title Hint */}
            <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-400' : 'bg-green-400'}`} />
                 <span className="text-sm font-medium text-gray-500">
                    {note ? (isDirty ? 'Unsaved Changes' : 'All changes saved') : ''}
                 </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                 {!isSimpleMode && (
                 <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`
                        p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium
                        ${showSettings ? 'bg-gray-900/5 text-gray-900' : 'text-gray-500 hover:bg-gray-900/5 hover:text-gray-700'}
                    `}
                    title="Toggle Settings"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Settings</span>
                </button>
                 )}
                
                {!isSimpleMode && <div className="w-px h-4 bg-gray-300 mx-1" />}

                <button 
                    onClick={onClose} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                    title="Close Editor"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        {/* --- BODY: SCROLLABLE EDITOR --- */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            <NoteEditor 
                key={note?.id || ''}
                initialData={initialEditorData}
                onChange={setEditorData} 
                isSettingsOpen={showSettings && !isSimpleMode}
                onSettingsChange={setShowSettings}
                hideReminder={!['pro', 'enterprise'].includes(user?.plan || 'free')}
                hideTitle={isSimpleMode}
                hideTagline={isSimpleMode}
                hideSidebar={isSimpleMode}
                className="flex-1"
            />
        </div>

        {/* --- FOOTER: ACTIONS --- */}
        {(isDirty || !note) && (
            <div className={`flex-shrink-0 px-6 py-4 flex justify-between items-center border-t transition-colors duration-300 z-40 bg-white/80 backdrop-blur-md ${getNoteColor(editorData.background_color).border}`}>
                    <div className="hidden sm:block text-xs text-gray-500 font-medium italic">
                        {note ? `Last edited ${moment(note.updated_at).fromNow()}` : 'Unsaved Draft'}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-red-50 hover:text-red-600">
                            Discard
                        </Button>
                        <Button 
                            type="button" 
                            variant="primary" 
                            disabled={loading} 
                            onClick={() => handleSubmit()}
                            className="px-6 shadow-lg shadow-primary/20 min-w-[120px]"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
            </div>
        )}
      </div>
    </div>
  );
}
