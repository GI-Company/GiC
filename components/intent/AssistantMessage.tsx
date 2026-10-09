import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';

// Strip provider-only citation markers from prose, preserving code examples.
function cleanCitations() {
  return (tree: Root) => {
    function walk(node: { type: string; value?: string; children?: typeof node[] }) {
      if (node.type === 'text' && node.value) {
        node.value = node.value
          .replace(/【[^】\n]*†[^】\n]*】/g, '')
          .replace(/\uE200cite\uE202[^\uE201]*\uE201/g, '');
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}

const plugins = [remarkGfm, cleanCitations];

export default memo(function AssistantMessage({ text }: { text: string }) {
  return (
    <div className="assistant-message min-w-0 text-[15px] leading-7 text-slate-800 sm:text-base">
      <ReactMarkdown remarkPlugins={plugins} skipHtml components={{
        h1: ({ children }) => <h2>{children}</h2>,
        table: ({ children }) => (
          <div className="my-5 max-w-full overflow-x-auto rounded-xl border border-slate-200" role="region" aria-label="Response table" tabIndex={0}>
            <table>{children}</table>
          </div>
        ),
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        // Remote images must not track readers just because a model generated a URL.
        img: ({ alt }) => <span className="text-sm text-slate-500">{alt ? `[Image: ${alt}]` : '[Image]'}</span>,
      }}>{text}</ReactMarkdown>
    </div>
  );
});
