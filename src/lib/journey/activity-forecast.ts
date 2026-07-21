/**
 * BPlen HUB — Previsao de datas da jornada (Visao Geral, BUG-111)
 *
 * Estima uma "data prevista" para as atividades ainda nao concluidas, para permitir
 * ordenacao por data nas colunas Proximas / Em Foco.
 *
 * Principio (decisao da Gestora): a estimativa e baseada no **ritmo do proprio
 * membro** — a cadencia media com que ele concluiu as etapas anteriores. Onde ha
 * data REAL (reuniao agendada, ou `targetDate` de uma meta) ela e usada e a
 * atividade e marcada como nao-estimada. As datas estimadas sao explicitamente
 * rotuladas como "previsao" na UI e podem mudar — nunca sao um compromisso.
 *
 * Logica pura, sem dependencia de React/Firestore, para ser testavel (e o `now`
 * entra por parametro para determinismo nos testes).
 */

export interface ForecastInput {
  id: string;
  /** Posicao na sequencia da jornada (stageOrder desempatado pelo indice). Menor = antes. */
  order: number;
  completed: boolean;
  /** ISO — data de conclusao dos itens ja concluidos. */
  completionDate?: string;
  /** Data REAL quando existe: `start` da reuniao agendada ou `targetDate` da meta. */
  realDate?: string;
  realKind?: "agendado" | "meta";
}

export interface ForecastOutput {
  /** YYYY-MM-DD. */
  plannedDate: string;
  plannedKind: "estimate" | "agendado" | "meta";
}

const DAY_MS = 86_400_000;
const DEFAULT_CADENCE_DAYS = 10; // fallback quando nao ha historico suficiente (< 2 conclusoes)
const MIN_CADENCE_DAYS = 3;
const MAX_CADENCE_DAYS = 45;

/** Cadencia media (dias/etapa) a partir das datas de conclusao, com clamp de sanidade. */
export function computeCadenceDays(completionDates: string[]): number {
  const times = completionDates
    .map((d) => Date.parse(d))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (times.length < 2) return DEFAULT_CADENCE_DAYS;
  const avg = (times[times.length - 1] - times[0]) / (times.length - 1) / DAY_MS;
  return Math.min(MAX_CADENCE_DAYS, Math.max(MIN_CADENCE_DAYS, Math.round(avg)));
}

function toDateOnly(input: string | number): string | null {
  const t = typeof input === "number" ? input : Date.parse(input);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * Retorna, por id, a data prevista das atividades NAO concluidas. Itens concluidos
 * nao entram no mapa (a UI ja mostra a data de conclusao real deles).
 */
export function forecastActivityDates(items: ForecastInput[], now: Date): Map<string, ForecastOutput> {
  const out = new Map<string, ForecastOutput>();

  const completedTimes = items
    .filter((i) => i.completed && i.completionDate)
    .map((i) => Date.parse(i.completionDate as string))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  const cadence = computeCadenceDays(
    items.filter((i) => i.completed && i.completionDate).map((i) => i.completionDate as string)
  );

  // Ancora: a conclusao mais recente, mas nunca no passado (nao se preve uma etapa
  // futura para uma data ja vencida).
  const lastCompletion = completedTimes.length ? completedTimes[completedTimes.length - 1] : now.getTime();
  const anchor = Math.max(lastCompletion, now.getTime());

  // Nao concluidos, na ordem da jornada. Cada item ocupa um "slot"; os que tem data
  // real usam a real, os demais recebem ancora + slot * cadencia.
  const pending = items.filter((i) => !i.completed).sort((a, b) => a.order - b.order);
  let step = 0;
  for (const it of pending) {
    step += 1;
    if (it.realDate) {
      const real = toDateOnly(it.realDate);
      if (real) {
        out.set(it.id, { plannedDate: real, plannedKind: it.realKind ?? "agendado" });
        continue;
      }
    }
    const estimated = toDateOnly(anchor + step * cadence * DAY_MS);
    if (estimated) {
      out.set(it.id, { plannedDate: estimated, plannedKind: "estimate" });
    }
  }

  return out;
}
