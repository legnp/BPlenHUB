"use client";

import React, { useState } from "react";
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  Info,
  User,
  Mail,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitThemeSuggestion } from "@/actions/feedback";
import { getErrorMessage } from "@/lib/utils/errors";

interface ThemeSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid?: string | null;
  matricula?: string | null;
}

const CHANNELS = [
  "Instagram",
  "LinkedIn",
  "BPlen Hub",
  "TikTok",
  "WhatsApp",
  "Receber por e-mail"
];

export function ThemeSuggestionModal({ isOpen, onClose, uid, matricula }: ThemeSuggestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    suggestion: "",
    justification: "",
    channels: [] as string[],
    contact: {
      name: "",
      email: "",
      phone: ""
    }
  });

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.channels.length === 0) {
      setError("Por favor, selecione ao menos um canal de preferência.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitThemeSuggestion({
        ...formData,
        uid,
        matricula
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--input-bg)]/50 shrink-0">
              <div className="space-y-1 text-left">
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  Sugerir Temas
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                  Qual próximo tema você quer ver na BPlen?
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent-start)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar text-left">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 flex flex-col items-center justify-center text-center gap-6"
                >
                  <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-green-500 uppercase">Sugestão Enviada!</h3>
                    <p className="max-w-xs mx-auto text-gray-500 text-sm">Obrigado por nos ajudar a construir um ecossistema mais relevante.</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="mt-4 px-10 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    Fechar Modal
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                      <AlertCircle size={14} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Sugestão & Justificativa */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                        <Sparkles size={12} className="text-[var(--accent-start)]" /> Ideia ou Tema
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Ex: Inteligência Emocional em Tempos de IA..."
                        value={formData.suggestion}
                        onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all placeholder:opacity-30 resize-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                        <Info size={12} className="text-[var(--accent-start)]" /> Por que isso é importante?
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Como esse tema ajudaria você hoje?"
                        value={formData.justification}
                        onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all placeholder:opacity-30 resize-none shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Canais de Preferência */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Onde você gostaria de ver esse conteúdo?</label>
                    <div className="flex flex-wrap gap-2">
                      {CHANNELS.map((channel) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => toggleChannel(channel)}
                          className={`px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            formData.channels.includes(channel)
                            ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white shadow-lg"
                            : "bg-white border-[var(--border-primary)] text-gray-400 hover:border-[var(--accent-start)]/30 hover:text-black"
                          }`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dados Opcionais */}
                  {!uid && (
                    <div className="space-y-4 p-6 bg-[var(--input-bg)] rounded-[2.5rem] border border-[var(--border-primary)]">
                       <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 opacity-70">Dados de Contato (Opcional)</p>
                       <div className="space-y-4">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Nome Completo"
                              value={formData.contact.name}
                              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, name: e.target.value } })}
                              className="w-full bg-white border border-[var(--border-primary)] rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                placeholder="E-mail"
                                value={formData.contact.email}
                                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                                className="w-full bg-white border border-[var(--border-primary)] rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                placeholder="WhatsApp (DDD)"
                                value={formData.contact.phone}
                                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                                className="w-full bg-white border border-[var(--border-primary)] rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
                              />
                            </div>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent-start)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {isSubmitting ? "Enviando sugestão..." : "Enviar para Time BPlen"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[var(--border-primary)] bg-[var(--input-bg)]/50 shrink-0 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">© BPlen co-creation</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
