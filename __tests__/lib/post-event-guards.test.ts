import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 3 do `BUG-103` — o `BUG-102`, que abriu toda a reabertura do T-02.
 *
 * `post-event.ts` NAO e `"use server"`: a exposicao de rede vinha do dispatcher
 * `actions/calendar.ts`, que reexportava as funcoes. Sem guard, um chamador nao
 * autenticado podia fechar/cancelar qualquer evento, marcar presenca de qualquer
 * membro e gravar feedback, tarefas e documentos na **carreira** dele — alem de
 * reescrever o registro global de programacao.
 *
 * As tres estavam **nominalmente listadas no corpo do `BUG-020`**, e nenhum dos 7
 * lotes tocou este arquivo. O T-02 foi declarado FECHADO 12/12 assim mesmo.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");
const codigoDe = (rel: string) =>
  ler(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Recorta o corpo de uma funcao exportada ate a proxima declaracao exportada. */
function corpoDe(fonte: string, nome: string): string {
  const ini = fonte.indexOf(`export async function ${nome}`);
  if (ini < 0) return "";
  const resto = fonte.slice(ini + 1);
  const prox = resto.indexOf("\nexport ");
  return prox < 0 ? resto : resto.slice(0, prox);
}

describe("fechar evento e marcar presenca exigem admin", () => {
  const fonte = codigoDe("src/actions/calendar-module/post-event.ts");

  for (const nome of ["closeEventAction", "closeAttendeeAction"]) {
    it(`${nome} exige admin`, () => {
      const corpo = corpoDe(fonte, nome);
      expect(corpo, `${nome} nao encontrada`).not.toBe("");
      expect(corpo, `${nome} sem requireAdmin`).toMatch(/await requireAdmin\s*\(/);
    });
  }

  it("as funcoes que ja tinham guard continuam com ele", () => {
    // Estas 3 sempre tiveram — a assimetria dentro do proprio arquivo foi o que
    // indicou que a ausencia nas outras era omissao, nao decisao.
    for (const nome of ["baixarEventoAction", "generateEventSummarySheetAction", "healProgramacaoMasterAction"]) {
      expect(corpoDe(fonte, nome), `${nome} perdeu o guard`).toMatch(/requireAdmin\s*\(/);
    }
  });
});

describe("o registro global nao e alcancavel pela rede", () => {
  const dispatcher = codigoDe("src/actions/calendar.ts");

  it("o dispatcher NAO reexporta updateGlobalProgramacaoRegistryAction", () => {
    // Guardar a funcao no lugar quebraria o cron das 03h e o funil de lead
    // publico, que nao tem sessao. A correcao e tirar a porta, nao trancar a
    // sala (Protocolo item 8). E a mesma capacidade que o BUG-024 removeu
    // quando estava exposta como rota /api/trigger-sync.
    expect(dispatcher).not.toMatch(/updateGlobalProgramacaoRegistryAction/);
  });

  it("os consumidores internos seguem importando direto do modulo", () => {
    // Se algum deles passar a importar de `@/actions/calendar`, volta a
    // depender de uma porta de rede — e quebraria se ela ganhasse guard.
    for (const arq of ["src/actions/calendar-module/sync.ts", "src/actions/calendar-module/booking.ts"]) {
      const t = codigoDe(arq);
      expect(t, `${arq} nao chama mais o registro`).toMatch(/updateGlobalProgramacaoRegistryAction/);
      expect(t, `${arq} passou a importar do dispatcher`).not.toMatch(/from ["']@\/actions\/calendar["']/);
    }
  });
});
