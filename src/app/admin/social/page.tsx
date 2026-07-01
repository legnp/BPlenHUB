"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Star,
  Linkedin,
  Instagram,
  Phone,
  Globe, 
  Loader2, 
  Calendar as CalendarIcon,
  LayoutDashboard,
  ArrowRight,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialPost, SocialPlatform } from "@/types/social";
import { 
  getSocialPosts, 
  deleteSocialPost, 
  togglePostStatus 
} from "@/actions/social";
import { uploadSocialThumbnailToDrive, deleteSocialThumbnailFromDrive } from "@/actions/social-drive";
import GlassModal from "@/components/ui/GlassModal";
import { SocialPostForm } from "@/components/admin/SocialPostForm";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { getErrorMessage } from "@/lib/utils/errors";

export default function SocialManagementPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await getSocialPosts(false); // Fetch all including inactive
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [posts, searchTerm, platformFilter]);

  const handleDelete = async (post: SocialPost) => {
    if (confirm("Tem certeza que deseja excluir esta postagem permanentemente?")) {
      try {
        const adminToken = await auth.currentUser?.getIdToken();

        // 1. Apagar imagem do Drive se for uma URL do Drive
        await deleteSocialThumbnailFromDrive(post.thumbnail, adminToken);
        
        // 2. Apagar documento do Firestore
        await deleteSocialPost(post.id, adminToken);
        fetchPosts();
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Erro ao excluir post."));
      }
    }
  };

  const handleToggle = async (id: string, field: 'isActive' | 'isFeatured', current: boolean) => {
    try {
      const adminToken = await auth.currentUser?.getIdToken();

      await togglePostStatus(id, field, current, adminToken);
      fetchPosts();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Erro ao atualizar status."));
    }
  };

  const platformIcons: Record<SocialPlatform, any> = {
    article: FileText,
    linkedin: Linkedin,
    instagram: Instagram,
    tiktok: Globe,
    whatsapp: Phone,
    other: Search
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            MEDIA E <span className="text-[var(--accent-start)] italic">EDITORIAL</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium opacity-70">
            Gestão e criação de conteúdos editoriais e de social media.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPost(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent-start)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          Nova Postagem
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
              <LayoutDashboard size={18} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Total de Posts</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)]">{posts.length}</div>
        </div>
        <div className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
              <Eye size={18} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Ativos no Site</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)]">{posts.filter(p => p.isActive).length}</div>
        </div>
        <div className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
              <Star size={18} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Em Destaque</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)]">{posts.filter(p => p.isFeatured).length}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] sticky top-4 z-10 shadow-2xl backdrop-blur-3xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
          <input
            type="text"
            placeholder="Buscar por título ou legenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
          />
        </div>

        <div className="flex items-center bg-[var(--bg-primary)]/50 p-1.5 rounded-2xl border border-[var(--input-border)] gap-1 overflow-x-auto">
          {['all', 'article', 'linkedin', 'instagram', 'tiktok', 'whatsapp'].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat as any)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest shrink-0 ${platformFilter === plat
                  ? "bg-[var(--accent-start)] text-white shadow-xl shadow-[var(--accent-start)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
            >
              {plat === 'all' ? 'Todos' : plat === 'article' ? 'Artigos' : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-[var(--input-bg)] animate-pulse rounded-[2.5rem] border border-[var(--border-primary)]" />
          ))
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] bg-[var(--input-bg)]/50">
            <Globe className="w-16 h-16 text-[var(--text-muted)] opacity-10 mx-auto mb-6" />
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.3em]">Nenhuma postagem encontrada</p>
            <p className="text-[11px] text-[var(--text-muted)] opacity-40 mt-3 max-w-xs mx-auto">Aumente sua presença digital cadastrando novos conteúdos.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <motion.div
              layout
              key={post.id}
              className={`group relative flex flex-col bg-[var(--input-bg)] border rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                post.isActive ? "border-[var(--border-primary)]" : "border-dashed border-gray-400 opacity-60"
              }`}
            >
              {/* Thumbnail Area */}
              <div className="relative h-48 overflow-hidden bg-black/10">
                <img 
                  src={post.thumbnail} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Platform Badge */}
                <div className="absolute top-4 left-4 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white border border-white/10">
                  {React.createElement(platformIcons[post.platform] || Search, { size: 14 })}
                </div>

                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={() => handleToggle(post.id, 'isActive', post.isActive)}
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                      post.isActive ? "bg-green-500/80 border-green-500/30 text-white" : "bg-gray-500/80 border-gray-500/30 text-white"
                    }`}
                  >
                    {post.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button 
                    onClick={() => handleToggle(post.id, 'isFeatured', post.isFeatured)}
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                      post.isFeatured ? "bg-yellow-500/80 border-yellow-500/30 text-white" : "bg-gray-500/80 border-gray-400/30 text-white"
                    }`}
                  >
                    <Star size={14} />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon size={12} className="text-[var(--accent-start)] opacity-60" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Publicado em {post.publishedAt}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight line-clamp-1 mb-2 group-hover:text-[var(--accent-start)] transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium line-clamp-2 mb-6">
                  {post.summary}
                </p>

                <div className="mt-auto pt-6 border-t border-[var(--border-primary)] flex justify-between items-center">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingPost(post);
                        setIsFormOpen(true);
                      }}
                      className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] hover:text-blue-500 transition-all hover:bg-blue-500/5 group/btn"
                    >
                      <Edit3 size={14} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleDelete(post)}
                      className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] hover:text-red-500 transition-all hover:bg-red-500/5 group/btn"
                    >
                      <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>

                  {post.platform === 'article' ? (
                    <Link 
                      href={`/conteudo/artigo/${post.slug || post.id}`}
                      target="_blank" 
                      className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--accent-start)] hover:gap-3 transition-all"
                    >
                      Ler Artigo <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <a 
                      href={post.url} 
                      target="_blank" 
                      className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--accent-start)] hover:gap-3 transition-all"
                    >
                      Ver original <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <SocialPostForm 
            post={editingPost}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchPosts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
