"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Fingerprint, Archive } from "lucide-react";

/**
 * Sub-abas da secao de Pessoas do admin (mesmo padrao do FSTabs).
 * "Membros" -> /admin/users (cadastros concluidos),
 * "Autenticacoes" -> /admin/users/autenticacoes (funil de onboarding) e
 * "Acervo" -> /admin/users/acervo (resgate retroativo das respostas).
 */
export function UsersTabs() {
  const pathname = usePathname();
  const base = "/admin/users";

  const tabs = [
    { name: "Membros", path: "/admin/users", icon: <Users size={16} /> },
    { name: "Autenticacoes", path: "/admin/users/autenticacoes", icon: <Fingerprint size={16} /> },
    { name: "Acervo", path: "/admin/users/acervo", icon: <Archive size={16} /> },
  ];

  return (
    <div className="flex items-center gap-2 mb-8 border-b border-[var(--border-primary)] pb-px">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path !== base && pathname.startsWith(tab.path));
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-t-2xl transition-all border-b-2 ${
              isActive
                ? "text-[var(--accent-start)] border-[var(--accent-start)] bg-[var(--accent-soft)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
            }`}
          >
            {tab.icon}
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
