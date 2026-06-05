"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Activity, Brain } from "lucide-react";

export function FSTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Submissões",
      path: "/admin/fs",
      icon: <Activity size={16} />
    },
    {
      name: "Formulários",
      path: "/admin/fs/forms",
      icon: <FileText size={16} />
    },
    {
      name: "Surveys",
      path: "/admin/fs/surveys",
      icon: <LayoutDashboard size={16} />
    },
    {
      name: "Devolutiva Comportamental",
      path: "/admin/fs/devolutiva",
      icon: <Brain size={16} />
    }
  ];

  return (
    <div className="flex items-center gap-2 mb-8 border-b border-[var(--border-primary)] pb-px">
      {tabs.map(tab => {
        const isActive = pathname === tab.path || (tab.path !== "/admin/fs" && pathname.startsWith(tab.path));
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-t-2xl transition-all border-b-2 ${isActive ? "text-[var(--accent-start)] border-[var(--accent-start)] bg-[var(--accent-soft)]" : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"}`}
          >
            {tab.icon}
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
