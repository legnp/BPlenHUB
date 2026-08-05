import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { fetchUserPermissionsStatus } from "@/actions/auth-permissions";
import { verifySignedSession } from "@/actions/auth-session";
import { entrarRedirectTarget } from "@/lib/auth/entrar-redirect-server";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

export const metadata: Metadata = {
  title: "Área de Parceiros",
  description: "Acompanhe a sua parceria BPlen: jornada, agenda, indicações e repasses.",
};

export const dynamic = "force-dynamic";

/**
 * BPlen HUB — Área de Parceiros (Fase 0)
 *
 * Porta de entrada do contexto Parceiro. Nesta fase a página existe para fechar o
 * caminho do gate e do toggle de contexto; a Home real do parceiro (PartnerHomeView,
 * com jornada, agenda e indicações) chega nas fases seguintes do
 * PARTNER-AREA-EXPANSION-PLAN.md.
 */
export default async function PartnerAreaPage() {
  const session = await verifySignedSession();

  // 1. Gate de autenticação primário.
  if (!session) {
    redirect(await entrarRedirectTarget("/hub"));
  }

  // 2. Gate de autorização granular — 2a camada; a 1a é o layout.tsx da subárvore.
  // Sem bypass de admin: o selo de parceiro não é herdado.
  const { services } = await fetchUserPermissionsStatus(session.uid);

  if (services?.partner_area_access !== true) {
    console.warn(`[PartnerArea Gate] Acesso bloqueado via Servidor para o UID: ${session.uid}.`);
    redirect("/hub");
  }

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 w-full">
      <FunctionalPageHeader
        eyebrow="Parceria BPlen"
        title="Área de"
        titleAccent="Parceiros"
        backHref="/hub"
        backLabel="Voltar ao Início"
        icon={<Handshake size={24} className="text-[var(--accent-start)]" />}
        statusTag={{ label: "Em preparação", tone: "warning" }}
      />

      <section className="p-8 md:p-10 rounded-[2rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/40 space-y-5">
        <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">
          Sua parceria já está ativa
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          Comece pela sua jornada de parceria: é lá que ficam o check-in, a formalização e os
          próximos passos combinados com a BPlen. A agenda, o acompanhamento das suas indicações
          e os ciclos de repasse chegam em seguida, e o time avisa a cada novidade.
        </p>
        <Link
          href="/hub/partners/journey"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent-start)] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent-start)]/20"
        >
          Ir para a Jornada de Parceria
        </Link>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Use o seletor de contexto no menu para voltar à sua área de membro.
        </p>
      </section>
    </div>
  );
}
