"use client";

import React from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { redirect } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  Calendar, 
  Settings, 
  FileText, 
  Briefcase, 
  Users, 
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Globe,
  Ticket,
  Handshake,
  FlaskConical
} from "lucide-react";
import { HubHeader } from "@/components/hub/HubHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, loadingPermissions } = useAuthContext();
  const { theme } = useTheme();

  // Aguarda tanto o estado de autenticação quanto o primeiro snapshot de permissões
  // antes de tomar qualquer decisão de redirect, evitando race condition.
  if (loading || loadingPermissions) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-t-[var(--accent-start)] border-[var(--accent-soft)] rounded-full animate-spin"></div>
          <p className="mt-4 text-[var(--text-muted)] font-medium tracking-wide text-xs uppercase">Verificando Acesso...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    redirect("/");
  }

  return (
    <div className={`flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-500 ${theme !== 'light' ? `theme-${theme}` : ''}`}>
      
      {/* Ghost Sidebar Dashboard (Pure Typography) */}
      <aside className="w-68 fixed h-full bg-[var(--input-bg)] backdrop-blur-3xl border-r border-[var(--border-primary)] shadow-2xl p-7 flex flex-col z-20">
            <div className="flex items-center gap-3">
               {/* Spacer for the HubHeader floating logo */}
               <div className="w-[54px]" />
               <div className="flex flex-col">
                 <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] group uppercase leading-none">
                   Admin
                 </h2>
                 <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-bold opacity-60">Control Center</p>
               </div>
            </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
          <NavLink href="/admin" icon={<LayoutDashboard size={18} />}>DASHBOARD</NavLink>
          <div className="pt-4 pb-2 px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-40">Operação</div>
          <NavLink href="/admin/agenda" icon={<Calendar size={18} />}>SINCRONIZAR AGENDA</NavLink>
          <NavLink href="/admin/gestao-agenda" icon={<Settings size={18} />}>PROGRAMAÇÃO HUB</NavLink>
          
          <div className="pt-4 pb-2 px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-40">Conteúdo & Vendas</div>
          <NavLink href="/admin/products" icon={<Zap size={18} />}>PORTFÓLIO</NavLink>
          <NavLink href="/admin/partners" icon={<Handshake size={18} />}>GESTÃO DE PARCEIROS</NavLink>
          <NavLink href="/admin/marketing" icon={<Ticket size={18} />}>CUPONS E OFERTAS</NavLink>
          <NavLink href="/admin/social" icon={<Globe size={18} />}>MEDIA E EDITORIAL</NavLink>
          
          <div className="pt-4 pb-2 px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-40">Dados & Usuários</div>
          <NavLink href="/admin/users" icon={<Users size={18} />}>GESTÃO DE USUÁRIOS</NavLink>
          <NavLink href="/admin/forms" icon={<FileText size={18} />}>FORMULÁRIOS</NavLink>
          <NavLink href="/admin/pesquisas" icon={<LayoutDashboard size={18} />}>SURVEYS</NavLink>
          <NavLink href="/admin/sandbox" icon={<FlaskConical size={18} />}>SANDBOX 🧬</NavLink>
        </nav>

        <div className="mt-auto pt-6 border-t border-[var(--border-primary)]/50">
           <div className="p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-start)]/10 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent-start)] mb-1">Acesso Privilegiado</p>
              <p className="text-[10px] text-[var(--text-muted)]">Navegação administrativa habilitada para o seu perfil.</p>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-68">
         <HubHeader />
         
         <main className="p-8 max-w-[1400px] relative z-10 transition-all duration-300">
            <div className="glass p-8 min-h-[calc(100vh-10rem)] relative overflow-hidden bg-[var(--input-bg)]/30 border border-[var(--border-primary)] rounded-[3rem]">
               {children}
               
               {/* Subtle Ambient Glows */}
               <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[var(--accent-start)] rounded-full blur-[100px] opacity-[0.03] pointer-events-none" />
               <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-[var(--accent-end)] rounded-full blur-[100px] opacity-[0.03] pointer-events-none" />
            </div>
         </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] transition-all hover:translate-x-1 active:scale-95 group border border-transparent hover:border-[var(--border-primary)]"
    >
      <span className="text-[var(--text-muted)] group-hover:text-[var(--accent-start)] transition-colors">{icon}</span>
      {children}
    </Link>
  );
}
