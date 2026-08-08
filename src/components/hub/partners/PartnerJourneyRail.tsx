"use client";

import React from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { resolveStageBeacon } from "@/lib/journey/stage-beacon";
import { cn } from "@/lib/utils";

/**
 * Trilha compacta da Jornada de Parceria — porta de entrada da area.
 *
 * Por que existe em vez de reusar o `JourneyNav`: aquele navegador foi desenhado para
 * a jornada de membro, que tem ate 8 etapas e cartoes de servico por tras de cada uma
 * (upsell, foto de capa, workflow de entrega). A jornada de parceria tem 3 paradas e
 * nenhuma venda; o ladrilho de 64px, o rotulo em duas linhas e o modal de detalhe
 * ficam desproporcionais numa home que precisa caber acima da dobra. Aqui o objetivo
 * e' so responder "onde eu parei" e levar para la.
 *
 * O que NAO foi duplicado, de proposito: a regra do farol vem de `resolveStageBeacon`,
 * a mesma funcao pura e testada que o `JourneyNav` usa. Cor de status divergir entre a
 * home e a jornada seria a pior forma de inconsistencia — a mesma etapa contando duas
 * historias na mesma sessao.
 *
 * Etapa sem acesso ou travada pela sequencia nao navega: o clique morre aqui e a
 * explicacao (modal de trava) vive na propria jornada, que e' quem tem o contexto.
 */

/** Fallback quando a etapa nao declara icone ou declara um nome inexistente. */
const ICONE_PADRAO: LucideIcon = LucideIcons.Circle;

function resolverIcone(nome: string | undefined): LucideIcon {
  if (!nome) return ICONE_PADRAO;
  const candidato = LucideIcons[nome as keyof typeof LucideIcons];
  return typeof candidato === "function" ? (candidato as LucideIcon) : ICONE_PADRAO;
}

export function PartnerJourneyRail() {
  const { user } = useAuthContext();
  const { stages, progress, getStageTelemetry } = useJourney(user?.uid || "guest", "partner");

  const etapaAtivaId = progress?.lastActiveStepId || stages[0]?.id || "";

  // Sem memoizacao de proposito: `getStageTelemetry` e' recriada a cada render do hook,
  // entao memoizar exigiria ou suprimir o `exhaustive-deps` (o projeto zerou esse debito
  // sem nenhuma supressao — ver regra 5 do CLAUDE.md) ou listar uma dependencia que muda
  // sempre, o que anula o memo. Com 3 paradas o calculo e' irrelevante.
  const telemetrias = stages.map((stage) => ({ stage, telemetry: getStageTelemetry(stage.id) }));

  // Renderizacao progressiva: enquanto a jornada nao chega, a secao simplesmente nao
  // ocupa espaco (mesmo criterio do `MemberJourneyHero`).
  if (stages.length === 0) return null;

  const concluidas = telemetrias.filter(({ telemetry }) => telemetry.status === "completed").length;
  const indiceAtivo = stages.findIndex((s) => s.id === etapaAtivaId);
  const temTrilho = stages.length > 1;
  const larguraPercorrida = temTrilho
    ? (Math.max(0, indiceAtivo) / (stages.length - 1)) * 100
    : 0;

  return (
    <section id="partner-home-jornada" aria-label="Jornada de Parceria">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Jornada de Parceria
        </span>
        <span className="text-[11px] font-black text-[var(--text-secondary)] tabular-nums">
          {concluidas} de {stages.length} {concluidas === 1 ? "concluída" : "concluídas"}
        </span>
      </div>

      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {temTrilho ? (
          <>
            <div className="absolute top-[30px] left-[12%] right-[12%] h-[1.5px] bg-[var(--border-primary)]" />
            <div
              className="absolute top-[30px] left-[12%] h-[1.5px] bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] transition-[width] duration-700"
              style={{ width: `calc((100% - 24%) * ${larguraPercorrida / 100})` }}
            />
          </>
        ) : null}

        {telemetrias.map(({ stage, telemetry }) => {
          const isAtual = stage.id === etapaAtivaId;
          const travada = !telemetry.hasAccess || telemetry.isSequenceLocked;
          const concluida = telemetry.status === "completed";
          const beacon = resolveStageBeacon({
            status: telemetry.status,
            percentage: telemetry.percentage,
            hasAccess: telemetry.hasAccess,
            isNext: telemetry.isNext,
            isSequenceLocked: telemetry.isSequenceLocked,
            isCurrent: isAtual,
          });

          const Icone = resolverIcone(stage.icon);
          const ordem = (stage.order ?? 0).toString().padStart(2, "0");

          const conteudo = (
            <>
              <span className={cn("w-[7px] h-[7px] rounded-full shrink-0", beacon.color)} aria-hidden="true" />

              <span
                className={cn(
                  "w-[46px] h-[46px] rounded-[15px] flex items-center justify-center border transition-all duration-300",
                  isAtual
                    ? "border-[var(--accent-start)] bg-[var(--accent-soft)] text-[var(--accent-start)]"
                    : travada
                      ? "border-[var(--border-primary)] bg-[var(--input-bg)] text-[var(--text-muted)] opacity-60"
                      : "border-[var(--border-primary)] bg-[var(--input-bg)] text-[var(--text-muted)] group-hover:border-[var(--accent-start)]/40 group-hover:text-[var(--accent-start)]"
                )}
              >
                {travada ? (
                  <LucideIcons.Lock size={17} aria-hidden="true" />
                ) : (
                  <Icone
                    size={19}
                    className={concluida ? "text-emerald-500" : undefined}
                    aria-hidden="true"
                  />
                )}
              </span>

              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-[0.18em] text-center leading-[1.5] max-w-[15ch]",
                  isAtual ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}
              >
                {ordem} · {stage.title}
              </span>

              <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                {telemetry.substepsLabel}
              </span>
            </>
          );

          const classesStop = "relative z-10 flex flex-col items-center gap-2 group";

          if (travada) {
            return (
              <div
                key={stage.id}
                className={cn(classesStop, "cursor-default")}
                title={beacon.status}
                aria-disabled="true"
              >
                {conteudo}
              </div>
            );
          }

          return (
            <Link
              key={stage.id}
              href={`/hub/partners/journey/${stage.id}`}
              className={classesStop}
              aria-label={`${stage.title} — ${beacon.status}`}
            >
              {conteudo}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
