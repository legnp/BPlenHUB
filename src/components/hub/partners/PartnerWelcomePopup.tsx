"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake } from "lucide-react";
import GlassModal from "@/components/ui/GlassModal";
import { useAuthContext } from "@/context/AuthContext";
import {
  markPartnerWelcomeSeenAction,
  shouldShowPartnerWelcomeAction,
} from "@/actions/partners/welcome-popup";

/**
 * Boas-vindas ao novo parceiro — pop-up unico na home do hub.
 *
 * Aparece uma vez, assim que o Admin libera o acesso. O "ja vi" e' gravado no banco
 * (`User_Flags/partner_welcome`); a copia em localStorage serve so para nao piscar entre
 * a montagem da tela e a resposta do servidor.
 *
 * Nao e' um gate: nao bloqueia nada, e fechar tem o mesmo efeito de seguir adiante.
 */

const LOCAL_KEY = "bplen_partner_welcome_seen";

export function PartnerWelcomePopup() {
  const { services, loadingPermissions } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loadingPermissions) return;
    if (services?.partner_area_access !== true) return;

    // Copia local: se ja foi visto neste navegador, nem consulta o servidor.
    if (typeof window !== "undefined" && window.localStorage.getItem(LOCAL_KEY) === "1") return;

    let active = true;
    shouldShowPartnerWelcomeAction()
      .then((res) => {
        if (active && res.show) setIsOpen(true);
      })
      .catch((error) => console.error("Erro ao checar boas-vindas de parceria:", error));
    return () => {
      active = false;
    };
  }, [loadingPermissions, services]);

  const close = async () => {
    setIsOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(LOCAL_KEY, "1");
    try {
      await markPartnerWelcomeSeenAction();
    } catch (error) {
      console.error("Erro ao registrar boas-vindas de parceria como vista:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <GlassModal isOpen={isOpen} onClose={close} title="Sua parceria está ativa" maxWidth="max-w-lg">
      <div className="space-y-6 text-left">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-start)]/10 text-[var(--accent-start)] flex items-center justify-center">
          <Handshake size={22} />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Seu acesso de parceiro foi liberado. A partir de agora você tem uma área própria, com a
            jornada da parceria, a sua agenda de sessões e o acompanhamento das indicações e dos
            repasses.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Use o seletor de contexto no menu para alternar entre a sua área de membro e a de
            parceria quando quiser.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/hub/partners"
            onClick={close}
            className="flex-1 text-center px-6 py-4 bg-[var(--accent-start)] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform"
          >
            Conhecer minha área
          </Link>
          <button
            onClick={close}
            className="px-6 py-4 rounded-2xl border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
