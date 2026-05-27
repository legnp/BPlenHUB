"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Calendar, 
  FileText, 
  Briefcase, 
  Handshake, 
  ChevronRight,
  Clock,
  Loader2,
  Globe,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { getSyncedEvents } from "@/actions/calendar";

export default function AdminDashboardPage() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const events = await getSyncedEvents();
        // Filtra apenas os agendamentos 1 to 1 que têm participantes
        const count = events.filter(ev => 
          ev.summary.toLowerCase().includes("1 to 1") && 
          (ev.registeredCount || 0) > 0
        ).length;
        setPendingCount(count);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const stats = [
    {
      title: "AGENDAMENTOS 1:1",
      value: loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (pendingCount ?? 0),
      label: "cliques diretos nesta semana",
      icon: Handshake,
      color: "text-[var(--accent-start)]",
      bg: "bg-[var(--accent-start)]/10",
      link: "/admin/gestao-agenda",
      highlight: (pendingCount ?? 0) > 0
    },
    {
      title: "AGENDA",
      value: "Ativa",
      label: "sincronização ok",
      icon: Calendar,
      color: "text-green-500",
      bg: "bg-green-500/10",
      link: "/admin/gestao-agenda"
    },
    {
      title: "LEADS",
      value: "Gestão",
      label: "base de contatos",
      icon: Users,
      color: "text-[var(--accent-end)]",
      bg: "bg-[var(--accent-end)]/10",
      link: "/admin/users"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header com Animação */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] text-left transition-all">
          DASHBOARD <span className="text-[var(--accent-start)] italic">Administrativo</span>
        </h1>
        <p className="text-[var(--text-muted)] text-sm font-medium opacity-70 flex items-center gap-2 text-left">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          BPlen HUB | Visão Geral Administrativa
        </p>
      </motion.div>

      {/* Grid de Stats Interativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              href={stat.link}
              className={`group block p-6 rounded-[24px] border border-[var(--border-primary)] bg-[var(--input-bg)] backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--accent-start)]/5 hover:-translate-y-1 relative overflow-hidden ${stat.highlight ? 'ring-2 ring-[var(--accent-start)]/20' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-40 group-hover:text-[var(--accent-start)] transition-colors" />
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter flex items-baseline gap-2">
                  {stat.value}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">
                  {stat.title}
                </p>
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  {stat.label}
                </p>
              </div>

              {/* Decorative Glow for high priority */}
              {stat.highlight && (
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--accent-start)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent-start)]/10 transition-all" />
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Access Section */}
      <div className="bg-[var(--input-bg)] backdrop-blur-xl border border-[var(--border-primary)] rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-[var(--accent-start)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Atalhos de Gestão</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Gestão Social", icon: Globe, href: "/admin/social" },
            { label: "Gestão de Parceiros", icon: Handshake, href: "/admin/partners" },
            { label: "Novo Portfólio", icon: Briefcase, href: "/admin/portfolio" },
            { label: "Análise F&S", icon: BarChart3, href: "/admin/fs" },
            { label: "Ver Formulários", icon: FileText, href: "/admin/forms" },
            { label: "Ajustar Agenda", icon: Calendar, href: "/admin/agenda" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-4 bg-[var(--bg-primary)]/50 hover:bg-[var(--accent-soft)] border border-[var(--border-primary)] rounded-2xl transition-all group"
            >
              <item.icon className="w-4 h-4 text-[var(--text-muted)] opacity-50 group-hover:text-[var(--accent-start)] transition-colors" />
              <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
