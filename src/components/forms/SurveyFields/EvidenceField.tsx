"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Check, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadToUserDrive } from "@/actions/upload-to-drive";
import { getAuth } from "firebase/auth";
import { getErrorMessage } from "@/lib/utils/errors";

interface EvidenceFieldProps {
  id: string;
  label?: string;
  matricula: string;
  value: { url: string; fileName: string } | null;
  onChange: (value: { url: string; fileName: string } | null) => void;
  maxSizeMB?: number;
}

/**
 * EvidenceField (BPlen HUB Premium Upload 📂)
 * Componente focado em recebimento rápido de prints (Evidências de Conclusão).
 * Suporta Drag & Drop, Input File Tradicional e Clipboard Paste (Ctrl+V).
 */
export function EvidenceField({ id, label, matricula, value, onChange, maxSizeMB = 5 }: EvidenceFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const processFile = async (file: File) => {
    // Validação Rápida no Cliente
    if (!file.type.startsWith("image/")) {
      setError("Por favor, envie apenas arquivos de imagem (PNG, JPG, WEBP).");
      return;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo excede o limite permitido para arquivos de ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");
      
      const idToken = await user.getIdToken();
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("matricula", matricula);
      formData.append("idToken", idToken);
      formData.append("type", "EVIDENCIA");

      const res = await uploadToUserDrive(formData);

      if (res.success && res.url) {
          onChange({ url: res.url, fileName: file.name });
      } else {
          setError(res.error || "Erro desconhecido no servidor.");
      }
    } catch (err: unknown) {
        console.error("❌ Erro no EvidenceField:", err);
        setError(getErrorMessage(err, "Erro ao processar o upload."));
    } finally {
        setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let imageFound = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          imageFound = true;
          processFile(file);
          break;
        }
      }
    }

    if (!imageFound) {
      setError("Não foi possível identificar uma imagem válida na área de transferência.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-3 w-full">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] px-1 block mb-2">
          {label}
        </label>
      )}

      <div 
        ref={containerRef}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0} // Allows focus for paste event without clicking input
        className={`
          relative group overflow-hidden outline-none transition-all duration-500
          p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 text-center cursor-pointer
          ${isDragActive ? "border-[var(--accent-start)] bg-[var(--accent-start)]/5 scale-[1.02]" : ""}
          ${uploading 
            ? "bg-white/5 border-[var(--accent-start)]/40 shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-wait" 
            : value 
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
              : error 
                ? "border-red-500/40 bg-red-500/5 text-red-500" 
                : "bg-[var(--input-bg)] border-[var(--border-primary)] hover:border-[var(--accent-start)]/40 hover:bg-white/5 focus:border-[var(--accent-start)]/60"}
        `}
      >
        <input
          type="file"
          id={id}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleFileChange}
          disabled={uploading}
          accept="image/png, image/jpeg, image/webp"
          title=""
        />
        
        <div className="relative z-10 flex flex-col items-center gap-3">
           {uploading ? (
             <div className="p-4 rounded-full bg-[var(--accent-start)]/20 text-[var(--accent-start)]">
               <Loader2 className="animate-spin" size={32} />
             </div>
           ) : value ? (
             <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-500 animate-in zoom-in">
               <Check size={32} />
             </div>
           ) : error ? (
             <div className="p-4 rounded-full bg-red-500/20 text-red-500 animate-in zoom-in">
               <AlertCircle size={32} />
             </div>
           ) : (
             <div className={`p-4 rounded-full bg-white/5 transition-transform duration-500 ${isDragActive ? "scale-110 text-[var(--accent-start)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent-start)] group-hover:scale-110 group-hover:bg-[var(--accent-start)]/10"}`}>
               <ImageIcon size={32} strokeWidth={1.5} />
             </div>
           )}

          <div className="space-y-1.5 pointer-events-none">
            <p className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              {uploading ? "Fazendo upload do arquivo..." : 
               value ? "Arquivo anexado com sucesso" : 
               error ? "Erro no envio" :
               isDragActive ? "Solte a imagem aqui!" :
               "Arraste, clique para selecionar ou cole o print diretamente aqui"}
            </p>
            
            <p className={`text-[10px] font-medium tracking-wide ${value ? "text-emerald-500/80" : "text-[var(--text-muted)]"}`}>
                {uploading ? "Aguarde um momento" :
                 value ? "O botão de conclusão foi liberado para clique" : 
                 "Suporta arquivo ou colar print (Ctrl+V). Formatos: PNG, JPG, WEBP"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-black text-red-400 uppercase tracking-widest pl-4 flex items-center gap-2"
        >
          <AlertCircle size={12} />
          {error}
        </motion.p>
      )}
    </div>
  );
}
