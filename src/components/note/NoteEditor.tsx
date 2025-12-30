import { useState, useEffect } from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { NOTE_COLORS, getNoteColor } from '../../constants/notes';
import { Switch } from '../ui/Switch';

export interface NoteEditorData {
    title: string;
    content: string;
    tagline?: string;
    background_color: string;
    remind_at?: string;
    is_reminder?: boolean;
    reminder_channel?: 'email' | 'webhook' | 'whatsapp';
    webhook_url?: string;
    webhook_payload?: string;
    whatsapp_phone?: string;
}

interface NoteEditorProps {
    initialData?: Partial<NoteEditorData>;
    onChange: (data: NoteEditorData) => void;
    // UI Props
    className?: string;
    isSettingsOpen?: boolean; // Controlled visibility for settings
    hideReminder?: boolean;
}

export function NoteEditor({ initialData, onChange, className = '', hideReminder = false, isSettingsOpen = true }: NoteEditorProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [tagline, setTagline] = useState(initialData?.tagline || '');
    const [color, setColor] = useState(initialData?.background_color || 'white');
    const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(!!initialData?.title);
    
    // Reminder state
    const [isReminder, setIsReminder] = useState(initialData?.is_reminder || false);
    const [remindAt, setRemindAt] = useState(initialData?.remind_at || '');
    const [reminderChannel, setReminderChannel] = useState<'email' | 'webhook' | 'whatsapp' | undefined>(initialData?.reminder_channel);
    const [webhookUrl, setWebhookUrl] = useState(initialData?.webhook_url || '');
    const [webhookPayload, setWebhookPayload] = useState(initialData?.webhook_payload || '');
    const [whatsappPhone, setWhatsappPhone] = useState(initialData?.whatsapp_phone || '');

    // ... (Auto-title and Propagate changes useEffects remain strictly same) ...

    // Auto-generate title logic
    useEffect(() => {
        if (!isTitleManuallyEdited && content) {
            // Pre-process HTML to ensure newlines are preserved
            // textContent joins non-block elements, so <p>A</p><p>B</p> becomes AB if not handled.
            const processedContent = content
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
                 const firstSentence = firstLine.split(/[.?!]/, 1)[0].trim();
                let newTitle = firstSentence.substring(0, 50) + (firstSentence.length > 50 ? '...' : '');
                
                // Auto Format Title Case
                if (newTitle.length > 0) {
                     newTitle = newTitle
                      .toLowerCase()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
  
                    if (newTitle !== title) {
                         setTitle(newTitle);
                    }
                }
            }
        }
    }, [content, isTitleManuallyEdited]);

    // Propagate changes
    useEffect(() => {
        onChange({
            title,
            content,
            tagline,
            background_color: color,
            is_reminder: isReminder,
            remind_at: remindAt,
            reminder_channel: reminderChannel,
            webhook_url: webhookUrl,
            webhook_payload: webhookPayload,
            whatsapp_phone: whatsappPhone
        });
    }, [title, content, tagline, color, isReminder, remindAt, reminderChannel, webhookUrl, webhookPayload, whatsappPhone]);

    return (
        <div className={`relative group transition-colors duration-300 ${getNoteColor(color).class} p-6 rounded-xl border ${getNoteColor(color).border} ${className}`}>
             {/* Header Inputs */}
             <div className="space-y-2 mb-2">
                <input
                    type="text"
                    placeholder="Judul Note"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setIsTitleManuallyEdited(true);
                    }}
                    className="bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none w-full"
                />
                <input
                    type="text"
                    placeholder="..."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="bg-transparent text-base text-gray-500 placeholder-gray-300 focus:outline-none w-full"
                />
            </div>

            {/* Rich Text Editor - No scroll container here, let it flow */}
            <div className="min-h-[75vh] mb-8">
                <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Tulis catatan di sini..."
                    className={`min-h-[75vh] ${getNoteColor(color).class} border-none focus:ring-0`}
                />
            </div>

             {/* Settings Panel */}
             {isSettingsOpen && (
                <div className={`sticky bottom-0 z-10 pt-6 border-t border-gray-200/50 space-y-6 animate-in fade-in slide-in-from-top-2 bg-white -mx-6 -mb-6 px-6 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
                 {/* Color Picker */}
                <div>
                     <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Background Color</p>
                    <div className="flex flex-wrap gap-2">
                        {NOTE_COLORS.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setColor(c.value)}
                                className={`
                                    w-8 h-8 rounded-full border transition-all duration-200
                                    ${c.class} ${c.border}
                                    ${color === c.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'}
                                `}
                                title={c.id}
                            />
                        ))}
                    </div>
                </div>

                {/* Reminder Settings (Conditional) */}
                {!hideReminder && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Set Reminder</span>
                            <Switch checked={isReminder} onChange={setIsReminder} />
                        </div>
                        
                        {isReminder && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                {/* Reminder Date Input */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={remindAt}
                                        onChange={(e) => setRemindAt(e.target.value)}
                                        className="block w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white/50"
                                    />
                                </div>

                                {/* Channel Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Channel</label>
                                    <select
                                        value={reminderChannel || ''}
                                        onChange={(e) => setReminderChannel(e.target.value as 'email' | 'webhook' | undefined)}
                                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white/50"
                                    >
                                        <option value="">Select Channel</option>
                                        <option value="email">Email</option>
                                        <option value="webhook">Webhook</option>
                                        <option value="whatsapp">WhatsApp</option>
                                    </select>
                                </div>

                                {/* WhatsApp Settings */}
                                {reminderChannel === 'whatsapp' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                                                WhatsApp Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="628xxxxxxxxxx"
                                                value={whatsappPhone}
                                                onChange={(e) => setWhatsappPhone(e.target.value)}
                                                className={`block w-full px-3 py-2 text-sm border rounded-md focus:ring-primary focus:border-primary bg-white/50 placeholder-gray-400 ${
                                                    !whatsappPhone ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300'
                                                }`}
                                            />
                                            {!whatsappPhone ? (
                                                <p className="text-[10px] text-red-500 mt-1">Required for WhatsApp channel</p>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 mt-1">Format: Country code (e.g. 62) + Number. No symbols.</p>
                                            )}
                                        </div>

                                        {/* Message Preview */}
                                        <div className="bg-[#DCF8C6] border border-[#d1eec1] p-3 rounded-lg text-sm text-gray-800 relative">
                                            <div className="absolute top-2 right-2 flex gap-1 items-center opacity-50">
                                                <span className="text-[10px]">now</span>
                                            </div>
                                            <p className="mb-2"><strong>{title || 'Untitled Note'}</strong></p>
                                            <p className="mb-2 whitespace-pre-wrap line-clamp-3">
                                                {content.replace(/<[^>]*>?/gm, '').trim() || 'This is the note content...'}
                                            </p>
                                            {tagline && (
                                                <p className="italic text-gray-600 mb-2">_{tagline}_</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-black/5">
                                                — {initialData?.title ? 'Your Organization' : 'ResponseWatch Reminder'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Webhook Settings */}
                                {reminderChannel === 'webhook' && (
                                    <div className="animate-in fade-in slide-in-from-top-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                                                Webhook URL <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://discord.com/api/webhooks/..."
                                                value={webhookUrl}
                                                onChange={(e) => setWebhookUrl(e.target.value)}
                                                className={`block w-full px-3 py-2 text-sm border rounded-md focus:ring-primary focus:border-primary bg-white/50 placeholder-gray-400 ${
                                                    !webhookUrl ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300'
                                                }`}
                                            />
                                            {!webhookUrl && <p className="text-[10px] text-red-500 mt-1">Required for webhook channel</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Custom Payload (JSON)</label>
                                            <textarea
                                                rows={3}
                                                placeholder={'{\n  "content": "Reminder: {{title}}"\n}'}
                                                value={webhookPayload}
                                                onChange={(e) => setWebhookPayload(e.target.value)}
                                                className="block w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white/50 font-mono placeholder-gray-400"
                                            />
                                            <p className="mt-1 text-[10px] text-gray-500">
                                                Support custom JSON body. Use <code>{`{{title}}`}</code> and <code>{`{{content}}`}</code> as placeholders.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
             </div>
             )}
        </div>
    );
}
