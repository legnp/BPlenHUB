import { describe, it, expect } from "vitest";
import { computeCadenceDays, forecastActivityDates, ForecastInput } from "@/lib/journey/activity-forecast";

/**
 * `BUG-111` — "data prevista" na Visao Geral, estimada pelo ritmo do proprio membro.
 * Logica pura testada aqui; a UI so consome o resultado e rotula estimativa como
 * "previsao". `now` entra por parametro para determinismo.
 */

const NOW = new Date("2026-03-01T12:00:00.000Z");

describe("computeCadenceDays", () => {
  it("sem historico suficiente (< 2 conclusoes) usa o fallback de 10 dias", () => {
    expect(computeCadenceDays([])).toBe(10);
    expect(computeCadenceDays(["2026-02-01"])).toBe(10);
  });

  it("com historico usa a media de dias entre conclusoes", () => {
    // 3 conclusoes espacadas 20 dias => media 20
    expect(computeCadenceDays(["2026-01-01", "2026-01-21", "2026-02-10"])).toBe(20);
  });

  it("aplica clamp de sanidade (min 3, max 45)", () => {
    // 2 conclusoes no mesmo dia => 0, sobe para o minimo 3
    expect(computeCadenceDays(["2026-01-01", "2026-01-01"])).toBe(3);
    // 2 conclusoes 100 dias apart => cai para o maximo 45
    expect(computeCadenceDays(["2026-01-01", "2026-04-11"])).toBe(45);
  });
});

describe("forecastActivityDates", () => {
  const base: ForecastInput[] = [
    { id: "c1", order: 1, completed: true, completionDate: "2026-02-01T00:00:00.000Z" },
    { id: "c2", order: 2, completed: true, completionDate: "2026-02-21T00:00:00.000Z" }, // cadencia 20d
    { id: "p1", order: 3, completed: false },
    { id: "p2", order: 4, completed: false },
  ];

  it("itens concluidos NAO entram no mapa (a UI ja mostra a conclusao real)", () => {
    const out = forecastActivityDates(base, NOW);
    expect(out.has("c1")).toBe(false);
    expect(out.has("c2")).toBe(false);
  });

  it("estimativas crescem pela cadencia, ancoradas na ultima conclusao (nunca no passado)", () => {
    const out = forecastActivityDates(base, NOW);
    // ancora = max(2026-02-21, now 2026-03-01) = 2026-03-01; cadencia 20d
    // p1 = +20d => 2026-03-21 ; p2 = +40d => 2026-04-10
    expect(out.get("p1")).toEqual({ plannedDate: "2026-03-21", plannedKind: "estimate" });
    expect(out.get("p2")).toEqual({ plannedDate: "2026-04-10", plannedKind: "estimate" });
  });

  it("usa a data REAL (reuniao agendada) e marca como nao-estimada", () => {
    const items: ForecastInput[] = [
      ...base.slice(0, 2),
      { id: "p1", order: 3, completed: false, realDate: "2026-03-10T14:00:00.000Z", realKind: "agendado" },
      { id: "p2", order: 4, completed: false },
    ];
    const out = forecastActivityDates(items, NOW);
    expect(out.get("p1")).toEqual({ plannedDate: "2026-03-10", plannedKind: "agendado" });
    // p2 ocupa o 2o slot => ancora + 2*20d = 2026-04-10
    expect(out.get("p2")).toEqual({ plannedDate: "2026-04-10", plannedKind: "estimate" });
  });

  it("usa a targetDate de uma meta como data real (kind 'meta')", () => {
    const items: ForecastInput[] = [
      ...base.slice(0, 2),
      { id: "obj", order: 5, completed: false, realDate: "2026-05-01", realKind: "meta" },
    ];
    const out = forecastActivityDates(items, NOW);
    expect(out.get("obj")).toEqual({ plannedDate: "2026-05-01", plannedKind: "meta" });
  });

  it("sem nenhuma conclusao, ancora em `now` e usa cadencia fallback (10d)", () => {
    const items: ForecastInput[] = [
      { id: "p1", order: 1, completed: false },
      { id: "p2", order: 2, completed: false },
    ];
    const out = forecastActivityDates(items, NOW);
    // now 2026-03-01 + 10d = 03-11 ; + 20d = 03-21
    expect(out.get("p1")?.plannedDate).toBe("2026-03-11");
    expect(out.get("p2")?.plannedDate).toBe("2026-03-21");
  });
});
