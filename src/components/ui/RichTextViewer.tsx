import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import { useEffect } from 'react';
import { CodeBlockComponent } from './CodeBlockComponent';

// Create lowlight instance
const lowlight = createLowlight(common);

interface RichTextViewerProps {
  content: string;
  className?: string; 
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, 
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
         openOnClick: true,
         HTMLAttributes: {
          class: 'text-blue-500 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none',
      },
    },
    content: content,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
       // Only set content if it's strictly different
       editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <EditorContent editor={editor} className={className} />
  );
}
