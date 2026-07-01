"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Save, 
  Loader2, 
  Share2, 
  Phone, 
  Globe, 
  Type, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Calendar as CalendarIcon,
  MessageSquare,
  AlertCircle,
  Upload,
  CheckCircle2,
  HardDrive,
  User,
  FileText,
  Bold,
  Italic,
  Heading1,
  Quote,
  List,
  ListOrdered,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { SocialPost, SocialPlatform } from "@/types/social";
import { createSocialPost, updateSocialPost, checkSlugExists } from "@/actions/social";
import { uploadSocialThumbnailToDrive, deleteSocialThumbnailFromDrive } from "@/actions/social-drive";

import GlassModal from "@/components/ui/GlassModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getErrorMessage } from "@/lib/utils/errors";

function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

interface SocialPostFormProps {
  post?: SocialPost | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PLATFORMS: { id: SocialPlatform; label: string; icon: any }[] = [
  { id: 'article', label: 'Artigos', icon: FileText },
  { id: 'linkedin', label: 'LinkedIn', icon: Share2 },
  { id: 'instagram', label: 'Instagram', icon: Share2 },
  { id: 'tiktok', label: 'TikTok', icon: Globe },
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone },
  { id: 'other', label: 'Outro', icon: Type },
];

export function SocialPostForm({ post, onClose, onSuccess }: SocialPostFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSlugDuplicate, setIsSlugDuplicate] = useState(false);
  const [isValidatingSlug, setIsValidatingSlug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertMarkdown = (syntaxBefore: string, syntaxAfter: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const replacement = syntaxBefore + selectedText + syntaxAfter;
    const newValue = text.substring(0, start) + replacement + text.substring(end);

    setFormData(prev => ({ ...prev, content: newValue }));

    // Colocar foco e selecionar o termo
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + selectedText.length
      );
    }, 0);
  };

  const [formData, setFormData] = useState<Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>>({
    platform: 'article',
    title: '',
    summary: '',
    url: '',
    thumbnail: '',
    publishedAt: new Date().toISOString().split('T')[0],
    isActive: true,
    isFeatured: false,
    content: '',
    author: '',
  });

  useEffect(() => {
    if (post) {
      setFormData({
        platform: post.platform,
        title: post.title,
        summary: post.summary,
        url: post.url,
        thumbnail: post.thumbnail,
        publishedAt: post.publishedAt,
        isActive: post.isActive,
        isFeatured: post.isFeatured,
        content: post.content || '',
        author: post.author || '',
      });
    }
  }, [post]);

  useEffect(() => {
    if (formData.platform !== 'article' || !formData.title.trim()) {
      setIsSlugDuplicate(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsValidatingSlug(true);
      try {
        const slugValue = slugify(formData.title);
        const exists = await checkSlugExists(slugValue, post?.id);
        setIsSlugDuplicate(exists);
      } catch (err) {
        console.error("Erro ao validar duplicidade do link:", err);
      } finally {
        setIsValidatingSlug(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.title, formData.platform, post]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 2MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const adminToken = await auth.currentUser?.getIdToken();
      const driveFormData = new FormData();
      driveFormData.append("file", file);

      const result = await uploadSocialThumbnailToDrive(driveFormData, adminToken);
      
      if (post && post.thumbnail && post.thumbnail !== result.url) {
         await deleteSocialThumbnailFromDrive(post.thumbnail, adminToken);
      }

      setFormData(prev => ({ ...prev, thumbnail: result.url }));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro no upload para o Google Drive."));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.platform === 'article' && isSlugDuplicate) {
      setError("Não é possível salvar. Já existe uma publicação com este título ou link amigável.");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const adminToken = await auth.currentUser?.getIdToken();

      if (post) {
        await updateSocialPost(post.id, formData, adminToken);
      } else {
        await createSocialPost(formData, adminToken);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao salvar postagem."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={post ? "Editar Postagem" : "Nova Postagem Social"}
      subtitle="Gestão estratégica de conteúdo via Google Drive."
      maxWidth={formData.platform === 'article' ? "max-w-6xl" : "max-w-2xl"}
    >
        <form onSubmit={handleSubmit} className="p-2 space-y-8 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">Formato / Rede Social</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const newUrl = p.id === 'article' ? 'https://bplen.com/conteudo' : formData.url;
                      setFormData({ ...formData, platform: p.id, url: newUrl });
                    }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-[9px] font-bold uppercase tracking-tighter transition-all ${
                      formData.platform === p.id 
                      ? "bg-[var(--accent-start)]/10 border-[var(--accent-start)] text-[var(--accent-start)]" 
                      : "bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--accent-start)]/30"
                    }`}
                  >
                    <p.icon size={14} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">Data da Publicação</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
                <input
                  type="date"
                  required
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 bg-[var(--accent-soft)]/20 border border-[var(--border-primary)] rounded-[2.5rem] shadow-sm">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1 flex items-center gap-2">
              <HardDrive size={14} className="text-[var(--accent-start)]" /> Armazenamento em Nuvem (Drive)
            </label>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-36 h-36 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-primary)] overflow-hidden flex items-center justify-center shrink-0 group relative shadow-md">
                {formData.thumbnail ? (
                  <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <ImageIcon size={24} className="text-[var(--text-muted)] opacity-20" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-[var(--bg-primary)]/40 backdrop-blur-md flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="text-[var(--accent-start)] animate-spin" />
                    <span className="text-[8px] font-bold text-[var(--accent-start)] uppercase tracking-tighter">Sincronizando...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-2px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-black/10"
                >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Fazer Upload p/ Drive (Máx 2MB)
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*"
                />
                
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="URL automática do Drive carregará aqui..."
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-6 py-4 text-[10px] font-bold text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all placeholder:opacity-30"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">Título da Postagem</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Como o DISC transforma lideranças..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full bg-[var(--input-bg)] border rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all shadow-sm ${
                    isSlugDuplicate ? "border-red-500/50 focus:border-red-500" : "border-[var(--border-primary)]"
                  }`}
                />
              </div>
              <AnimatePresence>
                {formData.platform === 'article' && isSlugDuplicate && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-500 text-[9px] font-bold uppercase tracking-widest leading-normal"
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Aviso: Já existe uma publicação com este título ou link amigável. Por favor, ajuste o título para evitar duplicidade de links.</span>
                  </motion.div>
                )}
                {formData.platform === 'article' && isValidatingSlug && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[8px] font-bold text-[var(--accent-start)] uppercase tracking-widest ml-1 flex items-center gap-1.5"
                  >
                    <Loader2 size={10} className="animate-spin" />
                    Validando link amigável...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">Resumo / Legenda</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-[var(--text-muted)] opacity-40" />
                <textarea
                  required
                  rows={2}
                  placeholder="Inspiração, insight ou convite à leitura..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all resize-none shadow-sm"
                />
              </div>
            </div>

            {formData.platform === 'article' && (
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">Autor do Artigo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sandra Lencina"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">
                {formData.platform === 'article' ? "Link de Referência (Opcional)" : "Link do Post Original"}
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
                <input
                  type="url"
                  required={formData.platform !== 'article'}
                  placeholder="https://www.linkedin.com/posts/..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all shadow-sm"
                />
              </div>
            </div>

            {formData.platform === 'article' && (
              <div className="space-y-4 pt-4">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 ml-1">Conteúdo do Artigo (Markdown)</label>
                
                {/* Barra de Ferramentas de Formatação (Sem Emojis) */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl shadow-sm">
                  {[
                    { icon: Bold, label: "Negrito", syntaxBefore: "**", syntaxAfter: "**" },
                    { icon: Italic, label: "Itálico", syntaxBefore: "*", syntaxAfter: "*" },
                    { icon: Heading1, label: "Título", syntaxBefore: "# ", syntaxAfter: "" },
                    { icon: Quote, label: "Citação", syntaxBefore: "> ", syntaxAfter: "" },
                    { icon: Code, label: "Código", syntaxBefore: "`", syntaxAfter: "`" },
                    { icon: List, label: "Lista", syntaxBefore: "- ", syntaxAfter: "" },
                    { icon: ListOrdered, label: "Lista Numerada", syntaxBefore: "1. ", syntaxAfter: "" },
                    { icon: LinkIcon, label: "Link", syntaxBefore: "[", syntaxAfter: "](url)" },
                    { icon: ImageIcon, label: "Imagem", syntaxBefore: "![legenda](", syntaxAfter: ")" },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertMarkdown(item.syntaxBefore, item.syntaxAfter)}
                      title={item.label}
                      className="p-2.5 rounded-xl hover:bg-[var(--accent-start)]/10 hover:text-[var(--accent-start)] text-[var(--text-muted)] transition-all active:scale-95"
                    >
                      <item.icon size={15} />
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Editor */}
                  <textarea
                    ref={textareaRef}
                    required
                    rows={15}
                    placeholder="Escreva seu artigo aqui usando formatação Markdown. Use os botões da barra de ferramentas acima para formatar seu texto..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full h-[400px] bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all resize-none shadow-sm custom-scrollbar"
                  />

                  {/* Live Preview */}
                  <div className="h-[400px] overflow-y-auto bg-white/50 border border-[var(--border-primary)] rounded-2xl p-6 shadow-inner custom-scrollbar">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-4 border-b pb-2 border-black/5">Preview (Live)</h3>
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {formData.content || "*Preview do artigo aparecerá aqui...*"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6 border-t border-[var(--border-primary)]">
             <button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex-1 flex items-center justify-center gap-3 py-4.5 bg-gradient-to-tr from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent-start)]/20 hover:translate-y-[-2px] active:scale-[0.98] transition-all disabled:opacity-50"
             >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Salvando..." : "Salvar no BPlen HUB"}
             </button>
          </div>
        </form>
    </GlassModal>
  );
}
