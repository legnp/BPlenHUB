import { describe, it, expect } from "vitest";
import { eventStartKey } from "@/lib/calendar/window";

/**
 * A fronteira de consulta a `Calendar_Events` tem de sair no MESMO formato da
 * chave `start` (offset de Brasilia), senao a comparacao lexicografica do
 * Firestore erra por horas — a mesma armadilha do BUG-093.
 */
describe("eventStartKey — fronteira de consulta no formato da chave", () => {
  it("emite offset -03:00, nao 'Z' (UTC)", () => {
    // A suite roda em TZ=UTC (producao). `new Date(...Z)` e o instante; a chave
    // tem de sair convertida para Brasilia, nao repetida em UTC.
    expect(eventStartKey(new Date("2026-07-21T20:30:00Z"))).toBe("2026-07-21T17:30:00-03:00");
  });

  it("nao usa o fuso do processo (converte o instante para Brasilia)", () => {
    // 2026-07-21T01:00:00Z ainda e 20/07 22:00 em Brasilia.
    expect(eventStartKey(new Date("2026-07-21T01:00:00Z"))).toBe("2026-07-20T22:00:00-03:00");
  });

  it("a chave gerada compara lexicograficamente com as chaves reais", () => {
    // Chave real de um evento: "2026-07-21T17:30:00-03:00". Um `now` anterior
    // tem de sair menor como string, para `where(start >= now)` incluir o evento.
    const now = eventStartKey(new Date("2026-07-21T19:00:00Z")); // 16:00 BRT
    expect(now < "2026-07-21T17:30:00-03:00").toBe(true);
    // ... e um `now` posterior, maior.
    const later = eventStartKey(new Date("2026-07-21T21:00:00Z")); // 18:00 BRT
    expect(later > "2026-07-21T17:30:00-03:00").toBe(true);
  });
});
