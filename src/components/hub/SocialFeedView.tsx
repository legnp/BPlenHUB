"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  Search,
  Calendar,
  Sparkles,
  Filter,
  ArrowDownUp,
  FileText
} from "lucide-react";
import { SocialPost, SocialPlatform } from "@/types/social";
import Link from "next/link";

interface SocialFeedViewProps {
  posts: SocialPost[];
}

const platformLogos: Record<SocialPlatform, string | null> = {
  linkedin: "/linkedin.webp",
  instagram: "/insta.png",
  tiktok: "/tiktok.png",
  whatsapp: "/whatsapp.png",
  article: null, // Artigos não usam logo
  other: null
};

const platformNames: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  article: "Artigo",
  other: "Insights"
};

type SortOption = 'recent' | 'oldest' | 'az' | 'za' | 'author' | 'platform';

export function SocialFeedView({ posts }: SocialFeedViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const articles = useMemo(() => posts.filter(p => p.platform === 'article'), [posts]);
  const socialPosts = useMemo(() => posts.filter(p => p.platform !== 'article'), [posts]);

  // Função genérica de filtragem e ordenação
  const processPosts = (items: SocialPost[]) => {
    let filtered = items.filter(post => {
      const searchMatch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const platMatch = platformFilter === 'all' || post.platform === platformFilter;
      return searchMatch && platMatch;
    });

    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      switch (sortOption) {
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'recent':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'az':
          return a.title.localeCompare(b.title);
        case 'za':
          return b.title.localeCompare(a.title);
        case 'author':
          return (a.author || "").localeCompare(b.author || "");
        case 'platform':
          return a.platform.localeCompare(b.platform);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const processedArticles = processPosts(articles);
  const processedSocial = processPosts(socialPosts);

  return (
    <div className="space-y-12">
      {/* Action Bar: Search, Filter, Sort */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conteúdos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-black focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown Filtro */}
          <div className="relative group">
            <button className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors" title="Filtro">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              {['all', 'article', 'linkedin', 'instagram', 'tiktok', 'whatsapp'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat as any)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                    platformFilter === plat ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {plat === 'all' ? 'Todos' : plat === 'article' ? 'Artigos' : plat}
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown Ordenação */}
          <div className="relative group">
            <button className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors" title="Ordenar por">
              <ArrowDownUp className="w-5 h-5 text-gray-600" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              {[
                { id: 'recent', label: 'Mais recentes' },
                { id: 'oldest', label: 'Mais antigos' },
                { id: 'az', label: 'Título: A-Z' },
                { id: 'za', label: 'Título: Z-A' },
                { id: 'author', label: 'Por Autor' },
                { id: 'platform', label: 'Por Canal' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortOption(opt.id as SortOption)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                    sortOption === opt.id ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 4 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Column 1: Articles */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-[var(--accent-start)]" />
            <h2 className="text-lg font-black tracking-tight uppercase text-black">Artigos</h2>
          </div>
          
          {processedArticles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nenhum artigo</p>
            </div>
          ) : (
            processedArticles.map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer"
              >
                <Link href={`/conteudo/artigo/${article.id}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Artigo
                    </span>
                    {article.isFeatured && (
                      <span className="px-2 py-1 bg-[#ff0080]/10 text-[#ff0080] rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={10} /> Destaque
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-base font-bold text-black leading-tight mb-2 group-hover:text-[var(--accent-start)] transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {article.summary}
                  </p>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {article.author || "BPlen"} | {article.publishedAt} | 3 min de leitura
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Columns 2-4: Social Media */}
        <div className="col-span-1 lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedSocial.length === 0 ? (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/50">
                <Sparkles className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Nenhum conteúdo no momento</p>
              </div>
            ) : (
              processedSocial.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative flex flex-col bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  {post.isFeatured && (
                    <div className="absolute top-6 right-6 z-10 px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-xl">
                      <Sparkles size={10} className="text-[var(--accent-start)]" />
                      Destaque
                    </div>
                  )}

                  <div className="relative h-48 overflow-hidden bg-gray-50">
                    <img 
                      src={post.thumbnail} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
                    
                    <div className="absolute bottom-4 left-4 w-8 h-8 bg-black backdrop-blur-md rounded-xl border border-white/10 shadow-xl group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden">
                      {platformLogos[post.platform] ? (
                        <img 
                          src={platformLogos[post.platform]!} 
                          alt={post.platform} 
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <Sparkles size={14} className="text-white" />
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={10} className="text-gray-300" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                        {post.publishedAt}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-200 mx-1" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                        {platformNames[post.platform]}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-black tracking-tight mb-2 group-hover:text-[var(--accent-start)] transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>

                    <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-2 mb-6 opacity-80">
                      {post.summary}
                    </p>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-black hover:text-[var(--accent-start)] transition-all group/link"
                      >
                        Ler Post <ArrowUpRight size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
