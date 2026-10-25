import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Raw HTML in the Markdown is not rendered (react-markdown escapes it without rehype-raw).
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-code:font-mono prose-pre:font-mono">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
