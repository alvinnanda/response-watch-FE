import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui';
import { createNote, updateNote } from '../../api/notes';
import type { Note, CreateNoteRequest } from '../../types/notes';
import moment from 'moment';
import { getNoteColor } from '../../constants/notes';
import { NoteEditor, type NoteEditorData } from './NoteEditor';

interface EditNoteModalProps {
  note?: Note | null; // If null, creating new note
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestUUID?: string; // Optional context linking
}

export function EditNoteModal({ note, isOpen, onClose, onSuccess, requestUUID }: EditNoteModalProps) {
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
        };
     }
     return {
        title: '',
        content: '',
        tagline: '',
        background_color: 'white',
        is_reminder: false,
        remind_at: '',
        webhook_url: '',
        webhook_payload: '{\n  "message": "Reminder: {{title}}",\n  "content": "{{content}}"\n}',
     };
  }, [note]);

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
        normalize(editorData.webhook_payload) !== normalize(note.webhook_payload)
    );
  }, [editorData, note]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isDirty && note) {
        onClose();
        return;
    }
    
    if (!editorData.title.trim() && !editorData.content.trim()) {
         // Empty note
         onClose();
         return;
    }

    setLoading(true);

    try {
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
          reminder_channel: editorData.is_reminder ? (editorData.webhook_url ? 'webhook' : 'email') : undefined, // Simple logic
          webhook_url: editorData.webhook_url,
          webhook_payload: editorData.webhook_payload
      };
      
      // Validation
      if (editorData.is_reminder) {
          if (!editorData.remind_at) {
              toast.error('Please set a reminder time');
              setLoading(false);
              return;
          }
          if (editorData.webhook_url && !editorData.webhook_url.startsWith('http')) {
               toast.error('Invalid Webhook URL');
               setLoading(false);
               return;
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

  // ... (rest of handleSubmit etc) ...

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden animate-slide-up relative transition-colors duration-300 ${getNoteColor(editorData.background_color).class} border ${getNoteColor(editorData.background_color).border}`}>
        {/* Header Actions (Absolute) */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-all flex items-center gap-2 ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'}`}
                title="Toggle Settings"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {showSettings && <span className="text-sm font-medium pr-1">Settings</span>}
            </button>
            <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-full transition-all"
                title="Close"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Note Editor Component - SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/5 hover:[&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            <NoteEditor 
                key={note?.id || 'new-note'}
                initialData={initialEditorData}
                onChange={setEditorData} 
                isSettingsOpen={showSettings}
                className="min-h-full border-none rounded-none shadow-none"
            />
        </div>

        {/* Footer Actions */}
        {(isDirty || !note) && (
            <div className={`flex-shrink-0 px-10 py-4 flex justify-between items-center border-t ${getNoteColor(editorData.background_color).border} ${getNoteColor(editorData.background_color).class} z-20`}>
                    <div className="text-xs text-gray-500 font-medium italic">
                    {note ? `Last edited ${moment(note.updated_at).fromNow()}` : 'Draft'}
                    </div>
                    <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-black/5 text-gray-600">
                        Discard
                    </Button>
                    <Button 
                        type="button" 
                        variant="primary" 
                        disabled={loading} 
                        onClick={() => handleSubmit()}
                        className="px-8 shadow-xl shadow-primary/20"
                    >
                        {loading ? 'Saving...' : 'Save Note'}
                    </Button>
                    </div>
            </div>
        )}
      </div>
    </div>
  );
}
