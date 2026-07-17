import { describe, it, expect } from "vitest";
import { getWeekBounds, resolveSyncFreshness } from "@/lib/admin/dashboard";

/**
 * O dashboard do admin exibia duas ficcoes (F1-06, lote A): o status de sync era
 * string fixa (`BUG-091`) e a metrica "desta semana" nao filtrava data nenhuma
 * (`BUG-092`). Estes testes cobrem a logica que substitui as duas.
 */

describe("getWeekBounds — semana ISO no fuso de Brasilia", () => {
  it("gera a fronteira no MESMO formato da chave de Calendar_Events", () => {
    // A comparacao no Firestore e lexicografica: se a fronteira sair como "...Z"
    // e o dado estiver como "...-03:00", a consulta erra por 3 horas.
    const { startKey, endKey } = getWeekBounds(new Date("2026-07-17T02:00:00Z"));
    expect(startKey).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
    expect(endKey).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
  });

  it("a semana comeca na segunda 00:00 e termina no domingo 23:59, hora de Brasilia", () => {
    // Sexta, 17/07/2026. A semana ISO vai de 13/07 (seg) a 19/07 (dom).
    const { startKey, endKey } = getWeekBounds(new Date("2026-07-17T15:00:00Z"));
    expect(startKey).toBe("2026-07-13T00:00:00-03:00");
    expect(endKey).toBe("2026-07-19T23:59:59-03:00");
  });

  it("nao escorrega para a semana anterior no domingo a noite (servidor em UTC)", () => {
    // Regressao do erro que o calculo ingenuo cometeria: 20/07 00:30 UTC ainda e
    // domingo 19/07 21:30 em Brasilia -> semana de 13/07, nao a de 20/07.
    const { startKey } = getWeekBounds(new Date("2026-07-20T00:30:00Z"));
    expect(startKey).toBe("2026-07-13T00:00:00-03:00");
  });

  it("vira a semana na segunda de manha, hora de Brasilia", () => {
    // 20/07 12:00 UTC = segunda 09:00 BRT -> ja e a semana de 20/07.
    const { startKey } = getWeekBounds(new Date("2026-07-20T12:00:00Z"));
    expect(startKey).toBe("2026-07-20T00:00:00-03:00");
  });
});

describe("resolveSyncFreshness — o indicador precisa poder dizer 'nao'", () => {
  const now = new Date("2026-07-17T12:00:00Z");

  it("nunca sincronizada nao vira 'ok' otimista (BUG-091)", () => {
    // Regressao: o card dizia "sincronizacao ok" como string fixa, inclusive
    // durante o apagao de cota.
    expect(resolveSyncFreshness(null, now).tone).toBe("stale");
    expect(resolveSyncFreshness(undefined, now).tone).toBe("stale");
    expect(resolveSyncFreshness(null, now).detail).toBe("nunca sincronizada");
  });

  it("data invalida tambem nao vira 'ok'", () => {
    expect(resolveSyncFreshness("nao-e-data", now).tone).toBe("stale");
  });

  it("minutos e horas contam como sincronizada", () => {
    expect(resolveSyncFreshness("2026-07-17T11:30:00Z", now)).toMatchObject({ tone: "ok", detail: "há 30 min" });
    expect(resolveSyncFreshness("2026-07-17T10:00:00Z", now)).toMatchObject({ tone: "ok", detail: "há 2h" });
    expect(resolveSyncFreshness("2026-07-17T11:59:30Z", now)).toMatchObject({ tone: "ok", detail: "agora" });
  });

  it("entre 1 e 7 dias vira aviso, nao erro", () => {
    expect(resolveSyncFreshness("2026-07-16T11:00:00Z", now)).toMatchObject({ tone: "warn", detail: "há 1 dia" });
    expect(resolveSyncFreshness("2026-07-14T11:00:00Z", now)).toMatchObject({ tone: "warn", detail: "há 3 dias" });
  });

  it("acima de 7 dias vira estado critico", () => {
    expect(resolveSyncFreshness("2026-07-01T12:00:00Z", now).tone).toBe("stale");
  });

  it("fronteira de 24h: 23h ainda e ok, 24h ja e aviso", () => {
    expect(resolveSyncFreshness("2026-07-16T13:00:00Z", now).tone).toBe("ok");
    expect(resolveSyncFreshness("2026-07-16T12:00:00Z", now).tone).toBe("warn");
  });

  it("relogio adiantado nao produz 'há -3 horas'", () => {
    expect(resolveSyncFreshness("2026-07-17T15:00:00Z", now)).toMatchObject({ tone: "ok", detail: "agora" });
  });
});
