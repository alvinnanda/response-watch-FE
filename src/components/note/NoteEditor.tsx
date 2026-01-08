
import { useState, useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import { NOTE_COLORS, getNoteColor } from '../../constants/notes';
import { Switch } from '../ui/Switch';
import { formatPhoneNumber, getPhonePlaceholder } from '../../utils/phone';
import { EditorToolbar } from './EditorToolbar';
import { CodeBlockComponent } from '../ui/CodeBlockComponent';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import moment from 'moment';

const lowlight = createLowlight(common);

// Editor Icons (Inline SVG)
const EditorIcons = {
    Quote: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>,
    Sliders: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>,
    Bell: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
    Phone: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    Globe: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
    X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
};

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
    className?: string;
    isSettingsOpen?: boolean; 
    onSettingsChange?: (isOpen: boolean) => void;
    hideReminder?: boolean;
    hideTitle?: boolean;
    hideTagline?: boolean;
    hideSidebar?: boolean;
}

export function NoteEditor({ 
    initialData, 
    onChange, 
    className = '', 
    hideReminder = false, 
    isSettingsOpen = true, 
    onSettingsChange,
    hideTitle = false,
    hideTagline = false,
    hideSidebar = false
}: NoteEditorProps) {
    // ---- State ----
    const [title, setTitle] = useState(initialData?.title || '');
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

    // Link Modal State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // ---- Tiptap Editor Setup ----
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: { levels: [1, 2, 3] }
            }),
            TextStyle,
            Color,
            Underline,
            CodeBlockLowlight.configure({ lowlight }).extend({
                addNodeView() { return ReactNodeViewRenderer(CodeBlockComponent); },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors' },
            }),
            Placeholder.configure({
                placeholder: 'Start writing your amazing note...',
                emptyEditorClass: 'is-editor-empty before:text-gray-400 before:content-[attr(data-placeholder)] before:float-left before:text-base before:pointer-events-none'
            }),
        ],
        content: initialData?.content || '',
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[50vh] text-gray-700 leading-normal prose-p:my-1',
            },
        },
        onUpdate: ({ editor }) => {
            // Auto-title Logic
            if (!isTitleManuallyEdited) {
                const text = editor.getText();
                if (text) {
                    const firstLine = text.split('\n')[0].trim();
                    if (firstLine) {
                         // Simple first sentence extraction
                         const firstSentence = firstLine.split(/[.?!]/, 1)[0].trim();
                         const newTitle = firstSentence.substring(0, 50);
                         if (newTitle && newTitle !== title) setTitle(newTitle);
                    }
                }
            }
        }
    });

    // Sync changes to parent
    const syncData = () => {
        onChange({
            title,
            content: editor?.getHTML() || '',
            tagline,
            background_color: color,
            is_reminder: isReminder,
            remind_at: remindAt,
            reminder_channel: reminderChannel,
            webhook_url: webhookUrl,
            webhook_payload: webhookPayload,
            whatsapp_phone: whatsappPhone
        });
    };

    // Trigger sync on local state changes
    useEffect(() => {
        syncData();
    }, [title, tagline, color, isReminder, remindAt, reminderChannel, webhookUrl, webhookPayload, whatsappPhone]);

    // Trigger sync on editor content changes
    useEffect(() => {
        if (!editor) return;
        
        // Use a wrapper to call syncData from the closure of the effect
        // or just rely on the fact that we need fresh state
        // Actually, simpler: define the listener here
        const handleUpdate = () => {
             // We need to access the LATEST state here.
             // But useEffect closes over the state variables from the render where it was created.
             // If we just blindly attach `syncData` (which is re-created on every render if not memoized, or stale if memoized sans deps),
             // it usually works if we utilize the effect dependency array to re-attach.
             // Re-attaching on every keystroke/render is fine for this scale.
             syncData(); 
        };

        editor.on('update', handleUpdate);
        return () => { editor.off('update', handleUpdate); };
    }, [editor, title, tagline, color, isReminder, remindAt, reminderChannel, webhookUrl, webhookPayload, whatsappPhone]);


    // ---- Handlers ----
    const openLinkModal = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        if (previousUrl) {
            setLinkUrl(previousUrl);
        } else {
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, ' ');
            if (text && !text.includes(' ') && (text.includes('.') || text.startsWith('http'))) {
                setLinkUrl(text.startsWith('www') ? `https://${text}` : text);
            } else {
                setLinkUrl('');
            }
        }
        setIsLinkModalOpen(true);
    };

    const handleSaveLink = () => {
        if (!editor) return;
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            if (editor.state.selection.empty) {
                editor.chain().focus()
                    .insertContent({ type: 'text', text: linkUrl, marks: [{ type: 'link', attrs: { href: linkUrl } }] })
                    .run();
            } else {
                editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
            }
        }
        setIsLinkModalOpen(false);
    };


    // ---- Layout ----
    const theme = getNoteColor(color);

    return (
        <div className={`flex flex-col lg:flex-row h-full overflow-hidden relative ${className}`}>
            
            {/* --- LEFT: MAIN EDITOR AREA --- */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${theme.class} transition-all duration-500`}>
                <EditorToolbar editor={editor} onLinkParams={openLinkModal} className={theme.class} />
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* Title Input */}
                        {!hideTitle && (
                            <input
                                type="text"
                                placeholder="Untitled Note"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setIsTitleManuallyEdited(true);
                                }}
                                className="w-full bg-transparent text-4xl font-extrabold text-gray-900 placeholder-gray-300 border-none outline-none p-0 focus:ring-0 leading-tight"
                            />
                        )}
                        
                        {/* Tagline Input */}
                        {!hideTagline && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <EditorIcons.Quote />
                                <input
                                    type="text"
                                    placeholder="Add a tagline or brief summary..."
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    className="w-full bg-transparent text-lg italic text-gray-600 placeholder-gray-300 border-none outline-none p-0 focus:ring-0"
                                />
                            </div>
                        )}

                        {(!hideTitle || !hideTagline) && <div className="h-px w-full bg-gray-200/50 my-4" />}

                        {/* Editor */}
                        <EditorContent editor={editor} className="min-h-[40vh]" />
                    </div>
                </div>
            </div>


            {/* --- RIGHT: SETTINGS SIDEBAR --- */}
            {/* 
                Mobile: Absolute overlay (inset-0) to cover editor. 
                Desktop: Flex column (w-[320px]) side-by-side. 
            */}
            {!hideSidebar && (
            <div className={`
                bg-white border-l border-gray-200 shadow-xl lg:shadow-none
                flex flex-col 
                h-full 
                transition-all duration-300 ease-in-out
                
                /* Positioning & Sizing */
                absolute inset-0 z-50 w-full
                lg:static lg:z-auto
                
                /* Visibility State (Mobile & Desktop Unified Logic for "isSettingsOpen") */
                ${isSettingsOpen 
                    ? 'translate-x-0 opacity-100 lg:w-[320px] lg:border-l' 
                    : 'translate-x-full opacity-0 pointer-events-none lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-none'
                }
            `}>
                
                {/* Sidebar Header (Always Visible in Sidebar) */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <EditorIcons.Sliders />
                        <span>Appearance</span>
                    </div>
                    <button 
                        onClick={() => onSettingsChange?.(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Close Settings"
                    >
                        <EditorIcons.X />
                    </button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8">
                    
                    {/* Color Section */}
                    {/* ... (Same as before) ... */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Theme Color
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {NOTE_COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`
                                        aspect-square rounded-full border transition-all duration-300
                                        ${c.class} ${c.border}
                                        ${color === c.value ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-md' : 'hover:scale-105 hover:shadow-sm'}
                                    `}
                                    title={c.id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Reminder Section */}
                    {!hideReminder && (
                        <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <EditorIcons.Bell />
                                    Reminder
                                </div>
                                <Switch checked={isReminder} onChange={setIsReminder} />
                            </div>

                            {isReminder && (
                                <div className="space-y-5 animate-in slide-in-from-right-2 fade-in duration-300">
                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-600 block">Date & Time <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <div className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none">
                                                    <EditorIcons.Calendar />
                                                </div>
                                                <input
                                                    type="datetime-local"
                                                    value={remindAt}
                                                    onChange={(e) => setRemindAt(e.target.value)}
                                                    className={`
                                                        w-full pl-9 pr-2 py-2 text-sm rounded-md border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all
                                                        ${!remindAt ? 'border-red-300' : 'border-gray-200'}
                                                    `}
                                                    required
                                                />
                                            </div>
                                            {!remindAt && <p className="text-[10px] text-red-500 pl-1">Required</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-600 block">Channel</label>
                                             <div className="relative">
                                                <select
                                                    value={reminderChannel || ''}
                                                    onChange={(e) => setReminderChannel(e.target.value as any)}
                                                    className="w-full pl-2.5 pr-8 py-2 text-sm rounded-md border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                                >
                                                    <option value="">Select Channel</option>
                                                    <option value="email">Email</option>
                                                    <option value="whatsapp">WhatsApp</option>
                                                    <option value="webhook">Webhook</option>
                                                </select>
                                                <div className="absolute right-2.5 top-3 pointer-events-none text-gray-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Whatsapp Extra */}
                                    {reminderChannel === 'whatsapp' && (
                                         <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                            <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                                                <EditorIcons.Phone /> WhatsApp Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder={getPhonePlaceholder()}
                                                value={whatsappPhone}
                                                onChange={(e) => setWhatsappPhone(e.target.value)}
                                                onBlur={() => whatsappPhone && setWhatsappPhone(formatPhoneNumber(whatsappPhone))}
                                                className={`w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary/20 transition-all ${!whatsappPhone ? 'border-red-300' : 'border-gray-200'}`}
                                            />
                                             {!whatsappPhone && <p className="text-[10px] text-red-500">Required</p>}
                                         </div>
                                    )}

                                    {/* Webhook Extra */}
                                    {reminderChannel === 'webhook' && (
                                         <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="space-y-1">
                                                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                                                     <EditorIcons.Globe /> Webhook URL <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="url"
                                                    placeholder="https://..."
                                                    value={webhookUrl}
                                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                                    className={`w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary/20 transition-all ${!webhookUrl ? 'border-red-300' : 'border-gray-200'}`}
                                                />
                                            </div>
                                             <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-600">JSON Payload</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder='{"content": "{{title}}"}'
                                                    value={webhookPayload}
                                                    onChange={(e) => setWebhookPayload(e.target.value)}
                                                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                         </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="h-px bg-gray-100" />
                    
                    {/* Metadata / Read Only Info */}
                    <div className="space-y-3">
                         <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Information
                        </div>
                        <div className="text-xs text-gray-500 space-y-2">
                             <div className="flex justify-between">
                                <span>Word count</span>
                                <span className="font-medium text-gray-700">{editor?.storage.characterCount?.words() || 0} words</span>
                             </div>
                             <div className="flex justify-between">
                                <span>Last edited</span>
                                <span className="font-medium text-gray-700">{moment().format('MMM D, HH:mm')}</span>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
            )}

            {/* Link Modal */}
            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title="Insert Link"
                width="sm"
            >
                <div className="space-y-4">
                    <Input
                        label="URL"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLink(); }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)} size="sm">Cancel</Button>
                        <Button variant="primary" onClick={handleSaveLink} size="sm">Save</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
