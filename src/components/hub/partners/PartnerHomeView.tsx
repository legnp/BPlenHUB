"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Handshake, Route, Users, Wallet } from "lucide-react";
import { StatTile } from "@/components/admin/StatTile";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { getPartnerIndicationsAction } from "@/actions/partners/referrals";
import { getPartnerCyclesAction, PartnerBillingCycle } from "@/actions/partners/billing-cycles";
import { PARTNER_CYCLE_STATUS_LABEL } from "@/lib/partners/cycle-status";
import { BPLEN_NOMENCLATURE } from "@/config/nomenclature";

/**
 * Home do Parceiro — porta de entrada da area.
 *
 * Mostra o essencial da parceria e encaminha para as tres frentes (jornada, agenda,
 * indicacoes). O dado vem projetado do servidor pelas mesmas actions das telas internas
 * — nenhuma leitura nova, nenhuma regra duplicada.
 */

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const ATALHOS = [
  {
    href: "/hub/partners/journey",
    icon: Route,
    label: "Jornada de Parceria",
    description: "Check-in, formalização e os próximos passos combinados.",
  },
  {
    href: "/hub/partners/gestao_agenda",
    icon: CalendarDays,
    label: "Gestão de Agenda",
    description: "Agende suas sessões de parceria — sem consumo de créditos.",
  },
  {
    href: "/hub/partners/gestao_indicacoes",
    icon: Users,
    label: "Gestão de Indicações",
    description: "Seus indicados, os serviços adquiridos e os ciclos de repasse.",
  },
];

export function PartnerHomeView({ nickname }: { nickname?: string | null }) {
  const [loading, setLoading] = useState(true);
  const [indicationsCount, setIndicationsCount] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [cycles, setCycles] = useState<PartnerBillingCycle[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getPartnerIndicationsAction(), getPartnerCyclesAction()])
      .then(([indicacoes, ciclos]) => {
        if (!active) return;
        setIndicationsCount(indicacoes.indications.length);
        setTotalCommission(indicacoes.totalCommission);
        setCycles(ciclos.cycles);
      })
      .catch((error) => console.error("Erro ao carregar a home do parceiro:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <AtmosphericLoading label={`Carregando ${BPLEN_NOMENCLATURE.navigation.partner_area}...`} />;
  }

  // O ciclo que pede acao do parceiro vem primeiro; ele e' o unico que exige algo dele.
  const cicloPendente = cycles.find((c) => c.status === "emita_recibo");
  const emAberto = cycles.filter((c) => c.status !== "concluido" && c.status !== "nenhuma_indicacao");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
          Parceria BPlen
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          {nickname ? `Olá, ${nickname}.` : "Olá."} Bem-vindo à sua área de parceria.
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          Aqui você acompanha suas indicações, agenda as suas sessões e conduz os repasses.
          Comece pela jornada — é ela que libera cada parte da parceria.
        </p>
      </section>

      {cicloPendente ? (
        <Link
          href="/hub/partners/gestao_indicacoes"
          className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[2rem] border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">
              {PARTNER_CYCLE_STATUS_LABEL.emita_recibo}
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
              O ciclo de {cicloPendente.monthYear} está esperando o seu recibo ou nota fiscal.
            </p>
          </div>
          <ArrowRight size={18} className="text-amber-600" />
        </Link>
      ) : null}

      <div id="partner-home-metricas" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Indicações registradas" value={indicationsCount} icon={<Users size={16} />} tone="accent" />
        <StatTile
          label="Repasse acumulado"
          value={money(totalCommission)}
          icon={<Wallet size={16} />}
          tone="accent"
        />
        <StatTile
          label="Ciclos em aberto"
          value={emAberto.length}
          detail={emAberto.length > 0 ? "Acompanhe em Gestão de Indicações" : "Nada pendente por aqui"}
          icon={<Handshake size={16} />}
          tone={emAberto.length > 0 ? "warning" : "success"}
        />
      </div>

      <section id="partner-home-atalhos" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ATALHOS.map((atalho) => {
          const Icon = atalho.icon;
          return (
            <Link
              key={atalho.href}
              href={atalho.href}
              className="p-6 rounded-[2rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/30 hover:border-[var(--accent-start)]/30 transition-colors group space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-start)]/10 text-[var(--accent-start)] flex items-center justify-center">
                <Icon size={18} />
              </div>
              <p className="text-sm font-black text-[var(--text-primary)]">{atalho.label}</p>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{atalho.description}</p>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir <ArrowRight size={12} />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
