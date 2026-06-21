"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Save, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon, 
  Type 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { QRCodeCanvas } from "qrcode.react";
import { createQRCodeAction } from "@/actions/qrcode";

interface QRCodeFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function QRCodeForm({ onSuccess, onClose }: QRCodeFormProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  // Limpar erro ao digitar
  useEffect(() => {
    if (title || link) {
      setError(null);
    }
  }, [title, link]);

  // Comando de Download Local do QR Code
  const handleDownload = () => {
    if (!title || !link) {
      setError("Preencha o titulo e o link para gerar o QR Code.");
      return;
    }

    const canvas = document.getElementById("bplen-qrcode-canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      setError("Erro ao localizar a imagem do QR Code para download.");
      return;
    }

    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      // Nome do arquivo padronizado sem caracteres especiais
      const cleanName = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      a.download = `qr_code_${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Falha ao baixar QR Code:", err);
      setError("Erro ao gerar o arquivo para download.");
    }
  };

  // Comando de Salvamento no Firestore e Google Drive
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !link.trim()) {
      setError("Todos os campos sao obrigatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const canvas = document.getElementById("bplen-qrcode-canvas") as HTMLCanvasElement | null;
      if (!canvas) {
        throw new Error("Erro de renderizacao do QR Code.");
      }

      // 1. Obter o Token de Administrador do Firebase
      const adminToken = await auth.currentUser?.getIdToken();
      if (!adminToken) {
        throw new Error("Sessao administrativa expirada. Faca login novamente.");
      }

      // 2. Converter o Canvas do QR Code em um Blob de imagem binaria
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Falha ao processar a imagem do QR Code.");
          setLoading(false);
          return;
        }

        try {
          // 3. Empacotar no FormData para transporte seguro do binario
          const formData = new FormData();
          formData.append("file", blob, "qrcode.png");
          formData.append("title", title.trim());
          formData.append("link", link.trim());

          // 4. Executar Server Action de Criacao e Sincronia
          const response = await createQRCodeAction(formData, adminToken);

          if (!response.success) {
            throw new Error(response.error);
          }

          setSuccess(true);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } catch (actionErr: any) {
          setError(actionErr.message || "Falha ao registrar QR Code.");
          setLoading(false);
        }
      }, "image/png");

    } catch (err: any) {
      console.error("Erro no fluxo de salvamento:", err);
      setError(err.message || "Erro inesperado ao salvar.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Lado Esquerdo: Formulario de Cadastro */}
      <form onSubmit={handleSave} className="flex-1 space-y-6">
        <div className="space-y-4">
          {/* Input Título */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <Type size={12} />
              Titulo do QR Code
            </label>
            <input
              type="text"
              required
              disabled={loading || success}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Folder Promocional BPlen 2026"
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm focus:outline-none focus:border-[var(--accent-start)]/50 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Input Link */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <LinkIcon size={12} />
              Link de Destino (URL)
            </label>
            <input
              type="url"
              required
              disabled={loading || success}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Ex: https://bplen.com/promocao"
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm focus:outline-none focus:border-[var(--accent-start)]/50 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Notificacoes de Retorno */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
            >
              <AlertCircle size={16} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <p>QR Code gerado e salvo no sistema com sucesso!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botoes de Acao */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-[var(--border-primary)]/50">
          <button
            type="button"
            disabled={loading || success}
            onClick={onClose}
            className="w-full sm:w-auto px-5 h-11 rounded-xl border border-[var(--border-primary)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg-primary)] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={loading || success || !title || !link}
            onClick={handleDownload}
            className="w-full sm:w-auto px-5 h-11 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent-start)]/40 hover:text-[var(--accent-start)] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
          >
            <Download size={14} />
            Baixar PNG
          </button>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full sm:flex-1 px-6 h-11 rounded-xl bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] hover:opacity-90 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(102,126,234,0.15)] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Salvando no Drive...
              </>
            ) : (
              <>
                <Save size={14} />
                Registrar no Sistema
              </>
            )}
          </button>
        </div>
      </form>

      {/* Lado Direito: Preview do QR Code Branded (Estilo BPlen Rounded) */}
      <div className="w-full lg:w-80 flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--bg-primary)] border border-[var(--border-primary)]/40 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--accent-start)] rounded-full blur-[80px] opacity-10 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[var(--accent-end)] rounded-full blur-[80px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--accent-start)] mb-5">Visualizacao Premium</p>
          
          {/* Card Glass do QR Code com cantos ultra-arredondados */}
          <div 
            ref={qrRef}
            className="bg-white p-5 rounded-[2.5rem] shadow-2xl border border-white/20 transition-all duration-300 transform hover:scale-102 flex items-center justify-center"
          >
            {link ? (
              <QRCodeCanvas
                id="bplen-qrcode-canvas"
                value={link}
                size={200}
                level="H" // Erro Correction Alto para suportar o logo centralizado
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#1d1d1f" // Cinza escuro premium (Apple style)
                imageSettings={{
                  src: "/logo_bplen/favicon.png", // Logo Symbol PNG do BPlen (1:1)
                  x: undefined,
                  y: undefined,
                  height: 42,
                  width: 42,
                  excavate: true, // Libera espaco do QR por tras do logo
                }}
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-neutral-100 rounded-3xl flex flex-col items-center justify-center border border-dashed border-neutral-300">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Aguardando Link</p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-1">
            <h4 className="text-xs font-bold text-[var(--text-primary)] max-w-[240px] truncate uppercase tracking-wider">
              {title || "Sem Titulo"}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] max-w-[240px] truncate tracking-wide">
              {link || "Insira uma URL de destino..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
