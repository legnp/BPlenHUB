"use client";

import React, { useEffect, useState } from "react";
import { Handshake, Users, Wallet, TrendingUp } from "lucide-react";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile } from "@/components/admin/StatTile";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { PartnerIndicationsTable } from "@/components/hub/partners/PartnerIndicationsTable";
import { PartnerBillingCyclesPanel } from "@/components/hub/partners/PartnerBillingCyclesPanel";
import { getPartnerIndicationsAction, PartnerIndication } from "@/actions/partners/referrals";
import { getPartnerCyclesAction, PartnerBillingCycle } from "@/actions/partners/billing-cycles";

/**
 * Gestao de Indicacoes do Parceiro.
 *
 * Metricas no topo e o grid do desenho da Gestora: indicacoes a esquerda, ciclos de
 * repasse a direita. As duas listas tem busca; a de indicacoes tem ordenacao por coluna.
 *
 * Todo o dado exibido vem projetado do servidor (`getPartnerIndicationsAction`), campo a
 * campo: o navegador do parceiro nunca recebe o documento do indicado.
 */
export default function PartnerIndicationsPage() {
  const [indications, setIndications] = useState<PartnerIndication[]>([]);
  const [cycles, setCycles] = useState<PartnerBillingCycle[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Recarrega os ciclos depois de uma acao do parceiro (recibo enviado, comentario).
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getPartnerIndicationsAction(), getPartnerCyclesAction()])
      .then(([indicacoes, ciclos]) => {
        if (!active) return;
        setIndications(indicacoes.indications);
        setTotalCommission(indicacoes.totalCommission);
        setCycles(ciclos.cycles);
        setError(indicacoes.error || ciclos.error || null);
      })
      .catch((err) => {
        console.error("Erro ao carregar a gestao de indicacoes:", err);
        if (active) setError("Nao foi possivel carregar as suas indicacoes agora.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshCounter]);

  if (isLoading) {
    return <AtmosphericLoading label="Carregando Gestão de Indicações..." />;
  }

  const comIndicacaoPaga = indications.filter((i) => i.services.length > 0).length;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 w-full">
      <FunctionalPageHeader
        eyebrow="Acompanhamento da sua parceria"
        title="Gestão de"
        titleAccent="Indicações"
        backHref="/hub/partners"
        backLabel="Voltar"
        icon={<Handshake size={24} />}
      />

      {error ? (
        <div className="p-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-600 font-medium">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Indicações registradas"
          value={indications.length}
          icon={<Users size={16} />}
          tone="accent"
        />
        <StatTile
          label="Com serviço adquirido"
          value={comIndicacaoPaga}
          detail={`de ${indications.length} indicação(ões)`}
          icon={<TrendingUp size={16} />}
          tone="success"
        />
        <StatTile
          label="Repasse acumulado"
          value={money.format(totalCommission)}
          detail="Soma de todos os ciclos"
          icon={<Wallet size={16} />}
          tone="accent"
        />
      </div>

      {/* Grid do desenho da Gestora: indicacoes a esquerda, ciclos de repasse a direita. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 items-start">
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
            Suas indicações
          </h2>
          <PartnerIndicationsTable indications={indications} />
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
            Ciclos de repasse
          </h2>
          <PartnerBillingCyclesPanel
            cycles={cycles}
            onChanged={() => setRefreshCounter((c) => c + 1)}
          />
        </section>
      </div>
    </div>
  );
}
