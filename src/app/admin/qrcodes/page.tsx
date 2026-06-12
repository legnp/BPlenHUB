"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  Download, 
  Loader2, 
  Calendar as CalendarIcon,
  QrCode,
  Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BPlenQRCode } from "@/types/qrcode";
import { getQRCodesAction, deleteQRCodeAction } from "@/actions/qrcode";
import GlassModal from "@/components/ui/GlassModal";
import QRCodeForm from "@/components/admin/QRCodeForm";
import { auth } from "@/lib/firebase";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodesManagementPage() {
  const [qrcodes, setQrcodes] = useState<BPlenQRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Carregar lista de QR Codes
  const fetchQRCodes = async () => {
    setIsLoading(true);
    try {
      const adminToken = await auth.currentUser?.getIdToken();
      if (!adminToken) {
        console.warn("Sessao administrativa ausente.");
        setIsLoading(false);
        return;
      }

      const res = await getQRCodesAction(adminToken);
      if (res.success && res.qrcodes) {
        setQrcodes(res.qrcodes);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Falha ao recuperar QR Codes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Escuta estado de autenticacao para garantir que o token esteja disponivel
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchQRCodes();
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filtragem dinamica
  const filteredQRCodes = useMemo(() => {
    return qrcodes.filter((qr) => {
      return (
        qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.link.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [qrcodes, searchTerm]);

  // Comando de exclusao
  const handleDelete = async (qr: BPlenQRCode) => {
    if (!qr.id) return;
    
    if (confirm("Tem certeza que deseja excluir este QR Code e remove-lo do Google Drive de forma permanente?")) {
      try {
        const adminToken = await auth.currentUser?.getIdToken();
        if (!adminToken) {
          alert("Sessao expirada. Faca login novamente.");
          return;
        }

        const res = await deleteQRCodeAction(qr.id, qr.driveFileId, adminToken);
        if (res.success) {
          fetchQRCodes();
        } else {
          alert(res.error || "Erro ao remover QR Code.");
        }
      } catch (err: any) {
        alert(err.message || "Falha na exclusao.");
      }
    }
  };

  // Comando de Download Local a partir de um Card
  const handleDownloadCard = (qr: BPlenQRCode) => {
    const canvas = document.getElementById(`canvas-qr-${qr.id}`) as HTMLCanvasElement | null;
    if (!canvas) {
      alert("Erro ao localizar o canvas do QR Code.");
      return;
    }

    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      const cleanName = qr.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      a.download = `qr_code_${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Falha ao baixar imagem:", err);
      alert("Nao foi possivel baixar o QR Code.");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header da Pagina */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] uppercase">
            MAQUINA DE <span className="text-[var(--accent-start)] italic">QR CODES</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium opacity-70">
            Geracao de QR Codes com branding BPlen e sincronizacao direta com o Google Drive corporativo.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent-start)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Criar Novo QR
        </button>
      </div>

      {/* Grid de Metricas Rapidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-start)]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
              <QrCode size={18} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Total de QR Codes</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)]">
            {isLoading ? <Loader2 size={24} className="animate-spin text-[var(--accent-start)]" /> : qrcodes.length}
          </div>
        </div>

        <div className="p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
              <ExternalLink size={18} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Sincronizados no Drive</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)]">
            {isLoading ? <Loader2 size={24} className="animate-spin text-green-500" /> : qrcodes.filter(q => q.driveFileId).length}
          </div>
        </div>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex items-center gap-4 p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] sticky top-4 z-10 shadow-2xl backdrop-blur-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
          <input
            type="text"
            placeholder="Buscar por titulo ou link de destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
          />
        </div>
      </div>

      {/* Grid List de QR Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 bg-[var(--input-bg)] animate-pulse rounded-[2.5rem] border border-[var(--border-primary)]" />
          ))
        ) : filteredQRCodes.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] bg-[var(--input-bg)]/50">
            <QrCode className="w-16 h-16 text-[var(--text-muted)] opacity-10 mx-auto mb-6" />
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Nenhum QR Code encontrado</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 opacity-70">Crie seu primeiro QR Code corporativo clicando no botao acima.</p>
          </div>
        ) : (
          filteredQRCodes.map((qr) => (
            <motion.div
              key={qr.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-[var(--input-bg)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm hover:border-[var(--accent-start)]/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Visualizador de QR Code do Card */}
                <div className="bg-white p-4 rounded-3xl border border-neutral-100 flex justify-center items-center h-44 w-full relative group shadow-sm">
                  <QRCodeCanvas
                    id={`canvas-qr-${qr.id}`}
                    value={qr.link}
                    size={140}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#1d1d1f"
                    imageSettings={{
                      src: "/logo_bplen/favicon.svg", // Logo Symbol SVG do BPlen (1:1)
                      x: undefined,
                      y: undefined,
                      height: 30,
                      width: 30,
                      excavate: true,
                    }}
                  />
                </div>

                {/* Info Text */}
                <div className="space-y-1.5 px-1">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
                    {qr.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                    <LinkIcon size={12} className="shrink-0 opacity-60" />
                    <a 
                      href={qr.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="truncate hover:text-[var(--accent-start)] transition-colors font-medium"
                    >
                      {qr.link}
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] opacity-60 font-bold uppercase tracking-wider">
                    <CalendarIcon size={11} className="shrink-0" />
                    <span>{new Date(qr.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Botoes de Acao do Card */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[var(--border-primary)]/40">
                <button
                  onClick={() => handleDownloadCard(qr)}
                  className="h-10 rounded-xl bg-[var(--bg-primary)] hover:border-[var(--accent-start)]/40 hover:text-[var(--accent-start)] border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Baixar imagem PNG"
                >
                  <Download size={13} />
                  PNG
                </button>

                <a
                  href={qr.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 rounded-xl bg-[var(--bg-primary)] hover:border-green-500/40 hover:text-green-500 border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  title="Visualizar arquivo salvo no Google Drive"
                >
                  <ExternalLink size={13} />
                  Drive
                </a>

                <button
                  onClick={() => handleDelete(qr)}
                  className="h-10 rounded-xl bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20 text-red-400 border border-transparent text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Excluir QR Code"
                >
                  <Trash2 size={13} />
                  Excluir
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Glassmorphic de Criacao */}
      <GlassModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Novo QR Code"
        maxWidth="max-w-4xl"
      >
        <QRCodeForm 
          onSuccess={fetchQRCodes} 
          onClose={() => setIsFormOpen(false)} 
        />
      </GlassModal>
    </div>
  );
}
