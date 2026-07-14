import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollText, AlertCircle, Clock, ShieldCheck, XCircle, FileSignature, ArrowRight, ReceiptText } from "lucide-react";
import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";
import { getMemberContractsPanelAction, type ContractCard } from "@/actions/member-contracts";
import { FunctionalPageHeader, type StatusTone } from "@/components/layout/FunctionalPageHeader";
import { ContractDocButton } from "@/components/contracts/ContractDocButton";
import { formatBRL } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Meus Contratos",
  description: "Contratos, assinaturas e documentos BPlen HUB",
};

export const dynamic = "force-dynamic";

/** Formata uma data ISO com segurança — retorna null se for inválida (nunca lança). */
function fmtDate(iso: string | null, pattern: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return format(d, pattern, { locale: ptBR });
}

/** Badge de status REAL (assinatura + pagamento), padrão Gestão Funcional (theme vars). */
function CardBadge({ state }: { state: ContractCard["cardState"] }) {
  const map: Record<ContractCard["cardState"], { label: string; cls: string; icon: React.ReactNode }> = {
    aguardando_pagamento: {
      label: "Aguardando Pagamento",
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: <Clock size={12} />,
    },
    aguardando_assinatura: {
      label: "Aguardando Assinatura",
      cls: "bg-[var(--accent-soft)] text-[var(--accent-start)] border-[var(--accent-start)]/20",
      icon: <FileSignature size={12} />,
    },
    assinado: {
      label: "Assinado · Serviço Liberado",
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      icon: <ShieldCheck size={12} />,
    },
    cancelado: {
      label: "Cancelado / Recusado",
      cls: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <XCircle size={12} />,
    },
  };
  const b = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${b.cls}`}>
      {b.icon}
      {b.label}
    </span>
  );
}

export default async function ContratosPage() {
  const session = await getServerSession();
  if (!session) redirect("/");

  const result = await getMemberContractsPanelAction();
  const cards = result.cards || [];
  const error = result.error;
  const pendingCount = cards.filter((c) => c.cardState === "aguardando_assinatura").length;

  const headerTag: { label: string; tone: StatusTone } | undefined =
    pendingCount > 0
      ? { label: `${pendingCount} aguardando assinatura`, tone: "warning" }
      : cards.length > 0
        ? { label: "Tudo em dia", tone: "success" }
        : undefined;

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 pb-16 md:px-12 space-y-10 w-full animate-fade-in">
      <FunctionalPageHeader
        eyebrow="Gestão de serviços e contratos"
        title="Meus"
        titleAccent="Contratos"
        backHref="/hub/membro"
        backLabel="Voltar"
        statusTag={headerTag}
      />

      {error ? (
        <div className="max-w-2xl mx-auto rounded-[2rem] bg-red-500/5 border border-red-500/20 p-12 text-center space-y-4">
          <AlertCircle size={44} className="mx-auto text-red-500 opacity-80" />
          <h3 className="text-lg font-black text-red-600 uppercase tracking-widest">Falha na Sincronização</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Houve um problema ao carregar seus contratos. {error}
          </p>
          <Link
            href="/hub/membro/contratos"
            className="inline-block mt-2 px-8 py-3 rounded-full bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-soft)] transition-all"
          >
            Tentar Novamente
          </Link>
        </div>
      ) : cards.length === 0 ? (
        <div className="max-w-2xl mx-auto rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] p-16 text-center space-y-4">
          <ScrollText size={44} className="mx-auto text-[var(--text-muted)] opacity-50" />
          <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-widest">Nenhum contrato ainda</h3>
          <p className="text-xs text-[var(--text-muted)]">Seus serviços contratados e contratos aparecerão aqui.</p>
          <Link
            href="/hub"
            className="inline-block mt-2 px-8 py-3 rounded-full bg-[var(--accent-start)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Explorar HUB
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.serviceKey}
              className="rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] p-5 shadow-sm flex flex-col gap-4"
            >
              {/* Topo: status + pedido */}
              <div className="flex justify-between items-start gap-3">
                <CardBadge state={card.cardState} />
                {card.orderId ? (
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] shrink-0">
                    #{card.orderId.substring(0, 6)}
                  </span>
                ) : null}
              </div>

              {/* Título + ID */}
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)] leading-tight">{card.productTitle}</h3>
                {card.serviceCode ? (
                  <p className="text-[10px] font-bold text-[var(--accent-start)] uppercase tracking-wider mt-0.5">ID: {card.serviceCode}</p>
                ) : null}
              </div>

              {/* Rodapé fixo (mt-auto) — mantém a altura uniforme entre os cards */}
              <div className="mt-auto space-y-3 pt-4 border-t border-[var(--border-primary)]/50">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-0.5">Valor</p>
                    <p className="text-lg font-black text-[var(--text-primary)]">
                      {card.finalPrice !== null ? `R$ ${formatBRL(card.finalPrice)}` : "—"}
                    </p>
                  </div>
                  {fmtDate(card.purchaseDate, "dd MMM yyyy") ? (
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-0.5">Data</p>
                      <p className="text-xs font-bold text-[var(--text-secondary)]">
                        {fmtDate(card.purchaseDate, "dd MMM yyyy")}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Carimbo discreto (quando assinado) — uma linha, sem caixa */}
                {card.cardState === "assinado" && (fmtDate(card.signedAt, "dd MMM yyyy 'às' HH:mm") || card.verificationCode) ? (
                  <div className="space-y-0.5">
                    {fmtDate(card.signedAt, "dd MMM yyyy 'às' HH:mm") ? (
                      <p className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium">
                        <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
                        Assinado {fmtDate(card.signedAt, "dd MMM yyyy 'às' HH:mm")}
                        {card.geoLocation ? ` · ${card.geoLocation}` : ""}
                      </p>
                    ) : null}
                    {card.verificationCode ? (
                      <p className="text-[9px] text-[var(--text-muted)]/70 font-mono truncate pl-[18px]" title={card.verificationCode}>
                        {card.verificationCode}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Ações compactas por estado */}
                {card.cardState === "assinado" ? (
                  <div className="space-y-2">
                    {card.documentFileId ? (
                      <ContractDocButton
                        fileId={card.documentFileId}
                        className="w-full py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5"
                      />
                    ) : null}
                    <div className="flex gap-2">
                      {card.invoiceUrl ? (
                        <a
                          href={card.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5"
                        >
                          <ReceiptText size={13} /> Nota Fiscal
                        </a>
                      ) : null}
                      <Link
                        href="/hub/membro"
                        className="flex-1 py-2.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--accent-start)] text-white hover:bg-[var(--accent-end)] transition-all flex items-center justify-center gap-1.5"
                      >
                        Acessar HUB <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ) : card.cardState === "aguardando_assinatura" ? (
                  card.canSignInApp && card.orderId ? (
                    <Link
                      href={`/hub/checkout/success?orderId=${encodeURIComponent(card.orderId)}`}
                      className="w-full py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--accent-start)] text-white hover:bg-[var(--accent-end)] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,44,141,0.3)]"
                    >
                      <FileSignature size={14} /> Assinar Contrato
                    </Link>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)] text-center">
                      Assinatura via link enviado pela BPlen
                    </div>
                  )
                ) : card.cardState === "aguardando_pagamento" && card.productSlug ? (
                  <Link
                    href={`/hub/checkout/${card.productSlug}`}
                    className="w-full py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-all flex items-center justify-center gap-2"
                  >
                    Tentar Pagar Novamente
                  </Link>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)] text-center cursor-not-allowed">
                    Sem ações disponíveis
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
