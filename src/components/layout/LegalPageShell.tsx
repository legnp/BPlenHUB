"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { BPlenLogo } from "@/components/shared/BPlenLogo";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

interface LegalPageShellProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  type: "terms" | "privacy";
  children: React.ReactNode;
}

/**
 * LegalPageShell — Moldura premium em tema claro para documentos jurídicos.
 * Alinhado com a identidade visual Apple iOS Pro e em estrito cumprimento com o Protocolo Zero Emoji.
 */
export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  type,
  children,
}: LegalPageShellProps) {
  // Sobrescreve localmente as variáveis CSS globais para garantir tema claro puro de altíssima legibilidade
  const lightThemeStyle = {
    "--bg-primary": "#F5F7FA",
    "--text-primary": "#1D1D1F",
    "--text-secondary": "#3F3F46",
    "--text-muted": "#52525B",
    "--border-primary": "rgba(0, 0, 0, 0.1)",
    "--glass-bg": "rgba(255, 255, 255, 0.4)",
    "--glass-border": "1px solid rgba(0, 0, 0, 0.08)",
    "--glass-shadow": "0 4px 16px 0 rgba(0, 0, 0, 0.02)",
    "--input-bg": "rgba(255, 255, 255, 0.6)",
    "--input-border": "rgba(0, 0, 0, 0.1)",
    backgroundColor: "#F5F7FA",
    color: "#1D1D1F",
  } as React.CSSProperties;

  return (
    <div
      style={lightThemeStyle}
      className="min-h-screen flex flex-col font-sans transition-all duration-300 antialiased"
    >
      {/* Cabeçalho Fixo Premium (Glassmorphism v3.1 Light) */}
      <header className="sticky top-0 z-chrome w-full border-b border-[var(--border-primary)] bg-white/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="focus:outline-none">
            {/* Logo +50% (item 5): 26 -> 39. O header tem altura fixa (h-16) e centraliza,
                entao a altura do componente nao muda. */}
            <BPlenLogo variant="main" size={39} />
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para a Home
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* Cabeçalho do Documento */}
          <header className="space-y-4 pb-8 border-b border-[var(--border-primary)]">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-start)]">
              {type === "privacy" ? (
                <>
                  <Shield size={12} className="text-[#ff0080]" />
                  <span>Seguranca da Informacao</span>
                </>
              ) : (
                <>
                  <FileText size={12} className="text-[#ff0080]" />
                  <span>Diretrizes e Regras</span>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">
              {title}
            </h1>

            {subtitle && (
              <p className="text-sm md:text-base text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}

            <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
              <span>Atualizado em:</span>
              <span>{lastUpdated}</span>
            </div>
          </header>

          {/* Área de Leitura Principal */}
          <article className="prose prose-zinc max-w-none text-[14px] md:text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {children}
          </article>
        </motion.div>
      </main>

      {/* Rodapé Adaptativo Claro */}
      <GlobalFooter variant="full" className="mt-auto border-t border-[var(--border-primary)] bg-white/10" />
    </div>
  );
}
