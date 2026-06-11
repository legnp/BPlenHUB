import React from "react";
import { notFound } from "next/navigation";
import { getSocialPostById } from "@/actions/social";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import Link from "next/link";
import { ArticleContent } from "@/components/hub/ArticleContent";
import { DynamicFeedbackForm } from "@/components/hub/DynamicFeedbackForm";

interface ArticlePageProps {
  params: { id: string };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const post = await getSocialPostById(params.id);

  if (!post || post.platform !== 'article') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1D1D1F] relative pb-24">
      {/* Decorative Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0080] rounded-full blur-[180px] opacity-[0.03] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#667eea] rounded-full blur-[180px] opacity-[0.03] pointer-events-none -z-10" />

      {/* Header Container */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <Link 
          href="/conteudo" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para Conteúdos
        </Link>

        {/* Article Meta */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-3 py-1.5 bg-white border border-gray-100 shadow-sm text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
              Artigo BPlen
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author || "Equipe BPlen"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.publishedAt}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 3 min leitura</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black leading-[1.1]">
            {post.title}
          </h1>
          
          <p className="text-xl text-gray-500 leading-relaxed font-light">
            {post.summary}
          </p>
        </div>
      </div>

      {/* Hero Image (if exists) */}
      {post.thumbnail && (
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-gray-100">
            <img 
              src={post.thumbnail} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="max-w-3xl mx-auto px-6 mb-24">
        <div className="bg-white border border-gray-100 rounded-[3rem] shadow-xl p-8 md:p-16">
          <ArticleContent content={post.content || ""} />
        </div>
      </div>

      {/* NPS Evaluation Area */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-8 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-black mb-2">O que achou deste artigo?</h3>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Sua opinião é fundamental para desenvolver a nossa linha editorial para melhor continuar te servindo.
          </p>
          <DynamicFeedbackForm surveyId={`content_evaluation_${post.id}`} />
        </div>
      </div>
    </main>
  );
}
