"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { BPlenLogo } from "@/components/shared/BPlenLogo";
import { cn } from "@/lib/utils";

interface GlobalFooterProps {
  variant?: "full" | "minimal";
  className?: string;
}

/**
 * GlobalFooter — O Rodapé Soberano do Ecossistema BPlen
 * Design: Glassmorphism v3.1 (Apple iOS Pro)
 * Adaptabilidade: Totalmente compatível com temas Light/Dark/Custom via variáveis CSS.
 */
export function GlobalFooter({ variant = "full", className }: GlobalFooterProps) {
  const { user, signInWithGoogle, isLoggingIn } = useAuth();
  const router = useRouter();

  const handleHubAccess = async () => {
    if (user) {
      router.push("/hub");
    } else {
      try {
        await signInWithGoogle();
        router.push("/hub");
      } catch (err) {
        console.error("Erro ao acessar HUB via Footer:", err);
      }
    }
  };

  return (
    <footer className={cn(
      "w-full border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/30 backdrop-blur-xl py-16 px-6 mt-auto transition-colors duration-500",
      className
    )}>
      <div className="max-w-7xl mx-auto space-y-12">
        
        {variant === "full" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-start">
            
            {/* 1. Branding & Mission */}
            <div className="space-y-6 lg:col-span-2">
              <BPlenLogo variant="main" size={28} className="opacity-90 hover:opacity-100 transition-opacity" />
              <div className="space-y-4 max-w-md">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
                  Sua parceira de gestão e desenvolvimento profissional.
                </p>
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)] font-medium">
                  BPlen é uma Consultoria de Negócios com Foco em Desenvolvimento Humano que utiliza método, dados e abordagens humanas holísticas para descomplicar o desenvolvimento humano no trabalho.
                </p>
              </div>
            </div>

            {/* 2. Ecossistema */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Ecossistema</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={handleHubAccess}
                    disabled={isLoggingIn}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-medium disabled:opacity-50"
                  >
                    Área de Membro
                  </button>
                </li>
                <li>
                  <Link href="/servicos" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-medium">
                    Serviços
                  </Link>
                </li>
                <li>
                  <Link href="/conteudo" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-medium">
                    Conteúdo
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. Suporte */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Suporte</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="https://wa.me/5511945152088" target="_blank" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-medium">
                    WhatsApp
                  </Link>
                </li>
                <li>
                  <Link href="mailto:contato@bplen.com" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-medium">
                    Email
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        )}

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-12 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
              © {new Date().getFullYear()} BPlen Consultoria. Todos os direitos reservados.
            </span>
            <span className="text-[8px] font-medium text-[var(--text-muted)] opacity-40 uppercase tracking-widest">
              LENCINA ESTRATÉGIA E GESTÃO DE NEGÓCIOS E PESSOAS LTDA • CNPJ: 62.857.668/0001-07
            </span>
          </div>

          <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
            <Link href="/privacidade" className="hover:text-[var(--text-primary)] transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Governança</Link>
            <Link href="/termos" className="hover:text-[var(--text-primary)] transition-colors">Termos</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
