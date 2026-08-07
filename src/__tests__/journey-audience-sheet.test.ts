import { describe, it, expect } from "vitest";
import {
  journeySheetName,
  JOURNEY_PROGRESS_DOC,
  type JourneyAudience,
} from "@/lib/journey/audience";

/**
 * A jornada e' espelhada no acervo como SNAPSHOT: a aba e' limpa antes de cada
 * escrita. Enquanto as duas audiencias compartilhavam um unico nome de planilha,
 * quem era membro E parceiro tinha o retrato de uma trilha apagado a cada
 * checkpoint concluido na outra.
 *
 * O que estes testes travam e' a separacao — e o fato de o nome do membro nao
 * ter mudado, porque as planilhas ja existentes dependem disso.
 */
describe("journeySheetName", () => {
  const matricula = "BP-002-PF-260331";

  it("mantem o nome legado para o membro (sem migracao das planilhas existentes)", () => {
    expect(journeySheetName(matricula, "member")).toBe("Progresso_Jornada - BP-002-PF-260331");
  });

  it("da um nome proprio a trilha de parceiro", () => {
    expect(journeySheetName(matricula, "partner")).toBe("Progresso_Jornada - BP-002-PF-260331 - Parceria");
  });

  it("nunca devolve o mesmo nome para audiencias diferentes", () => {
    expect(journeySheetName(matricula, "member")).not.toBe(journeySheetName(matricula, "partner"));
  });

  it("mantem a matricula como discriminante entre usuarios", () => {
    const outra = "BP-003-PF-260401";
    expect(journeySheetName(matricula, "partner")).not.toBe(journeySheetName(outra, "partner"));
  });

  it("cobre toda audiencia declarada, sem cair num destino compartilhado", () => {
    const audiencias = Object.keys(JOURNEY_PROGRESS_DOC) as JourneyAudience[];
    const nomes = audiencias.map((a) => journeySheetName(matricula, a));

    expect(audiencias.length).toBeGreaterThan(1);
    expect(new Set(nomes).size).toBe(audiencias.length);
  });
});
