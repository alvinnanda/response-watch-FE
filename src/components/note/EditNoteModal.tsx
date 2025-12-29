import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button, Input, Switch } from '../../components/ui';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { createNote, updateNote } from '../../api/notes';
import type { Note, CreateNoteRequest } from '../../types/notes';
import moment from 'moment';
import { NOTE_COLORS, getNoteColor } from '../../constants/notes';

interface EditNoteModalProps {
  note?: Note | null; // If null, creating new note
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditNoteModal({ note, isOpen, onClose, onSuccess }: EditNoteModalProps) {
  const [formData, setFormData] = useState<CreateNoteRequest>({
    title: '',
    tagline: '',
    content: '',
    is_reminder: false,
    reminder_channel: 'email',
    background_color: 'default',
    remind_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        tagline: note.tagline || '',
        content: note.content,
        is_reminder: note.is_reminder,
        reminder_channel: note.reminder_channel || '',
        background_color: note.background_color || 'default',
        remind_at: note.remind_at ? moment(note.remind_at).format('YYYY-MM-DDTHH:mm') : '',
        webhook_url: note.webhook_url || '',
        webhook_payload: note.webhook_payload || '{\n  "message": "Reminder: {{title}}",\n  "content": "{{content}}"\n}',
      });
      // Ensure existing notes don't get overwritten unless their title was empty/default
      setIsTitleManuallyEdited(!!note.title && note.title !== 'Untitled Note'); 
    } else {
      setFormData({
        title: '',
        tagline: '',
        content: '',
        is_reminder: false,
        reminder_channel: '',
        background_color: 'default',
        remind_at: '',
        webhook_url: '',
        webhook_payload: '{\n  "message": "Reminder: {{title}}",\n  "content": "{{content}}"\n}',
      });
      setIsTitleManuallyEdited(false);
    }
  }, [note, isOpen]);

  // Real-time Auto-Title Effect
  useEffect(() => {
    if (!isTitleManuallyEdited && formData.content) {
        // Pre-process HTML to ensure newlines are preserved
        // textContent joins non-block elements, so <p>A</p><p>B</p> becomes AB if not handled.
        const processedContent = formData.content
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n')
            .replace(/<\/li>/gi, '\n');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Split by lines first
        const firstLine = plainText.split('\n').find(line => line.trim().length > 0);
        
        if (firstLine) {
            // Split by sentence delimiters
            const firstSentence = firstLine.split(/[.?!]/, 1)[0];
            let newTitle = firstSentence.trim().substring(0, 60);
            
            // Auto Format Title Case
            if (newTitle.length > 0) {
                newTitle = newTitle.toLowerCase().split(' ').map(word => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }).join(' ');
            }
            
            if (newTitle !== formData.title && newTitle.length > 0) {
                 setFormData(prev => ({ ...prev, title: newTitle }));
            }
        }
    }
  }, [formData.content, isTitleManuallyEdited]);


  // Determine if content has changed (View vs Edit Mode)
  const isDirty = (() => {
      if (!note) return true; // New note is always dirty/editable initially
      
      const { 
          title, tagline, content, is_reminder, reminder_channel, 
          background_color, remind_at, webhook_url, webhook_payload 
      } = formData;

      const normalize = (val: any) => val ===  null || val === undefined ? '' : val;

      return (
          title !== note.title ||
          normalize(tagline) !== normalize(note.tagline) ||
          content !== note.content ||
          is_reminder !== note.is_reminder ||
          normalize(reminder_channel) !== normalize(note.reminder_channel) ||
          (background_color || 'default') !== (note.background_color || 'default') ||
          normalize(remind_at) !== (note.remind_at ? moment(note.remind_at).format('YYYY-MM-DDTHH:mm') : '') ||
          normalize(webhook_url) !== normalize(note.webhook_url) ||
          normalize(webhook_payload) !== normalize(note.webhook_payload || '{\n  "message": "Reminder: {{title}}",\n  "content": "{{content}}"\n}')
      );
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) {
        onClose();
        return;
    }
    setLoading(true);

    try {
      let payload = { ...formData };

      // Fallback if title is still empty
      if (!payload.title.trim()) {
           payload.title = 'Untitled Note';
      }

      // Validate remind_at if is_reminder is true
      if (payload.is_reminder && !payload.remind_at) {
        toast.error('Please set a reminder time');
        setLoading(false);
        return;
      }

      if (payload.is_reminder && payload.reminder_channel === 'webhook' && !payload.webhook_url) {
        toast.error('Please enter a Webhook URL');
        setLoading(false);
        return;
      }
      
      // Convert local time string to ISO for backend
      if (payload.remind_at) {
        payload.remind_at = moment(payload.remind_at).toISOString();
      } else {
          payload.remind_at = undefined;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden animate-slide-up relative transition-colors duration-300 ${getNoteColor(formData.background_color).class}`}>
        {/* Header Actions (Floating) */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-full transition-all"
                title="Settings"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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

        {/* Form Container - handles structure */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full overflow-hidden">
            
            {/* Unified Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* 1. Header Section (Title + Tagline) - Now scrolls with content */}
                <div className="px-10 pt-6 pb-0 z-0 group">
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value });
                            setIsTitleManuallyEdited(true);
                        }}
                        placeholder="Judul"
                        required
                        className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-800 p-0 tracking-tight"
                    />
                    <input
                         type="text"
                         value={formData.tagline}
                         onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                         placeholder="..."
                         className="w-full text-lg mt-1 bg-transparent border-none focus:ring-0 placeholder-gray-400/70 text-gray-600 p-0 font-medium opacity-80 hover:opacity-100 focus:opacity-100 transition-opacity"
                    />
                </div>

                {/* 2. Content Area (Editor) - Expands naturally */}
                <div className="px-6 pb-20 relative z-0 min-h-[50vh]">
                    <RichTextEditor
                        value={formData.content}
                        onChange={(value) => setFormData({ ...formData, content: value })}
                        placeholder="Start writing..."
                        className="min-h-[300px] border-none bg-transparent shadow-none"
                    />
                </div>
            </div>

            {/* 3. Sliding Settings Panel - Fixed at bottom above footer */}
             <div className={`flex-shrink-0 transition-all duration-300 border-t border-black/5 bg-white/50 backdrop-blur-md overflow-hidden ${showSettings ? 'max-h-[60vh] py-6 px-10' : 'max-h-0 py-0 border-none'}`}>
                 <div className="flex flex-col gap-8 animate-fade-in">
                    {/* Color Picker */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
                         <div className="flex flex-wrap gap-3">
                            {NOTE_COLORS.map((color) => (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, background_color: color.value })}
                                    className={`w-8 h-8 rounded-full border shadow-sm transition-all ${color.class} ${color.border} ${formData.background_color === color.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-110'}`}
                                    title={color.id}
                                />
                            ))}
                         </div>
                    </div>

                    {/* Reminder Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Set Reminder</span>
                            <Switch
                                checked={formData.is_reminder}
                                onChange={(checked) => setFormData({ ...formData, is_reminder: checked })}
                            />
                        </div>

                        {formData.is_reminder && (
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200/60 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.remind_at}
                                    onChange={(e) => setFormData({ ...formData, remind_at: e.target.value })}
                                    className="w-full bg-white/80 border-gray-200 focus:border-primary text-sm"
                                    min={moment().format('YYYY-MM-DDTHH:mm')}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                                <select
                                    value={formData.reminder_channel}
                                    onChange={(e) => setFormData({ ...formData, reminder_channel: e.target.value as 'email' | 'webhook' | '' })}
                                    className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">None</option>
                                    <option value="webhook">Webhook</option>
                                    <option value="email" disabled>Email (Pro)</option>
                                </select>
                            </div>

                            {formData.reminder_channel === 'webhook' && (
                                <div className="space-y-3 pt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Webhook URL</label>
                                        <Input
                                            type="url"
                                            placeholder="https://..."
                                            value={formData.webhook_url || ''}
                                            onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                                            className="w-full bg-white/80 border-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Payload (JSON)</label>
                                        <textarea
                                            value={formData.webhook_payload || ''}
                                            onChange={(e) => setFormData({ ...formData, webhook_payload: e.target.value })}
                                            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary focus:border-primary font-mono text-xs"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                 </div>
             </div>

            {/* 4. Fixed Footer Actions - Only visible if changes made */}
            {isDirty && (
                <div className={`flex-shrink-0 px-10 py-4 flex justify-between items-center border-t border-black/5 bg-white/30 backdrop-blur-sm animate-slide-up`}>
                     <div className="text-xs text-gray-500 font-medium italic">
                        {note ? `Last edited ${moment(note.updated_at).fromNow()}` : 'Draft'}
                     </div>
                     <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-black/5 text-gray-600">
                            Discrd
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading} className="px-8 shadow-xl shadow-primary/20">
                            {loading ? 'Saving...' : 'Save Note'}
                        </Button>
                     </div>
                </div>
            )}
        </form>
      </div>
    </div>
  );
}
