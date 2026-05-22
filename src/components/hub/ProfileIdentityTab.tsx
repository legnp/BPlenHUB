"use client";

import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  Check, 
  Loader2, 
  RotateCcw, 
  ZoomIn, 
  Image as ImageIcon 
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { updateProfileImageAction, deleteProfileImageAction } from "@/actions/profile";
import { getCroppedImg, blobToBase64 } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

/**
 * BPlen HUB — ProfileIdentityTab 🧬📸
 * Aba de gestão de identidade com suporte a Foto de Perfil, Cropper e Iniciais.
 */
export function ProfileIdentityTab() {
  const { matricula, nickname, photoUrl } = useAuthContext();
  const [isUploading, setIsUploading] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  
  // Estados do Cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Gerar Iniciais
  const getInitials = () => {
    if (!nickname) return "BP";
    return nickname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // 2. Manipular Seleção de Arquivo
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validar tamanho (Max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // 3. Finalizar Recorte e Upload
  const handleSaveCroppedImage = useCallback(async () => {
    if (!tempImage || !croppedAreaPixels || !matricula) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels, rotation);
      if (croppedBlob) {
        const base64 = await blobToBase64(croppedBlob);
        const res = await updateProfileImageAction(matricula, base64);
        
        if (res.success) {
          setShowCropper(false);
          setTempImage(null);
        } else {
          alert("Erro ao salvar foto no Drive.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Falha no processamento da imagem.");
    } finally {
      setIsUploading(false);
    }
  }, [tempImage, croppedAreaPixels, rotation, matricula]);

  const handleDeletePhoto = async () => {
    if (!matricula || !confirm("Tem certeza que deseja remover sua foto de perfil?")) return;
    
    setIsUploading(true);
    try {
      await deleteProfileImageAction(matricula);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 📸 Card de Identidade Visual */}
      <div id="tour-profile-photo" className="p-10 border border-[var(--border-primary)] rounded-[3.5rem] bg-[var(--input-bg)]/10 glass relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ImageIcon size={120} />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          
          {/* Avatar Container */}
          <div className="relative">
            <div className={cn(
              "w-40 h-40 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-500",
              !photoUrl ? "bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)]" : "bg-black/20"
            )}>
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={nickname || "Perfil"} 
                  className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" 
                />
              ) : (
                <span className="text-5xl font-black text-white tracking-tighter">
                  {getInitials()}
                </span>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Floating Camera Trigger */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-2 right-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
              title="Mudar Foto"
            >
              <Camera size={18} />
            </button>
          </div>

          {/* Identity Text */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">
                {nickname || "Membro BPlen"}
              </h3>
              <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                Matrícula: <span className="text-[var(--text-primary)]">{matricula}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center gap-2"
              >
                <Upload size={14} />
                {photoUrl ? "Alterar Foto" : "Carregar Foto"}
              </button>
              
              {photoUrl && (
                <button 
                  onClick={handleDeletePhoto}
                  className="px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              )}
            </div>

            <p className="text-[9px] font-medium text-[var(--text-muted)] italic">
               * Recomendado: Formato 1:1 (Quadrado), máx. 2MB. WebP/PNG/JPG.
            </p>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={onFileChange} 
        />
      </div>

      {/* ✂️ Cropper Modal */}
      {showCropper && tempImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
          
          <div className="relative w-full max-w-2xl bg-[var(--input-bg)] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-auto">
            
            {/* Modal Header */}
            <div className="p-8 flex items-center justify-between border-b border-white/5 bg-white/5">
              <div className="space-y-1">
                <h4 className="text-lg font-black tracking-tight text-white">Ajuste de Identidade</h4>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-none">Redimensione e centralize sua foto</p>
              </div>
              <button onClick={() => setShowCropper(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/60">
                <X size={20} />
              </button>
            </div>

            {/* Cropper Work Area */}
            <div className="relative flex-1 bg-black/40 min-h-[350px] md:min-h-[450px]">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1 / 1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                onZoomChange={setZoom}
              />
            </div>

            {/* Controls Bar */}
            <div className="p-8 bg-black/20 space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                
                {/* Zoom Control */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-white/40 tracking-widest">
                    <span className="flex items-center gap-2"><ZoomIn size={10} /> Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Rotation Control */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-white/40 tracking-widest">
                    <span className="flex items-center gap-2"><RotateCcw size={10} /> Rotação</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    aria-labelledby="Rotation"
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setShowCropper(false)}
                  className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveCroppedImage}
                  disabled={isUploading}
                  className="px-10 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirmar Identidade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
