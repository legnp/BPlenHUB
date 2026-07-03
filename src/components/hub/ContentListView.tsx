"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ExternalLink, 
  Filter, 
  Calendar, 
  ArrowRight, 
  X,
  Send 
} from "lucide-react";
import { BPlenContent } from "@/types/hub";
import { LANDING_TOKENS } from "@/constants/landing-tokens";

interface ContentListViewProps {
  contents: BPlenContent[];
}

export function ContentListView({ contents }: ContentListViewProps) {
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [activeModalContent, setActiveModalContent] = useState<BPlenContent | null>(null);

  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
      const matchSource = !selectedSource || c.source === selectedSource;
      return matchSearch && matchSource;
    });
  }, [contents, search, selectedSource]);

  const sources = Array.from(new Set(contents.map((c) => c.source)));

  return (
    <div className="space-y-12 pb-24">
      
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar conteúdos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-black transition-all outline-none text-black font-medium"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          <button 
            onClick={() => setSelectedSource(null)}
            className={`px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap
              ${!selectedSource ? "bg-black text-white shadow-lg" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
          >
            Todos
          </button>
          {sources.map((source) => (
            <button 
              key={source}
              onClick={() => setSelectedSource(source)}
              className={`px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap
                ${selectedSource === source ? "bg-black text-white shadow-lg" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredContents.map((content) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={content.id}
              onClick={() => setActiveModalContent(content)}
              className="group bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-gray-200 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all cursor-pointer flex flex-col h-full"
            >
              {/* Meta Info */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  <SourceIcon source={content.source} />
                  {content.source}
                </span>
                <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(content.publishedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-black mb-4 flex-grow leading-snug group-hover:text-[#ff0080] transition-colors">
                {content.title}
              </h3>

              {/* Action */}
              <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                Ver Conteúdo
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredContents.length === 0 && (
        <div className="py-32 text-center space-y-4">
          <p className="text-gray-400 font-medium">Nenhum conteúdo encontrado para sua busca.</p>
          <button 
            onClick={() => { setSearch(""); setSelectedSource(null); }}
            className="text-xs font-black text-[#ff0080] uppercase tracking-widest hover:underline"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Modal Resumo (Confirm Exit) */}
      <AnimatePresence>
        {activeModalContent && (
          <div className="fixed inset-0 z-overlay flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveModalContent(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 overflow-hidden shadow-2xl"
            >
              {/* Decoration background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-8">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-gray-50 rounded-2xl w-fit">
                    <SourceIcon source={activeModalContent.source} className="w-8 h-8" />
                  </div>
                  <button 
                    onClick={() => setActiveModalContent(null)}
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff0080]">Redirecionamento Externo</span>
                  <h2 className="text-2xl font-bold text-black leading-tight">
                    {activeModalContent.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Este conteúdo foi publicado no **{activeModalContent.source}**. 
                    Ao clicar abaixo, você será levado para a rede social oficial da BPlen.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <a 
                    href={activeModalContent.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-5 bg-black text-white font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Continuar para {activeModalContent.source} <ExternalLink size={16} />
                  </a>
                  <button 
                    onClick={() => setActiveModalContent(null)}
                    className="w-full py-5 text-gray-400 font-bold text-xs tracking-widest uppercase hover:text-black transition-colors"
                  >
                    Permanecer aqui
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SourceIcon({ source, className }: { source: string; className?: string }) {
  switch (source) {
    case "LinkedIn": return <LinkedinIcon className={className || "w-4 h-4 text-[#0077B5]"} />;
    case "Instagram": return <InstagramIcon className={className || "w-4 h-4 text-[#E1306C]"} />;
    case "TikTok": return <Send className={className || "w-4 h-4 text-[#00f2ea]"} />;
    case "Youtube": return <YoutubeIcon className={className || "w-4 h-4 text-[#FF0000]"} />;
    default: return <ExternalLink className={className || "w-4 h-4 text-gray-400"} />;
  }
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
}
