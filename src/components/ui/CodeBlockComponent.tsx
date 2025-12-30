import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { toast } from 'sonner';
import { useState } from 'react';

export function CodeBlockComponent({ node: { attrs: { language: defaultLanguage }, textContent }, updateAttributes, extension, editor }: NodeViewProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <NodeViewWrapper className="code-block relative group my-4 rounded-lg overflow-hidden bg-[#282c34] text-gray-300">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#21252b] border-b border-gray-700">
          {editor.isEditable ? (
            <select
              contentEditable={false}
              defaultValue={defaultLanguage}
              onChange={(event) => updateAttributes({ language: event.target.value })}
              className="bg-transparent text-xs text-gray-400 focus:outline-none cursor-pointer hover:text-gray-200 uppercase font-medium"
            >
              <option value="null">Auto</option>
              <option disabled>—</option>
              {extension.options.lowlight.listLanguages().map((lang: string) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-400 uppercase font-medium">
              {defaultLanguage || 'Auto'}
            </span>
          )}
        
         <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy code"
        >
           {isCopied ? (
               <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-500">Copied</span>
               </>
           ) : (
               <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
               </>
           )}
        </button>
      </div>
      <pre className="!m-0 !p-4 !bg-transparent overflow-x-auto">
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
}
