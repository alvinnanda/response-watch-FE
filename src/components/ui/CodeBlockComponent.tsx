import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function CodeBlockComponent({ node: { attrs: { language: defaultLanguage } }, updateAttributes, extension }: NodeViewProps) {
  return (
    <NodeViewWrapper className="code-block relative group my-4 rounded-lg overflow-hidden bg-[#282c34] text-gray-300">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#21252b] border-b border-gray-700">
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
        
         <button
            onClick={() => {
                // We can't easily access the text content ref here without forwarding refs or traversing DOM
                // But for NodeView, the content is in the DOM.
                // A simpler way for "Edit Mode" copy is less critical since user can just select text.
                // But let's verify if we can add it later. For now, focus on Language Selector.
            }}
            className="text-xs text-xs text-gray-500 hover:text-gray-300"
        >
           {/* Placeholder for copy if needed, or just keep cleaner UI */}
        </button>
      </div>
      <pre className="!m-0 !p-4 !bg-transparent overflow-x-auto">
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
}
