import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none
        prose-headings:font-display prose-headings:text-foreground
        prose-strong:text-foreground prose-strong:font-semibold
        prose-code:text-gold prose-code:bg-gold/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-background/60 prose-pre:border prose-pre:border-gold-dim/15
        prose-a:text-gold prose-a:no-underline hover:prose-a:underline
        prose-li:text-muted-foreground prose-li:marker:text-gold-dim
        prose-th:text-gold-dim prose-th:text-xs prose-th:font-semibold
        prose-td:text-muted-foreground prose-td:text-sm
        prose-table:border-collapse
        prose-tr:border-gold-dim/15
        prose-p:text-muted-foreground prose-p:leading-relaxed
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
