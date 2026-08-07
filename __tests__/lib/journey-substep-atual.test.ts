import { describe, it, expect } from "vitest";
import { resolverSubPassoAtual } from "@/lib/journey/substep-atual";
import type { SubStepConfig } from "@/types/journey";

/**
 * T-06 / Onda 3C — regra de qual sub-passo fica aberto numa etapa.
 *
 * A regra vivia dentro de um `useEffect` na pagina da etapa, guardada por uma
 * flag `isInitialized` cuja unica funcao era impedir o efeito de rodar de novo.
 * Foi extraida para funcao pura e a pagina passou a derivar o valor.
 *
 * O caso dos INSTRUMENTOS DINAMICOS e o mais importante aqui: o admin pode
 * atribuir sub-checkpoints sob medida para uma pessoa, e o `useJourney` funde
 * cada um logo apos o seu `parentId` antes de entregar a lista a tela. Estes
 * testes fixam que a atribuicao individual participa do calculo.
 */

const passo = (id: string): SubStepConfig => ({
  id,
  title: id,
  type: "survey",
  referenceId: id
});

const FIXOS = [passo("intro"), passo("checkin"), passo("devolutiva")];

describe("resolverSubPassoAtual: regra base", () => {
  it("abre no primeiro sub-passo quando nada foi concluido", () => {
    expect(resolverSubPassoAtual(FIXOS, [])).toBe("intro");
  });

  it("abre no primeiro pendente quando ha conclusoes anteriores", () => {
    expect(resolverSubPassoAtual(FIXOS, ["intro"])).toBe("checkin");
  });

  it("abre no ultimo quando tudo esta concluido", () => {
    expect(resolverSubPassoAtual(FIXOS, ["intro", "checkin", "devolutiva"])).toBe("devolutiva");
  });

  it("ignora conclusoes que nao correspondem a nenhum sub-passo", () => {
    // Registro legado ou de outra etapa nao deve deslocar a escolha.
    expect(resolverSubPassoAtual(FIXOS, ["passo-de-outra-etapa"])).toBe("intro");
  });

  it("nunca devolve identificador vazio quando existem sub-passos", () => {
    expect(resolverSubPassoAtual(FIXOS, ["intro", "checkin", "devolutiva"])).not.toBe("");
  });

  it("devolve vazio apenas quando a etapa nao tem sub-passos", () => {
    expect(resolverSubPassoAtual([], [])).toBe("");
    expect(resolverSubPassoAtual(undefined, [])).toBe("");
    expect(resolverSubPassoAtual(null, null)).toBe("");
  });
});

describe("resolverSubPassoAtual: instrumentos atribuidos individualmente", () => {
  // Como o `useJourney` entrega: o instrumento entra logo apos o seu pai.
  const COM_INSTRUMENTO = [
    passo("intro"),
    passo("checkin"),
    passo("instrumento-disc"), // atribuido pelo admin, filho de "checkin"
    passo("devolutiva")
  ];

  it("considera o instrumento atribuido no calculo do proximo pendente", () => {
    expect(resolverSubPassoAtual(COM_INSTRUMENTO, ["intro", "checkin"])).toBe("instrumento-disc");
  });

  it("respeita a posicao do instrumento logo apos o sub-passo pai", () => {
    // Com o instrumento concluido, o proximo e' o que vinha depois do pai.
    expect(
      resolverSubPassoAtual(COM_INSTRUMENTO, ["intro", "checkin", "instrumento-disc"])
    ).toBe("devolutiva");
  });

  it("nao pula o instrumento quando ele e' o unico pendente", () => {
    expect(
      resolverSubPassoAtual(COM_INSTRUMENTO, ["intro", "checkin", "devolutiva"])
    ).toBe("instrumento-disc");
  });

  it("um instrumento novo passa a ser o pendente quando o resto ja terminou", () => {
    // Cenario: pessoa concluiu a etapa inteira; admin atribui um instrumento.
    const concluidosAntes = ["intro", "checkin", "devolutiva"];
    const antes = [passo("intro"), passo("checkin"), passo("devolutiva")];
    expect(resolverSubPassoAtual(antes, concluidosAntes)).toBe("devolutiva");

    const depois = [...antes, passo("instrumento-novo")];
    expect(resolverSubPassoAtual(depois, concluidosAntes)).toBe("instrumento-novo");
  });
});
