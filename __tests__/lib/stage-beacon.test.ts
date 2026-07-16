import { describe, it, expect } from "vitest";
import { resolveStageBeacon, type StageBeaconInput } from "@/lib/journey/stage-beacon";

const base: StageBeaconInput = {
  status: "current",
  percentage: 0,
  hasAccess: true,
  isNext: false,
  isSequenceLocked: false,
  isCurrent: false
};
const beacon = (patch: Partial<StageBeaconInput>) => resolveStageBeacon({ ...base, ...patch }).status;

describe("resolveStageBeacon — rotulo do farol da jornada", () => {
  it("a trava de sequencia vence o progresso (BUG-076/Fase C)", () => {
    // Regressao: o progresso era avaliado ANTES da trava, entao o MentoCoach —
    // travado, mas com 33% das paradas de Analise que ele compartilha — aparecia
    // como "Foco Atual". A trava e' a verdade; o progresso nao a mascara.
    expect(beacon({ hasAccess: true, isSequenceLocked: true, percentage: 33 }))
      .toBe("Aguardando Fase Anterior");
  });

  it("etapa acessivel que nao e' a proxima da fila e' 'Disponivel', nao 'Nao Liberado'", () => {
    // Regressao: caia no default e mentia — era o caso do Posicionamento, que
    // esta liberado e clicavel mas exibia "Nao Liberado".
    expect(beacon({ hasAccess: true, isNext: false, percentage: 0 })).toBe("Disponível");
  });

  it("concluida vence tudo, inclusive a trava", () => {
    expect(beacon({ status: "completed", isSequenceLocked: true, percentage: 100 }))
      .toBe("Concluído");
  });

  it("etapa aberta na tela e' o foco atual", () => {
    expect(beacon({ isCurrent: true })).toBe("Foco Atual");
  });

  it("progresso sem trava e' foco atual", () => {
    expect(beacon({ percentage: 20, isSequenceLocked: false })).toBe("Foco Atual");
  });

  it("acessivel e proxima da fila e' o proximo passo", () => {
    expect(beacon({ hasAccess: true, isNext: true })).toBe("Próximo Passo");
  });

  it("sem acesso, mas proxima da fila: aguardando liberacao do admin", () => {
    expect(beacon({ hasAccess: false, isNext: true })).toBe("Bloqueado Admin");
  });

  it("sem acesso e fora da fila: nao liberado", () => {
    expect(beacon({ hasAccess: false, isNext: false })).toBe("Não Liberado");
  });

  it("travada SEM possuir o servico nao vira 'Aguardando Fase Anterior'", () => {
    // Discriminante: a trava so e' exibida para quem POSSUI o servico. Quem nao
    // possui deve ver o caminho de oferta/admin, nao um rotulo de sequencia.
    expect(beacon({ hasAccess: false, isSequenceLocked: true, isNext: false }))
      .toBe("Não Liberado");
  });
});
