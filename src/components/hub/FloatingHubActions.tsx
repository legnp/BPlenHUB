"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Send, ImagePlus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { submitSupportTicket } from "@/actions/support-ticket";
import { usePathname } from "next/navigation";

/**
 * FloatingHubActions — Botões Flutuantes do HUB (Bottom Right) 🆘📱
 * 
 * 1. Botão de Bug Report / Suporte → Modal com textarea + upload de imagem
 * 2. Botão do WhatsApp → Redireciona para conversa
 * 
 * Fica fixo na tela durante todo o Hub, permanecendo no lugar ao scrollar.
 */

const WHATSAPP_URL = "https://wa.me/5511945152088?text=Ol%C3%A1!%20Preciso%20de%20suporte%20do%20BPlen%20HUB.";
const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

type TicketState = "idle" | "sending" | "success" | "error";

export function FloatingHubActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [ticketState, setTicketState] = useState<TicketState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMsg(`A imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Apenas imagens são permitidas (PNG, JPG, GIF, etc.).");
      return;
    }

    setErrorMsg("");
    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          setErrorMsg(`A imagem colada deve ter no máximo ${MAX_IMAGE_SIZE_MB}MB.`);
          return;
        }

        setImageName(`screenshot_${Date.now()}.png`);
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(async () => {
    if (description.trim().length < 10) {
      setErrorMsg("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }

    setTicketState("sending");
    setErrorMsg("");

    try {
      const result = await submitSupportTicket({
        description,
        imageBase64: imagePreview,
        imageName,
        currentPage: pathname,
      });

      if (result.success) {
        setTicketState("success");
        // Reset após 2.5s
        setTimeout(() => {
          setDescription("");
          setImagePreview(null);
          setImageName(null);
          setTicketState("idle");
          setIsModalOpen(false);
        }, 2500);
      } else {
        setErrorMsg(result.error || "Erro desconhecido.");
        setTicketState("error");
      }
    } catch {
      setErrorMsg("Falha ao enviar. Tente novamente.");
      setTicketState("error");
    }
  }, [description, imagePreview, imageName, pathname]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setTicketState("idle");
    setErrorMsg("");
  }, []);

  const closeModal = useCallback(() => {
    if (ticketState === "sending") return;
    setIsModalOpen(false);
    setErrorMsg("");
  }, [ticketState]);

  return (
    <>
      {/* ═══════════════════════════════════════════════ */}
      {/* BOTÕES FLUTUANTES (Bottom-Right, Fixed)         */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="fixed bottom-8 right-8 z-[190] flex flex-col items-center gap-3">
        
        {/* Botão 1: Bug Report / Suporte */}
        <motion.button
          id="hub-support-btn"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5, type: "spring" }}
          onClick={openModal}
          className="group relative w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-xl flex items-center justify-center text-[var(--accent-start)] shadow-lg hover:shadow-xl hover:shadow-[var(--accent-start)]/10 hover:border-[var(--accent-start)]/40 hover:scale-105 active:scale-95 transition-all"
          title="Reportar Bug / Suporte"
        >
          <AlertCircle size={20} strokeWidth={2.5} className="group-hover:animate-pulse" />
          
          {/* Tooltip */}
          <span className="absolute right-full mr-3 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-secondary)] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Reportar Bug
          </span>
        </motion.button>

        {/* Botão 2: WhatsApp */}
        <motion.a
          id="hub-whatsapp-btn"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.5, type: "spring" }}
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 backdrop-blur-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-[#25D366]/20 hover:bg-[#25D366]/25 hover:border-[#25D366]/60 hover:scale-105 active:scale-95 transition-all"
          title="Falar pelo WhatsApp"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
          
          {/* Tooltip */}
          <span className="absolute right-full mr-3 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-secondary)] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            WhatsApp
          </span>
        </motion.a>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE BUG REPORT / SUPORTE                   */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-[301] bottom-8 right-8 w-[90vw] max-w-[420px] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl shadow-[0_4px_16px_0_rgba(31,38,135,0.08)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                    <AlertCircle size={16} className="text-[var(--accent-start)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Reportar Problema</h3>
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Suporte BPlen HUB</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={ticketState === "sending"}
                  className="p-2 rounded-xl hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all disabled:opacity-30"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Success State */}
              <AnimatePresence mode="wait">
                {ticketState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-8 flex flex-col items-center justify-center text-center gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 200 }}
                    >
                      <CheckCircle2 size={48} className="text-emerald-500" />
                    </motion.div>
                    <h4 className="text-base font-bold text-[var(--text-primary)]">Recebemos seu relato!</h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Nossa equipe vai analisar e retornar assim que possível. Obrigado pelo feedback! 🙏
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 space-y-4"
                  >
                    {/* Descrição */}
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2">
                        Descreva o problema
                      </label>
                      <textarea
                        id="support-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="O que aconteceu? Em qual página? O que você esperava que acontecesse? Quanto mais detalhes, melhor. Você também pode colar um print diretamente aqui (Ctrl+V)."
                        rows={5}
                        maxLength={2000}
                        disabled={ticketState === "sending"}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-start)]/50 focus:ring-1 focus:ring-[var(--accent-start)]/20 transition-all resize-none disabled:opacity-50"
                      />
                      <p className="text-[9px] text-[var(--text-muted)] mt-1 text-right">
                        {description.length}/2000
                      </p>
                    </div>

                    {/* Upload / Preview de Imagem */}
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2">
                        Captura de tela <span className="font-normal opacity-60">(opcional)</span>
                      </label>

                      {imagePreview ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-[var(--border-primary)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-40 object-cover"
                          />
                          <button
                            onClick={removeImage}
                            disabled={ticketState === "sending"}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-xl hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          {imageName && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[9px] text-white/80 truncate">
                              {imageName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={ticketState === "sending"}
                          className="w-full py-4 border-2 border-dashed border-[var(--border-primary)] rounded-2xl flex flex-col items-center gap-2 text-[var(--text-muted)] hover:border-[var(--accent-start)]/40 hover:text-[var(--accent-start)] hover:bg-[var(--accent-soft)]/50 transition-all disabled:opacity-50"
                        >
                          <ImagePlus size={20} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Enviar imagem ou colar print
                          </span>
                        </button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Erro */}
                    {errorMsg && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                      >
                        {errorMsg}
                      </motion.p>
                    )}

                    {/* Botão Enviar */}
                    <button
                      id="support-submit-btn"
                      onClick={handleSubmit}
                      disabled={ticketState === "sending" || description.trim().length < 10}
                      className="w-full py-3.5 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-start)]/20 hover:shadow-xl hover:shadow-[var(--accent-start)]/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ticketState === "sending" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Enviar Relato
                        </>
                      )}
                    </button>

                    <p className="text-[8px] text-[var(--text-muted)] text-center opacity-60">
                      Seu relato será recebido pela equipe técnica da BPlen.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
