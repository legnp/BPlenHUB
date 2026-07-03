"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Star, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialPost } from "@/types/social";
import { getSocialPosts } from "@/actions/social";
import { submitContentFeedback } from "@/actions/feedback";
import { getErrorMessage } from "@/lib/utils/errors";

interface ContentEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid?: string | null;
  matricula?: string | null;
}

export function ContentEvaluationModal({ isOpen, onClose, uid, matricula }: ContentEvaluationModalProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado local para avaliações temporárias
  const [evaluations, setEvaluations] = useState<Record<string, { rating: number; comment: string }>>({});

  useEffect(() => {
    if (isOpen) {
      loadPosts();
    }
  }, [isOpen]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getSocialPosts(true);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (postId: string, rating: number) => {
    setEvaluations(prev => ({
      ...prev,
      [postId]: { ...prev[postId] || { comment: "" }, rating }
    }));
    setSuccessId(null);
  };

  const handleComment = (postId: string, comment: string) => {
    setEvaluations(prev => ({
      ...prev,
      [postId]: { ...prev[postId] || { rating: 0 }, comment }
    }));
  };

  const handleSubmit = async (post: SocialPost) => {
    const evalData = evaluations[post.id];
    if (!evalData || evalData.rating === 0) {
      setError("Por favor, selecione uma nota antes de enviar.");
      return;
    }

    setSubmittingId(post.id);
    setError(null);

    try {
      await submitContentFeedback({
        postId: post.id,
        title: post.title,
        platform: post.platform,
        publishedAt: post.publishedAt,
        rating: evalData.rating,
        comment: evalData.comment,
        uid,
        matricula
      });
      
      setSuccessId(post.id);
      // Limpar este item da avaliação após sucesso
      setEvaluations(prev => {
        const next = { ...prev };
        delete next[post.id];
        return next;
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--input-bg)]/50 shrink-0">
              <div className="space-y-1 text-left">
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  Avaliar Conteúdos
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                  Sua opinião ajuda a moldar o editorial BPlen
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent-start)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-4 bg-white/5 border-b border-[var(--border-primary)] flex items-center gap-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40 px-0.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por título ou tema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl pl-12 pr-4 py-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all shadow-inner"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] rounded-xl border border-[var(--border-primary)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                <Filter size={12} /> {filteredPosts.length} Resultados
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar text-left bg-gray-50/10">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sincronizando com a base BPlen...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-24 text-center opacity-40">
                  <p>Nenhum conteúdo encontrado para sua busca.</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div 
                    key={post.id}
                    className="p-6 bg-white border border-[var(--border-primary)] rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-start lg:items-center"
                  >
                    {/* Thumbnail & Info */}
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                        <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-black tracking-tight line-clamp-1">{post.title}</h4>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1.5 opacity-60">
                           <span className="flex items-center gap-1"><Calendar size={10} /> {post.publishedAt}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300" />
                           <span className="text-[var(--accent-start)]">{post.platform}</span>
                        </div>
                      </div>
                    </div>

                    {/* Likert Scale */}
                    <div className="flex flex-col gap-3 shrink-0 lg:w-48">
                      <div className="flex items-center justify-between lg:justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(post.id, star)}
                            className={`p-1.5 transition-all hover:scale-110 active:scale-95 ${
                              (evaluations[post.id]?.rating || 0) >= star 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-gray-200"
                            }`}
                          >
                            <Star size={20} />
                          </button>
                        ))}
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-center opacity-30">Nota Likert (1-5)</p>
                    </div>

                    {/* Comment & Submit */}
                    <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1">
                      <div className="relative flex-1">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Comentário opcional..."
                          value={evaluations[post.id]?.comment || ""}
                          onChange={(e) => handleComment(post.id, e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-bold text-gray-700 focus:outline-none focus:border-[var(--accent-start)]/50 transition-all shadow-inner"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmit(post)}
                        disabled={submittingId === post.id}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0 ${
                          successId === post.id
                          ? "bg-green-500 text-white"
                          : "bg-black text-white hover:bg-[var(--accent-start)]"
                        } disabled:opacity-50`}
                      >
                        {submittingId === post.id ? <Loader2 size={12} className="animate-spin" /> : 
                         successId === post.id ? <CheckCircle2 size={12} /> : "Enviar"}
                        {successId === post.id ? "Salvo" : "Salvar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[var(--border-primary)] bg-[var(--input-bg)]/50 shrink-0 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">© BPlen Feedback Cycle</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
