import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * `BUG-100` — o `StepRenderer` chamava TODOS os seus hooks (useState/useCallback/
 * useEffect) DEPOIS do early return de `status === "locked"`. Quando uma parada
 * passava de travada para disponivel sem desmontar, a contagem de hooks mudava
 * entre renders e o React quebrava a tela (rules-of-hooks — 18 erros de lint).
 *
 * A correcao move o early return para DEPOIS de todos os hooks e guarda os efeitos
 * que LEEM a agenda por `status !== "locked"`, para que uma parada travada continue
 * sem gastar leitura de Firestore (custo de cota no Spark).
 *
 * Teste estrutural (mesmo padrao de `post-event-guards.test.ts`): o projeto nao
 * tem infra de render de componente (sem `@testing-library/react`), e o invariante
 * aqui e de ESTRUTURA do codigo — ordem de hooks e guarda de efeito.
 */

const raiz = process.cwd();
const fonte = fs.readFileSync(
  path.join(raiz, "src/components/journey/StepRenderer.tsx"),
  "utf8"
);
// Remove comentarios para nao casar hooks/guards citados em comentario.
const codigo = fonte
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const condicaoAte = (ancora: string) => {
  const i = codigo.indexOf(ancora);
  expect(i, `ancora nao encontrada: ${ancora}`).toBeGreaterThan(-1);
  return codigo.slice(i, codigo.indexOf("{", i));
};

describe("BUG-100: hooks antes do early return de locked", () => {
  it("o early return de status locked vem DEPOIS de todos os hooks", () => {
    const idxReturn = codigo.search(/if\s*\(\s*status\s*===\s*"locked"\s*\)/);
    expect(idxReturn, "early return de locked nao encontrado").toBeGreaterThan(-1);

    const hookRe = /\b(React\.useState|React\.useEffect|React\.useCallback|useAuthContext)\s*\(/g;
    let m: RegExpExecArray | null;
    let ultimoHook = -1;
    const hooksDepois: string[] = [];
    while ((m = hookRe.exec(codigo))) {
      if (m.index > idxReturn) hooksDepois.push(m[1]);
      ultimoHook = m.index;
    }
    expect(ultimoHook, "nenhum hook encontrado no componente").toBeGreaterThan(-1);
    expect(
      hooksDepois,
      `hooks chamados apos o early return de locked: ${hooksDepois.join(", ")}`
    ).toEqual([]);
    expect(ultimoHook, "o ultimo hook deve vir antes do early return").toBeLessThan(idxReturn);
  });

  it("o efeito que carrega a agenda (meeting) so dispara com status !== locked", () => {
    // Sem esta guarda, uma parada travada baixaria getUpcomingEvents +
    // getUserBookingsAction — leitura de Firestore que o early return evitava.
    expect(condicaoAte('substep.type === "meeting"')).toMatch(/status\s*!==\s*"locked"/);
  });

  it("o efeito que checa conclusao de survey/form so dispara com status !== locked", () => {
    expect(condicaoAte('(substep.type === "survey"')).toMatch(/status\s*!==\s*"locked"/);
  });
});
