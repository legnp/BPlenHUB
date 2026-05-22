"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Palette,
  Check,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
  Home,
  ChevronDown,
  ScrollText
} from "lucide-react";
import { useTheme, BPlenTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BPlenLogo } from "@/components/shared/BPlenLogo";
import { BPLEN_NOMENCLATURE } from "@/config/nomenclature";
import { cn } from "@/lib/utils";

/**
 * HubHeader (Ecossistema Privado)
 * Cabeçalho compartilhado para Hub e Admin.
 * Reestruturado para Identidade Vertical Premium 💎📸
 */

interface ThemeOption {
  id: BPlenTheme;
  label: string;
  color: string;
}

const THEMES: ThemeOption[] = [
  { id: "light", label: "Modo Claro", color: "#FFFFFF" },
  { id: "dark", label: "Modo BPlen", color: "#18181B" },
  { id: "rosa-pitaya", label: "Rosa Pitaya", color: "#FF0080" },
  { id: "lavanda-azulado", label: "Lavanda Azul", color: "#6366F1" },
  { id: "amarelo-sol", label: "Amarelo Sol", color: "#F59E0B" },
  { id: "cinza-nublado", label: "Cinza Profissional", color: "#64748B" },
  { id: "daltonico", label: "Alto Contraste", color: "#FBBF24" },
];

export function HubHeader() {
  const { theme, setTheme } = useTheme();
  const { user, nickname, photoUrl, logout } = useAuthContext();
  const router = useRouter();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSocialMenuOpen, setIsSocialMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const socialMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Fechar menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (socialMenuRef.current && !socialMenuRef.current.contains(event.target as Node)) {
        setIsSocialMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Iniciais para fallback do Avatar
  const getInitials = () => {
    if (!nickname) return "BP";
    return nickname.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  // Condicional de contraste: inverter os ícones no modo "light" (pois originais são brancos)
  const iconFilterClass = theme === "light" ? "invert opacity-70" : "";

  const socialLinks = [
    { icon: <img src="/linkedin.webp" alt="LinkedIn" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, url: "https://www.linkedin.com/in/lisandralencina/", name: "LinkedIn" },
    { icon: <img src="/insta.png" alt="Instagram" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, url: "https://www.instagram.com/lis_lencina", name: "Instagram" },
    { icon: <img src="/whatsapp.png" alt="WhatsApp" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, url: "https://wa.me/5511945152088", name: "WhatsApp" },
    { icon: <img src="/tiktok.png" alt="TikTok" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, url: "https://www.tiktok.com/@lis.lencina", name: "TikTok" },
  ];

  return (
    <>
      {/* 🚀 Logo BPlen Flutuante (Esquerda) — elemento fixed independente */}
      <div className="fixed top-8 left-8 transition-all hover:scale-105 duration-500 z-[100]">
        <Link href="/hub/membro">
          <BPlenLogo variant="hub" size={42} />
        </Link>
      </div>

      {/* 💎 Painel de Identidade Vertical (Direita) */}
      <header className="fixed top-6 right-6 z-[100] flex flex-col items-center">

      {/* 💎 Identidade Vertical Premium (Elementos Flutuantes) 💎 */}
      <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-700">
         
         {/* 📸 Avatar Circular Premium (Aumentado) */}
         <div className="relative" ref={socialMenuRef}>
            <button 
               onClick={() => {
                  setIsSocialMenuOpen(!isSocialMenuOpen);
                  setIsThemeMenuOpen(false);
               }}
               className={cn(
                  "w-22 h-22 rounded-full border-2 transition-all duration-500 overflow-hidden flex items-center justify-center group bg-black/10 backdrop-blur-md shadow-2xl",
                  isSocialMenuOpen ? "border-[var(--accent-start)] scale-105 shadow-[0_0_25px_rgba(var(--accent-start-rgb),0.4)]" : "border-white/10 hover:border-white/30",
                  !photoUrl && user ? "animate-pulse" : ""
               )}
            >
               {photoUrl ? (
                  <img 
                     src={photoUrl} 
                     alt={nickname || "Perfil"} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
               ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] flex items-center justify-center text-xl font-black text-white">
                     {getInitials()}
                  </div>
               )}
            </button>

            {/* Menu Social Dropdown (Ajustado para o novo tamanho) */}
            <AnimatePresence>
               {isSocialMenuOpen && (
                 <motion.div 
                   initial={{ opacity: 0, x: -20, scale: 0.95 }}
                   animate={{ opacity: 1, x: -24, scale: 1 }}
                   exit={{ opacity: 0, x: -20, scale: 0.95 }}
                   className="absolute top-0 right-24 p-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl w-64 backdrop-blur-[var(--glass-blur)] z-[200]"
                 >
                    <div className="space-y-6">
                       <p className="px-2 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{BPLEN_NOMENCLATURE.navigation.member_area}</p>
                       
                       <div className="px-2 space-y-1">
                          <p className={cn(
                            "text-[14px] font-black text-[var(--text-primary)] leading-tight uppercase truncate",
                            !user?.displayName && "animate-pulse bg-white/5 rounded h-4 w-3/4"
                          )}>
                            {user?.displayName || "Membro BPlen"}
                          </p>
                          <p className={cn(
                            "text-[10px] font-bold text-[var(--accent-start)] italic",
                            !nickname && "animate-pulse bg-[var(--accent-start)]/10 rounded h-3 w-1/2 mt-1"
                          )}>
                            {nickname ? `@${nickname}` : "carregando..."}
                          </p>
                       </div>

                       <div className="space-y-1">
                          {[
                            { href: "/hub", icon: Home, label: BPLEN_NOMENCLATURE.navigation.home, active: pathname === "/hub" },
                            { href: "/hub/membro", icon: ShieldCheck, label: BPLEN_NOMENCLATURE.navigation.member_area, active: pathname === "/hub/membro" },
                            { href: "/hub/membro/contratos", icon: ScrollText, label: "Meus Contratos", active: pathname.startsWith("/hub/membro/contratos") },
                            { href: "/hub/profile_settings", icon: UserCog, label: BPLEN_NOMENCLATURE.navigation.profile, active: pathname.startsWith("/hub/profile_settings") },
                            { href: "/hub/networking", icon: Users, label: BPLEN_NOMENCLATURE.navigation.networking, active: pathname.startsWith("/hub/networking") },
                          ].map((item) => (
                             <Link 
                               key={item.href}
                               href={item.href}
                               onClick={() => setIsSocialMenuOpen(false)}
                               className={cn(
                                 "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all group border",
                                 item.active 
                                   ? "bg-[var(--accent-start)]/10 border-[var(--accent-start)]/20 text-[var(--accent-start)]"
                                   : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
                               )}
                             >
                                <item.icon size={18} />
                                <span className={cn("text-[10px] uppercase tracking-widest", item.active ? "font-black" : "font-bold")}>{item.label}</span>
                             </Link>
                          ))}

                          <button 
                            onClick={async () => {
                              setIsLoggingOut(true);
                              await logout();
                              router.push("/");
                            }}
                            className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/10"
                          >
                             <LogOut size={18} className={isLoggingOut ? "animate-pulse" : ""} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
                          </button>
                       </div>

                       <div className="h-px bg-white/5 mx-2" />

                       <div className="space-y-4 px-2">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">{BPLEN_NOMENCLATURE.navigation.social_label}</p>
                          <div className="grid grid-cols-2 gap-2">
                             {socialLinks.map((social, i) => (
                               <Link
                                 key={i}
                                 href={social.url}
                                 target="_blank"
                                 className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-start)]/30 hover:bg-[var(--accent-soft)] transition-all flex items-center justify-center group"
                               >
                                  <div className="scale-90 group-hover:scale-110 transition-transform">
                                     {social.icon}
                                  </div>
                               </Link>
                             ))}
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* 🔽 Chevron Interativo 🔽 */}
         <button 
            onClick={() => {
               setIsSocialMenuOpen(!isSocialMenuOpen);
               setIsThemeMenuOpen(false);
            }}
            className={cn(
               "transition-all duration-500 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-30 hover:opacity-100 my-1 p-1 rounded-full hover:bg-white/5",
               isSocialMenuOpen ? "rotate-180 opacity-80" : ""
            )}
         >
            <ChevronDown size={14} />
         </button>

         {/* 🎨 Seletor de Temas (Flutuante) */}
         <div className="relative" ref={themeMenuRef}>
            <button 
               onClick={() => {
                  setIsThemeMenuOpen(!isThemeMenuOpen);
                  setIsSocialMenuOpen(false);
               }}
               className={cn(
                  "p-4 rounded-full transition-all duration-500 flex items-center justify-center border border-white/5 bg-black/5 backdrop-blur-sm",
                  isThemeMenuOpen ? "bg-[var(--accent-start)] text-white rotate-90 scale-110 shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"
               )}
            >
               <Palette size={18} />
            </button>

            {/* Menu Temas Dropdown (Ajustado para abrir para baixo e evitar corte) */}
            <AnimatePresence>
               {isThemeMenuOpen && (
                 <motion.div 
                   initial={{ opacity: 0, x: -20, scale: 0.95 }}
                   animate={{ opacity: 1, x: -24, scale: 1 }}
                   exit={{ opacity: 0, x: -20, scale: 0.95 }}
                   className="absolute top-0 right-24 p-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl w-60 backdrop-blur-[var(--glass-blur)] z-[200]"
                 >
                    <div className="space-y-1">
                       <p className="px-3 py-1 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">Seleção de Imersão</p>
                       {THEMES.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setTheme(opt.id);
                              setIsThemeMenuOpen(false);
                            }}
                            className={cn(
                               "w-full p-3 rounded-2xl flex items-center gap-4 transition-all",
                               theme === opt.id ? "bg-[var(--accent-start)]/20 text-[var(--accent-start)]" : "text-[var(--text-secondary)] hover:bg-white/5"
                            )}
                          >
                             <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: opt.color }} />
                             <span className="text-[11px] font-bold">{opt.label}</span>
                             {theme === opt.id && <Check size={12} className="ml-auto" />}
                          </button>
                       ))}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      </header>
    </>
  );
}
