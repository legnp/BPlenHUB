import { describe, it, expect } from "vitest";
import {
  majorOrderOf,
  nextDynamicSubstepOrder,
  FALLBACK_MAJOR_ORDER,
} from "@/lib/journey/dynamic-substep-order";

/**
 * Ordem dos instrumentos modulares (subcheckpoints dinamicos). O invariante e um so:
 * a ordem gerada tem que cair na MESMA parada do checkpoint pai quando lida pelo
 * `SubStepRail` (`String(order).split(".")[0]`), e nunca produzir `NaN` no comparador.
 * Regressao do BUG-117, que gravava o id do pai concatenado no lugar do decimal.
 */

describe("majorOrderOf — parada a que o checkpoint pertence", () => {
  it("le a parte inteira de ordens simples e decimais", () => {
    expect(majorOrderOf("5")).toBe("5");
    expect(majorOrderOf("5.2")).toBe("5");
    expect(majorOrderOf("12.10")).toBe("12");
  });

  it("cai no bucket padrao quando nao ha ordem", () => {
    expect(majorOrderOf(undefined)).toBe(FALLBACK_MAJOR_ORDER);
    expect(majorOrderOf(null)).toBe(FALLBACK_MAJOR_ORDER);
    expect(majorOrderOf("")).toBe(FALLBACK_MAJOR_ORDER);
  });

  it("cai no bucket padrao quando a ordem nao e numerica (dado legado do BUG-117)", () => {
    expect(majorOrderOf("ss-srv-gestao_tempo-sub-1")).toBe(FALLBACK_MAJOR_ORDER);
  });
});

describe("nextDynamicSubstepOrder — proxima vaga sob o checkpoint pai", () => {
  it("primeiro instrumento do pai vira o decimal 1", () => {
    expect(nextDynamicSubstepOrder("5", ["1", "2", "3", "4", "5"])).toBe("5.1");
  });

  it("instrumento seguinte nao colide com o que ja existe no mesmo pai", () => {
    expect(nextDynamicSubstepOrder("5", ["5", "5.1"])).toBe("5.2");
    expect(nextDynamicSubstepOrder("5", ["5", "5.1", "5.2"])).toBe("5.3");
  });

  it("passa de 9 sem confundir 5.10 com 5.1 (comparacao por inteiro, nao por float)", () => {
    expect(nextDynamicSubstepOrder("5", ["5", "5.9", "5.10"])).toBe("5.11");
  });

  it("ignora decimais de OUTRAS paradas ao calcular a vaga", () => {
    expect(nextDynamicSubstepOrder("2", ["1", "1.1", "1.2", "2", "3", "3.1"])).toBe("2.1");
  });

  it("pai sem ordem cai no bucket padrao, junto dos demais sem ordem", () => {
    const order = nextDynamicSubstepOrder(undefined, ["1", "2"]);
    expect(order).toBe(`${FALLBACK_MAJOR_ORDER}.1`);
    expect(majorOrderOf(order)).toBe(FALLBACK_MAJOR_ORDER);
  });

  it("a ordem gerada sempre agrupa sob a parada do pai", () => {
    for (const parentOrder of ["1", "2", "5.2", "10"]) {
      const generated = nextDynamicSubstepOrder(parentOrder, [parentOrder]);
      expect(majorOrderOf(generated)).toBe(majorOrderOf(parentOrder));
      expect(Number.isNaN(Number.parseFloat(generated))).toBe(false);
    }
  });
});
