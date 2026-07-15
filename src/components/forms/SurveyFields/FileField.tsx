"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Check, AlertCircle, Loader2, Eye } from "lucide-react";

import { uploadToUserDrive } from "@/actions/upload-to-drive";
import { getAuth } from "firebase/auth";
import { getErrorMessage } from "@/lib/utils/errors";

/** Extrai o fileId de uma URL do Google Drive (para o proxy /api/docs). */
function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  return (
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
    null
  );
}

interface FileFieldProps {
  id: string;
  label?: string;
  type?: "CV" | "Portfolio";
  matricula: string;
  value: { url: string; fileName: string } | null;
  onChange: (value: { url: string; fileName: string } | null) => void;
  maxSizeMB: number;
}

/**
 * FileField (BPlen HUB Premium Upload 📂)
 * Componente de upload imediato que sincroniza arquivos diretamente com o Google Drive.
 * Substitui o Firebase Storage por uma arquitetura de bypass server-side.
 */
export function FileField({ id, label, type = "CV", matricula, value, onChange, maxSizeMB }: FileFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validação Rápida no Cliente 🛡️
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo excede o limite de ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado.");
        
        // Obtermos o Token para o Server-Side validar a permissão
        const idToken = await user.getIdToken();
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("matricula", matricula);
        formData.append("idToken", idToken);
        formData.append("type", type);

        // Chamada da Server Action (Bypass para o Google Drive)
        const res = await uploadToUserDrive(formData);

        if (res.success && res.url) {
            onChange({ url: res.url, fileName: file.name });
            console.log(`✅ Upload finalizado: ${file.name}`);
        } else {
            setError(res.error || "Erro desconhecido no servidor.");
        }
    } catch (err: unknown) {
        console.error("❌ Erro no FileField:", err);
        setError(getErrorMessage(err, "Erro ao processar o upload."));
    } finally {
        setUploading(false);
    }
  };

  // Abre o documento já enviado no navegador (via proxy autenticado), para o
  // usuário conferir qual arquivo está anexado — antes só havia a confirmação.
  const handleView = async () => {
    if (!value?.url) return;
    const fileId = extractDriveFileId(value.url);
    const currentUser = getAuth().currentUser;
    if (fileId && currentUser) {
      try {
        const token = await currentUser.getIdToken();
        window.open(`/api/docs/${fileId}?token=${token}`, "_blank");
        return;
      } catch {
        // cai no fallback abaixo
      }
    }
    window.open(value.url, "_blank");
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 px-1">
        {label || (type === "CV" ? "Currículo / Resumo Profissional" : "Apresentação de Portfólio")}
      </label>

      <div className="relative group overflow-hidden">
        <input
          type="file"
          id={id}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleFile}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.jpg,.png,.webp"
        />
        
        <div className={`
          p-6 border-[1px] border-dashed rounded-[2rem] transition-all duration-500 flex flex-col items-center justify-center gap-3
          ${uploading 
            ? "bg-white/5 border-[var(--accent-start)]/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
            : "bg-white/5 border-white/10 hover:border-[var(--accent-start)]/40 hover:bg-white/10"}
          ${value ? "border-green-500/40 bg-green-500/5 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : ""}
          ${error ? "border-red-500/40 bg-red-500/5 text-red-500" : ""}
        `}>

          
          <div className="relative">
             {uploading ? (
               <Loader2 className="animate-spin text-[var(--accent-start)]" size={24} />
             ) : value ? (
               <Check size={24} />
             ) : error ? (
               <AlertCircle size={24} />
             ) : (
               <Upload size={24} className="opacity-30 transition-transform group-hover:scale-110" />
             )}
          </div>


          <div className="text-center space-y-1">
            <p className="text-sm font-bold tracking-tight">
              {uploading ? "Fazendo upload..." : 
               value ? value.fileName : 
               error ? "Erro no envio" :
               "Fazer upload"}
            </p>
            
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40">
                {value ? "Arquivo Anexado" : `Limite de ${maxSizeMB}MB (PDF, DOC ou Imagem)`}
            </p>
          </div>
        </div>
      </div>

      {value?.url && (
        <button
          type="button"
          onClick={handleView}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/30 transition-all"
        >
          <Eye size={12} /> Ver documento anexado
        </button>
      )}

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[9px] font-bold text-red-400 uppercase tracking-widest pl-4 italic"
        >
          ⚠️ {error}
        </motion.p>
      )}
    </div>
  );
}
