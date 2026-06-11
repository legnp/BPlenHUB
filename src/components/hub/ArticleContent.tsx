"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-a:text-[var(--accent-start)] hover:prose-a:text-[#ff0080] transition-colors prose-img:rounded-2xl prose-img:shadow-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content || "*Nenhum conteúdo disponível.*"}
      </ReactMarkdown>
    </div>
  );
}
