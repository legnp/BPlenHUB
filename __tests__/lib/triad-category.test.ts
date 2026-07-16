import { describe, it, expect } from "vitest";
import { resolveTriadCategory, findTriadPercentage } from "@/lib/charts/triad-category";

/** Rotulos como a tela do MEMBRO os passa (com acento — copy correta, Licao 11). */
const DADOS_MEMBRO = [
  { label: "Importância", percentage: 41 },
  { label: "Urgência", percentage: 29 },
  { label: "Circunstância", percentage: 29 },
];

/** Rotulos como a tela do ADMIN os passa (sem acento) — por isso ela funcionava. */
const DADOS_ADMIN = [
  { label: "Importancia", percentage: 41 },
  { label: "Urgencia", percentage: 29 },
  { label: "Circunstancia", percentage: 29 },
];

describe("resolveTriadCategory — casamento tolerante a acento (BUG-082)", () => {
  it("resolve o rotulo ACENTUADO do membro", () => {
    // Regressao: `"importância".includes("importan")` e' FALSE — o `â` quebra a
    // substring. O grafico devolvia 0% para 41%.
    expect(resolveTriadCategory("Importância")).toBe("importante");
    expect(resolveTriadCategory("Urgência")).toBe("urgente");
    expect(resolveTriadCategory("Circunstância")).toBe("circunstancial");
  });

  it("resolve o rotulo SEM acento do admin", () => {
    expect(resolveTriadCategory("Importancia")).toBe("importante");
    expect(resolveTriadCategory("Urgencia")).toBe("urgente");
    expect(resolveTriadCategory("Circunstancia")).toBe("circunstancial");
  });

  it("resolve o rotulo canonico do proprio circulo", () => {
    expect(resolveTriadCategory("Importante")).toBe("importante");
    expect(resolveTriadCategory("Urgente")).toBe("urgente");
    expect(resolveTriadCategory("Circunstancial")).toBe("circunstancial");
  });

  it("rotulo fora da triade devolve null, nao cai no 'circunstancial'", () => {
    // Discriminante: o `else` do codigo antigo transformava QUALQUER rotulo nao
    // reconhecido em "circunstancial" — foi assim que quem tinha "Importância"
    // no topo recebeu o diagnostico de "Atencao ao Desperdicio".
    expect(resolveTriadCategory("Visual")).toBeNull();
    expect(resolveTriadCategory("")).toBeNull();
  });
});

describe("findTriadPercentage — o grafico le o valor certo", () => {
  it("dados do MEMBRO devolvem os percentuais reais, nao 0%", () => {
    // O print do bug: 0% / 0% / 29% para um usuario com 41% / 29% / 29%.
    expect(findTriadPercentage(DADOS_MEMBRO, "importante")).toBe(41);
    expect(findTriadPercentage(DADOS_MEMBRO, "urgente")).toBe(29);
    expect(findTriadPercentage(DADOS_MEMBRO, "circunstancial")).toBe(29);
  });

  it("dados do ADMIN seguem funcionando (sem regressao)", () => {
    expect(findTriadPercentage(DADOS_ADMIN, "importante")).toBe(41);
    expect(findTriadPercentage(DADOS_ADMIN, "urgente")).toBe(29);
    expect(findTriadPercentage(DADOS_ADMIN, "circunstancial")).toBe(29);
  });

  it("as duas telas devolvem o MESMO valor para o mesmo membro", () => {
    for (const cat of ["importante", "urgente", "circunstancial"] as const) {
      expect(findTriadPercentage(DADOS_MEMBRO, cat)).toBe(findTriadPercentage(DADOS_ADMIN, cat));
    }
  });

  it("categoria ausente devolve 0", () => {
    expect(findTriadPercentage([{ label: "Urgência", percentage: 29 }], "importante")).toBe(0);
  });

  it("conjunto vazio devolve 0", () => {
    expect(findTriadPercentage([], "importante")).toBe(0);
  });
});

describe("diagnostico — o topo real e' identificado", () => {
  it("topo 'Importância' resolve para importante (nao para circunstancial)", () => {
    const top = [...DADOS_MEMBRO].sort((a, b) => b.percentage - a.percentage)[0];
    expect(top.label).toBe("Importância");
    // Regressao: caia no `else` -> "Atencao ao Desperdicio" para quem teve o
    // MELHOR resultado da triade.
    expect(resolveTriadCategory(top.label)).toBe("importante");
  });
});
