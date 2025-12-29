import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import { useEffect, useState } from 'react';
import { CodeBlockComponent } from './CodeBlockComponent';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

// Create lowlight instance
const lowlight = createLowlight(common);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // For wrapper styles
}

export function RichTextEditor({ value, onChange, placeholder = 'Write something...', className }: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default codeBlock to use Lowlight
      }),
      TextStyle,
      Color,
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content if value changes externally (and editor matches content logic usually needed, 
  // but for simple note editing, assuming one-way or careful sync)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Only set content if it's strictly different to avoid cursor jumps
      // A simple check: if editor is empty and value is not, set it.
      // If we are typing, onUpdate handles it.
      // Ideally we check if focused.
      if (!editor.isFocused) {
          editor.commands.setContent(value);
      }
    }
  }, [value, editor]);


  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleCode = () => editor.chain().focus().toggleCode().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor.chain().focus().toggleCodeBlock().run();
  
  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href;
    
    if (previousUrl) {
      setLinkUrl(previousUrl);
    } else {
      // Try to get selected text and see if it looks like a URL
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      // Simple heuristic: no spaces, contains dot, or starts with http/www
      if (text && !text.includes(' ') && (text.includes('.') || text.startsWith('http'))) {
        setLinkUrl(text.startsWith('www') ? `https://${text}` : text);
      } else {
        setLinkUrl('');
      }
    }
    
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = () => {
    // empty
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // update
      if (editor.state.selection.empty) {
        // If nothing is selected, insert the URL as text and link it
        editor.chain().focus()
            .insertContent({
                type: 'text',
                text: linkUrl,
                marks: [{ type: 'link', attrs: { href: linkUrl } }],
            })
            .run();
      } else {
         editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }
    setIsLinkModalOpen(false);
  };


  const ToolbarButton = ({ onClick, isActive, children, title }: { onClick: () => void, isActive?: boolean, children: React.ReactNode, title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors text-gray-600 hover:bg-gray-100 ${isActive ? 'bg-gray-200 text-gray-900 font-medium' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`rounded-lg overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all ${(className || '').includes('border') ? '' : 'border border-gray-300'} ${className || ''}`}>
      {/* Toolbar */}
      <div 
        className={`flex flex-wrap items-center gap-1 shrink-0 px-3 py-2 border-b border-gray-100 bg-gray-50/50 transition-opacity duration-300 ${editor.isFocused ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 py-0 border-none overflow-hidden'}`}
      >
        <select
          value={
            editor.isActive('heading', { level: 1 })
              ? 'h1'
              : editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
              ? 'h3'
              : 'p'
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
            else editor.chain().focus().setParagraph().run();
          }}
          className="h-8 text-xs border border-gray-200 rounded-md bg-white px-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mr-1"
        >
          <option value="p">Text</option>
          <option value="h1">Title (H1)</option>
          <option value="h2">Heading (H2)</option>
          <option value="h3">Subheading (H3)</option>
        </select>

        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={toggleBold} isActive={editor.isActive('bold')} title="Bold">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h8a4 4 0 100-8H6v8zm0 0v8" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={toggleItalic} isActive={editor.isActive('italic')} title="Italic">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 4h-9m4 16h5M10 4L6 20" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={toggleUnderline} isActive={editor.isActive('underline')} title="Underline">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21H5m14-4v-5a7 7 0 00-14 0v5" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={toggleStrike} isActive={editor.isActive('strike')} title="Strikethrough">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </ToolbarButton>
        
        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton onClick={toggleBulletList} isActive={editor.isActive('bulletList')} title="Bullet List">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={toggleOrderedList} isActive={editor.isActive('orderedList')} title="Ordered List">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h12M7 12h12M7 17h12M3 7l1-1 1 1M3 17l1-1 1 1M3 12l1-1 1 1" /></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />
        
        <ToolbarButton onClick={toggleCode} isActive={editor.isActive('code')} title="Inline Code">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={toggleCodeBlock} isActive={editor.isActive('codeBlock')} title="Code Block">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={toggleBlockquote} isActive={editor.isActive('blockquote')} title="Blockquote">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton onClick={openLinkModal} isActive={editor.isActive('link')} title="Link">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />
        
        <div className="flex items-center gap-1 border border-gray-200 rounded-md bg-white px-1 h-8" title="Text Color">
            <input
                type="color"
                onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-6 h-6 border-none p-0 bg-transparent cursor-pointer"
            />
        </div>
      </div>

      {/* Content Area */}
      <EditorContent editor={editor} className="flex-grow overflow-y-auto" />

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
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLink();
                }}
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)} size="sm">
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveLink} size="sm">
                    Save
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
