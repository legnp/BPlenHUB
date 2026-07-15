"use client";

import React from "react";
import {
  Instagram,
  Linkedin,
  Globe,
  MessageCircle,
  FileText,
  Briefcase,
  Star,
  Phone
} from "lucide-react";
import { NetworkingMember } from "@/actions/networking";
import { PartnerData } from "@/actions/admin/partners";
import { useAuthContext } from "@/context/AuthContext";

interface Props {
  type: "member" | "partner";
  data: NetworkingMember | PartnerData;
}

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

/**
 * BPlen HUB — NetworkingCard 🌟💎
 * Interaction Card para Membros e Parceiros.
 */
export function NetworkingCard({ type, data }: Props) {
  const { user } = useAuthContext();
  const isMember = type === "member";
  const member = data as NetworkingMember;
  const partner = data as PartnerData;

  // Abre um documento compartilhado (CV/portfólio) via proxy autenticado, usando
  // o token do próprio visitante — o dono liberou a visibilidade (BUG-071).
  const openSharedDoc = async (fileUrl: string) => {
    if (!user) { window.open(fileUrl, "_blank"); return; }
    const fileId = extractDriveFileId(fileUrl);
    if (!fileId) { window.open(fileUrl, "_blank"); return; }
    try {
      const token = await user.getIdToken();
      window.open(`/api/docs/${fileId}?token=${token}`, "_blank");
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  const name = isMember ? member.name : partner.name;
  const photo = isMember ? member.photoUrl : partner.photoUrl;
  const pitch = isMember ? member.pitch : partner.description;
  const tags = (isMember ? member.hashtags : partner.keywords) || [];
  const serviceType = isMember ? null : partner.serviceType;

  return (
    <div className="group relative p-6 bg-[var(--glass-bg)] border border-[var(--border-primary)] rounded-[3rem] glass hover:bg-[var(--input-bg)] hover:border-[var(--accent-start)]/30 transition-all duration-500 overflow-hidden">
      
      {/* 🔮 Efeito de Brilho Hover */}
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[var(--accent-start)]/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        
        {/* 📸 Foto de Perfil */}
        <div className="relative">
          <div className="w-24 h-24 rounded-[2.5rem] bg-black/40 overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-all duration-700">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--input-bg)]">
                <Briefcase size={32} />
              </div>
            )}
          </div>
          
          {/* Badge de Profissional BPlen */}
          {isMember && member.isProfessional && (
            <div className="absolute -bottom-2 -right-2 bg-white text-black p-2 rounded-2xl shadow-lg border border-white/20 animate-in zoom-in duration-500">
               <Star size={12} fill="black" />
            </div>
          )}
        </div>

        {/* 📝 Dados Principais */}
        <div className="space-y-1">
          <h3 className="font-black text-[var(--text-primary)] tracking-tight leading-tight transition-all truncate max-w-[200px]">
            {name}
          </h3>
          {serviceType && (
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)]">
               {serviceType}
            </span>
          )}
        </div>

        {/* 💬 Sales Pitch */}
        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 italic leading-relaxed h-[36px]">
          &ldquo;{pitch || "Transformando potencial em performance no ecossistema BPlen."}&rdquo;
        </p>

        {/* #️⃣ Hashtags */}
        <div className="flex flex-wrap justify-center gap-2 h-[20px] overflow-hidden">
           {tags.slice(0, 3).map((tag, i) => (
             <span key={i} className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                #{tag.replace("#", "")}
             </span>
           ))}
        </div>

        {/* 🔗 Interaction Bar */}
        <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-center gap-3 w-full">
           {/* WhatsApp/Contact */}
           {isMember && member.contacts?.whatsapp?.visible && (
             <a href={`https://wa.me/${member.contacts.whatsapp.value}`} target="_blank" className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all">
                <MessageCircle size={14} />
             </a>
           )}

           {/* Telefone */}
           {isMember && member.contacts?.phone?.visible && (
             <a href={`tel:${member.contacts.phone.value}`} className="p-3 bg-[var(--social-bg)] text-[var(--text-secondary)] rounded-2xl hover:bg-[var(--accent-soft)] transition-all">
                <Phone size={14} />
             </a>
           )}

           {/* Instagram */}
           {renderSocialLink(isMember ? (member.contacts?.instagram?.visible ? member.contacts.instagram.value : null) : partner.socials?.instagram, <Instagram size={14} />)}
           
           {/* LinkedIn */}
           {renderSocialLink(isMember ? (member.contacts?.linkedin?.visible ? member.contacts.linkedin.value : null) : partner.socials?.linkedin, <Linkedin size={14} />)}

           {/* Currículo (documento compartilhado) */}
           {isMember && member.cvVisible && member.cvUrl && (
             <button
               onClick={() => openSharedDoc(member.cvUrl!)}
               title={member.cvName || "Ver currículo"}
               className="p-3 bg-[var(--social-bg)] text-[var(--text-secondary)] rounded-2xl hover:bg-[var(--accent-soft)] hover:text-[var(--accent-start)] transition-all"
             >
                <FileText size={14} />
             </button>
           )}

           {/* Portfólio (documento compartilhado) */}
           {isMember && member.portfolioVisible && member.portfolioUrl && (
             <button
               onClick={() => openSharedDoc(member.portfolioUrl!)}
               title={member.portfolioName || "Ver portfólio"}
               className="p-3 bg-[var(--social-bg)] text-[var(--text-secondary)] rounded-2xl hover:bg-[var(--accent-soft)] hover:text-[var(--accent-start)] transition-all"
             >
                <Briefcase size={14} />
             </button>
           )}

           {!isMember && partner.socials?.site && (
             <a href={partner.socials.site} target="_blank" className="p-3 bg-[var(--social-bg)] text-[var(--text-secondary)] rounded-2xl hover:bg-[var(--accent-soft)] transition-all">
                <Globe size={14} />
             </a>
           )}
        </div>

      </div>
    </div>
  );
}

function renderSocialLink(url: string | null | undefined, icon: React.ReactNode) {
  if (!url) return null;
  const finalUrl = url.startsWith('http') ? url : `https://instagram.com/${url.replace('@', '')}`;
  return (
    <a href={finalUrl} target="_blank" className="p-3 bg-[var(--social-bg)] text-[var(--text-secondary)] rounded-2xl hover:bg-[var(--accent-soft)] hover:text-[var(--accent-start)] transition-all">
       {icon}
    </a>
  );
}
