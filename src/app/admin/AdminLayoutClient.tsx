"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, redirect } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Calendar,
  Settings,
  Users,
  LayoutDashboard,
  Zap,
  Globe,
  Ticket,
  Handshake,
  FlaskConical,
  Activity,
  QrCode,
  Route,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { HubHeader } from "@/components/hub/HubHeader";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
interface NavGroupDef {
  group: string;
  items: NavItem[];
}

const NAV: NavGroupDef[] = [
  { group: "Visão Geral", items: [{ href: "/admin", label: "Painel", icon: LayoutDashboard }] },
  {
    group: "Comercial",
    items: [
      { href: "/admin/products", label: "Portfólio", icon: Zap },
      { href: "/admin/partners", label: "Gestão de Parceiros", icon: Handshake },
    ],
  },
  {
    group: "Marketing",
    items: [
      { href: "/admin/marketing", label: "Cupons e Ofertas", icon: Ticket },
      { href: "/admin/social", label: "Mídia e Editorial", icon: Globe },
      { href: "/admin/qrcodes", label: "QR Codes", icon: QrCode },
    ],
  },
  {
    group: "Jornada e Agenda",
    items: [
      { href: "/admin/agenda", label: "Sincronizar Agenda", icon: Calendar },
      { href: "/admin/gestao-agenda", label: "Programação da Jornada", icon: Settings },
    ],
  },
  {
    group: "Pessoas",
    items: [
      { href: "/admin/users", label: "Gestão de Usuários", icon: Users },
      { href: "/admin/jornada-cliente", label: "Jornada do Cliente", icon: Route },
    ],
  },
  { group: "Instrumentos", items: [{ href: "/admin/fs", label: "F&S", icon: Activity }] },
  { group: "Sistema e Ferramentas", items: [{ href: "/admin/sandbox", label: "Sandbox", icon: FlaskConical }] },
];

const EXPANDED = 256;
const COLLAPSED = 80;
const STORAGE_KEY = "bplen-admin-sidebar-collapsed";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, loadingPermissions } = useAuthContext();
  const { theme } = useTheme();
  const pathname = usePathname();

  // Preferência recolhida/expandida persistida (lazy: seguro aqui porque a
  // sidebar só renderiza depois do gate de auth client-side — sem SSR da barra,
  // logo sem mismatch de hidratação).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  // Flyout (só quando recolhida): grupo em foco + posição vertical do ícone.
  const [flyout, setFlyout] = useState<{ group: NavGroupDef; top: number } | null>(null);
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
    setFlyout(null);
  }, []);

  const openFlyout = useCallback(
    (group: NavGroupDef, el: HTMLElement) => {
      if (!collapsed) return;
      if (flyTimer.current) clearTimeout(flyTimer.current);
      setFlyout({ group, top: el.getBoundingClientRect().top });
    },
    [collapsed]
  );
  const scheduleClose = useCallback(() => {
    if (flyTimer.current) clearTimeout(flyTimer.current);
    flyTimer.current = setTimeout(() => setFlyout(null), 140);
  }, []);
  const keepOpen = useCallback(() => {
    if (flyTimer.current) clearTimeout(flyTimer.current);
  }, []);

  // Aguarda auth + primeiro snapshot de permissões antes de qualquer redirect.
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

  const width = collapsed ? COLLAPSED : EXPANDED;

  return (
    <div
      className={`flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${theme !== "light" ? `theme-${theme}` : ""}`}
    >
      {/* Sidebar recolhível */}
      <aside
        style={{ width }}
        className="fixed h-full bg-[var(--input-bg)] backdrop-blur-3xl border-r border-[var(--border-primary)] shadow-2xl px-3 py-4 flex flex-col z-20 transition-[width] duration-300 ease-out"
      >
        {/* Marca — espaço reservado ao logo flutuante do HubHeader (fixed top-8 left-8) */}
        <div className="pb-2 shrink-0">
          <div className="h-[42px]" />
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1 mt-1`}>
            {!collapsed && (
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] uppercase leading-none">Admin</h2>
            )}
            <button
              onClick={toggle}
              title={collapsed ? "Expandir barra" : "Recolher barra"}
              aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
              className="w-7 h-7 rounded-lg border border-[var(--border-primary)] text-[var(--text-muted)] flex items-center justify-center hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/40 transition-all"
            >
              <ChevronLeft size={15} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
          {NAV.map((sec) => (
            <div key={sec.group}>
              {!collapsed ? (
                <div className="pt-3 pb-1 px-3 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-40">
                  {sec.group}
                </div>
              ) : (
                <div className="pt-2" aria-hidden="true" />
              )}
              {sec.items.map((it) => {
                const Icon = it.icon;
                const active = isActive(pathname, it.href);
                return (
                  <div
                    key={it.href}
                    onMouseEnter={(e) => openFlyout(sec, e.currentTarget)}
                    onMouseLeave={scheduleClose}
                  >
                    <Link
                      href={it.href}
                      title={collapsed ? it.label : undefined}
                      className={`flex items-center gap-3 ${collapsed ? "justify-center px-0" : "px-3"} py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border ${
                        active
                          ? "bg-[var(--accent-soft)] text-[var(--accent-start)] border-[var(--accent-start)]/20"
                          : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)]"
                      }`}
                    >
                      <span className={active ? "text-[var(--accent-start)]" : "text-[var(--text-muted)]"}>
                        <Icon size={18} />
                      </span>
                      {!collapsed && <span>{it.label}</span>}
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-3 shrink-0">
          <div className={`rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-start)]/10 text-center ${collapsed ? "p-2" : "p-3"}`}>
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--accent-start)]">
              {collapsed ? "BP" : "Acesso Privilegiado"}
            </p>
            {!collapsed && <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Navegação administrativa habilitada.</p>}
          </div>
        </div>
      </aside>

      {/* Flyout de subpáginas ao passar o cursor (barra recolhida) */}
      {collapsed && flyout && (
        <div
          style={{ top: flyout.top, left: COLLAPSED + 4 }}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
          className="fixed z-40 min-w-[200px] bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl shadow-2xl backdrop-blur-3xl p-2"
        >
          <div className="px-3 pt-1 pb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50">
            {flyout.group.group}
          </div>
          {flyout.group.items.map((it) => {
            const Icon = it.icon;
            const active = isActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setFlyout(null)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent-start)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={16} />
                {it.label}
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex-1 flex flex-col transition-[margin] duration-300 ease-out" style={{ marginLeft: width }}>
        <HubHeader />

        <main className="p-6 max-w-[1500px] relative z-10">
          <div className="glass p-6 min-h-[calc(100vh-8rem)] relative overflow-hidden bg-[var(--input-bg)]/30 border border-[var(--border-primary)] rounded-[2rem]">
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
