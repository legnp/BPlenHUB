"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Handshake, Megaphone, Users, Wallet } from "lucide-react";
import { parseISO, isAfter, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatTile } from "@/components/admin/StatTile";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { PartnerJourneyNav } from "@/components/hub/partners/PartnerJourneyNav";
import { useAuthContext } from "@/context/AuthContext";
import { getPartnerIndicationsAction, PartnerIndication } from "@/actions/partners/referrals";
import { getPartnerCyclesAction, PartnerBillingCycle } from "@/actions/partners/billing-cycles";
import { getUserBookingsAction } from "@/actions/calendar";
import { UserBooking } from "@/types/calendar";
import { PARTNER_CYCLE_STATUS_LABEL } from "@/lib/partners/cycle-status";
import { BPLEN_NOMENCLATURE } from "@/config/nomenclature";
import { maskInternalContact } from "@/lib/identity-mask";

/**
 * Home do Parceiro — porta de entrada da area.
 *
 * Estrutura: trilha da jornada no topo (onde parei), o ciclo que pede acao, as metricas
 * da parceria, e as duas frentes com previa do proprio conteudo. O atalho em cartao para
 * a Jornada saiu porque a trilha e' um atalho melhor — ela leva para la E diz o estado.
 *
 * O dado vem projetado do servidor pelas mesmas actions das telas internas — nenhuma
 * leitura nova, nenhuma regra duplicada.
 */

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/**
 * `dataIndicacao` chega em ISO. Sem formatar, a home mostraria o carimbo cru — a tabela
 * de indicacoes ja resolve isso do mesmo jeito (`shortDate`), com o mesmo fallback para
 * data ausente ou invalida.
 */
function dataCurta(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
}

/** Titulo do compromisso, com o fallback que o proprio tipo preve para agendamentos legados. */
function tituloDaSessao(booking: UserBooking): string {
  return booking.eventSummary || booking.eventDetail?.summary || "Sessão de parceria";
}

/**
 * Consultor da sessao. Passa pela mascara de exibicao porque `mentor` e' campo legado e
 * pode carregar e-mail interno em base antiga (regra 7 do CLAUDE.md). O rotulo visivel e'
 * "Consultor" — "Orientador"/"mentor" e' nomenclatura antiga, ver BUG-098.
 */
function consultorDaSessao(booking: UserBooking): string | null {
  const bruto = booking.eventDetail?.mentor;
  if (!bruto) return null;
  const limpo = maskInternalContact(bruto).trim();
  return limpo.length > 0 ? limpo : null;
}

export function PartnerHomeView({ nickname }: { nickname?: string | null }) {
  const { matricula } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [indications, setIndications] = useState<PartnerIndication[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [cycles, setCycles] = useState<PartnerBillingCycle[]>([]);
  const [bookings, setBookings] = useState<UserBooking[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getPartnerIndicationsAction(), getPartnerCyclesAction()])
      .then(([indicacoes, ciclos]) => {
        if (!active) return;
        setIndications(indicacoes.indications);
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

  // Agenda vem separada: depende da matricula, que chega pelo contexto de autenticacao e
  // nao no mesmo instante. Falha aqui nao derruba a home — a secao mostra o estado vazio.
  useEffect(() => {
    if (!matricula) return;
    let active = true;
    getUserBookingsAction(matricula)
      .then((lista) => {
        if (active) setBookings(lista);
      })
      .catch((error) => console.error("Erro ao carregar a agenda do parceiro:", error));
    return () => {
      active = false;
    };
  }, [matricula]);

  if (loading) {
    return <AtmosphericLoading label={`Carregando ${BPLEN_NOMENCLATURE.navigation.partner_area}...`} />;
  }

  // O ciclo que pede acao do parceiro vem primeiro; ele e' o unico que exige algo dele.
  const cicloPendente = cycles.find((c) => c.status === "emita_recibo");
  const emAberto = cycles.filter((c) => c.status !== "concluido" && c.status !== "nenhuma_indicacao");

  // Duas sessoes, so: a ultima realizada e a proxima agendada. Agendamento sem
  // `eventDetail` e' orfao (o evento sumiu da agenda) — inerte e fora da previa.
  const agora = new Date();
  const comData = bookings.filter((b) => !!b.eventDetail?.start);
  const futuras = comData
    .filter((b) => isAfter(parseISO(b.eventDetail!.start), agora))
    .sort((a, b) => parseISO(a.eventDetail!.start).getTime() - parseISO(b.eventDetail!.start).getTime());
  const passadas = comData
    .filter((b) => !isAfter(parseISO(b.eventDetail!.start), agora))
    .sort((a, b) => parseISO(b.eventDetail!.start).getTime() - parseISO(a.eventDetail!.start).getTime());

  const proxima = futuras[0] ?? null;
  const ultima = passadas[0] ?? null;

  const indicacoesRecentes = [...indications]
    .sort((a, b) => (b.dataIndicacao || "").localeCompare(a.dataIndicacao || ""))
    .slice(0, 3);

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
          Sua parceria está ativa. Abaixo, onde você parou e o que pede atenção.
        </p>
      </section>

      <PartnerJourneyNav />

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

      {/* Tres colunas: metricas empilhadas, gestao (o miolo, por isso quase o dobro de
          largura) e o espaco de comunicacao. Colapsa para uma coluna abaixo de `lg`. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.75fr)_minmax(0,1fr)] gap-10">
        <div id="partner-home-metricas" className="space-y-5">
          <ColunaTitulo texto="Métricas gerais" />

          <div className="space-y-4">
            <StatTile
              label="Indicações registradas"
              value={indications.length}
              icon={<Users size={16} />}
              tone="accent"
            />
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
        </div>

        <div className="space-y-5">
          <ColunaTitulo texto="Gestão" />

          <section id="partner-home-indicacoes" className="space-y-5">
            <SecaoHeader
              icon={<Users size={20} />}
              title="Gestão de Indicações"
              href="/hub/partners/gestao_indicacoes"
            />

            <div className="space-y-3">
              {indicacoesRecentes.length > 0 ? (
                indicacoesRecentes.map((indicacao) => (
                  <LinhaIndicacao key={indicacao.referredMatricula} indicacao={indicacao} />
                ))
              ) : (
                <EstadoVazio texto="Nenhuma indicação registrada ainda" />
              )}
            </div>
          </section>

          <section id="partner-home-agenda" className="space-y-5 pt-3">
            <SecaoHeader
              icon={<CalendarDays size={20} />}
              title="Gestão de Agenda"
              href="/hub/partners/gestao_agenda"
            />

            <div className="space-y-3">
              {proxima ? (
                <LinhaSessao booking={proxima} rotulo="Próxima sessão" destaque />
              ) : null}
              {ultima ? <LinhaSessao booking={ultima} rotulo="Última realizada" /> : null}
              {!proxima && !ultima ? (
                <EstadoVazio texto="Suas sessões de parceria aparecerão aqui" />
              ) : null}
            </div>
          </section>
        </div>

        {/* Comunicacao — espaco reservado. Sem fonte de dado ainda: a rotina de
            comunicados da BPlen entra aqui numa proxima etapa. Fica visivel e vazio de
            proposito, para a coluna existir no layout desde ja. */}
        <div id="partner-home-comunicacao" className="space-y-5">
          <ColunaTitulo texto="Comunicação" />

          <section className="space-y-5">
            <SecaoHeader icon={<Megaphone size={20} />} title="Comunicados" />

            <div className="space-y-3">
              <EstadoVazio texto="Os comunicados da BPlen aparecerão aqui" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Rotulo da coluna do grid. Micro-label, nao titulo — a coluna Gestao ja carrega dois
 *  cabecalhos de secao por dentro, e um terceiro nivel grande pesaria a leitura. */
function ColunaTitulo({ texto }: { texto: string }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
      {texto}
    </p>
  );
}

/** `href` e' opcional: a secao de Comunicados ainda nao tem destino para "ver tudo". */
function SecaoHeader({ icon, title, href }: { icon: React.ReactNode; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-4">
      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
        <span className="text-[var(--accent-start)]">{icon}</span>
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 group shrink-0"
        >
          Ver tudo
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : null}
    </div>
  );
}

function LinhaSessao({
  booking,
  rotulo,
  destaque = false,
}: {
  booking: UserBooking;
  rotulo: string;
  destaque?: boolean;
}) {
  const inicio = parseISO(booking.eventDetail!.start);
  const consultor = consultorDaSessao(booking);
  const concluida = booking.eventLifecycleStatus === "completed";

  return (
    <div className="p-4 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--input-border)] flex items-start justify-between gap-4">
      <div className="min-w-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
          {rotulo} · {format(inicio, "EEE, dd MMM 'às' HH'h'mm", { locale: ptBR })}
        </span>
        <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
          {tituloDaSessao(booking)}
        </p>
        {consultor ? (
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Consultor: {consultor}</p>
        ) : null}
      </div>
      <span
        className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${
          destaque
            ? "bg-[var(--accent-soft)] text-[var(--accent-start)]"
            : concluida
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-[var(--input-bg)] text-[var(--text-muted)]"
        }`}
      >
        {destaque ? "Agendada" : concluida ? "Concluída" : "Realizada"}
      </span>
    </div>
  );
}

function LinhaIndicacao({ indicacao }: { indicacao: PartnerIndication }) {
  const servico = indicacao.services[0];
  const descricao = servico
    ? `${servico.productTitle} · repasse de ${money(indicacao.totalCommission)}`
    : "Ainda sem serviço adquirido";

  return (
    <div className="p-4 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--input-border)] flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
          Indicado em {dataCurta(indicacao.dataIndicacao)}
        </span>
        <p className="text-sm font-bold text-[var(--text-primary)] leading-snug truncate">
          {indicacao.referredNome}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">{descricao}</p>
        <div
          className="h-[3px] rounded-full bg-[var(--border-primary)] mt-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={indicacao.journeyProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso da jornada de ${indicacao.referredNome}`}
        >
          <span
            className="block h-full bg-[var(--accent-start)] rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, indicacao.journeyProgress))}%` }}
          />
        </div>
      </div>
      <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 bg-[var(--input-bg)] text-[var(--text-muted)]">
        {indicacao.journeyStatus}
      </span>
    </div>
  );
}

function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="py-8 px-6 border border-dashed border-[var(--border-primary)] rounded-[2rem] text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40">
        {texto}
      </p>
    </div>
  );
}
