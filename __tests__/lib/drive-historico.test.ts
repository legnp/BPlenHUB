import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * `BUG-110` — o Drive precisa ACUMULAR histórico, não sobrescrever.
 *
 * O `syncDataToSheet` **apaga a aba inteira** antes de escrever ("snapshot limpo,
 * sem rastros do passado"). Isso trata resposta de survey como **estado**, quando
 * ela é **evento**: cada envio é um fato distinto.
 *
 * Por que importa mais do que parece: o Drive é a **estratégia de backup
 * independente da plataforma** da Gestora — ela precisa conseguir operar a BPlen a
 * partir dele se a plataforma cair. Um espelho que guarda só a última linha é um
 * backup vazio.
 *
 * O agravante: a pasta única de anônimos (`BP-ANON`) faz o nome da planilha ser
 * compartilhado por **todos** os visitantes. Dois visitantes avaliando o mesmo
 * artigo caíam na mesma planilha e o segundo **apagava** o primeiro — justamente
 * na pasta destinada à análise de personas.
 *
 * A distinção evento-vs-estado já existia no código: `syncOrderToUserDrive` e
 * `syncBacklogToUserDrive` já anexavam. Só o caminho de survey sobrescrevia.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");
const codigoDe = (rel: string) =>
  ler(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Recorta o corpo de uma função exportada até a próxima declaração exportada. */
function corpoDe(fonte: string, nome: string): string {
  const ini = fonte.indexOf(`export async function ${nome}`);
  if (ini < 0) return "";
  const resto = fonte.slice(ini + 1);
  const prox = resto.search(new RegExp("\\nexport\\s"));
  return prox < 0 ? resto : resto.slice(0, prox);
}

describe("respostas de survey acumulam histórico no Drive", () => {
  const fonte = codigoDe("src/lib/drive-sync.ts");

  it("syncSurveyToUserDrive ANEXA, não sobrescreve", () => {
    const corpo = corpoDe(fonte, "syncSurveyToUserDrive");
    expect(corpo, "syncSurveyToUserDrive não encontrada").not.toBe("");
    expect(corpo, "voltou a sobrescrever — o backup perde histórico")
      .not.toMatch(/syncDataToSheet\s*\(/);
    expect(corpo).toMatch(/appendDataToSheet\s*\(/);
  });

  it("isso vale para TODOS os surveys, não só o feedback de conteúdo", () => {
    // Decisão da Gestora (2026-07-20): check-in, CV, pré-análise, preferências —
    // todos acumulam. Como os 9 efeitos passam pelo MESMO `syncSurveyToUserDrive`,
    // basta ele anexar. Este teste confirma que nenhum efeito criou caminho próprio.
    const dir = path.join(raiz, "src/actions/effects");
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".ts")) continue;
      const t = codigoDe(`src/actions/effects/${f}`);
      expect(t, `${f} escreve na planilha por fora do sincronizador`)
        .not.toMatch(/syncDataToSheet\s*\(/);
    }
  });

  it("o snapshot da JORNADA continua snapshot (é estado, não evento)", () => {
    // `syncJourneyToUserDrive` despeja o progresso inteiro a cada execução — ali
    // sobrescrever é o comportamento correto. A distinção é o ponto do bug.
    const corpo = corpoDe(fonte, "syncJourneyToUserDrive");
    expect(corpo).toMatch(/syncDataToSheet\s*\(/);
  });

  it("pedidos e backlog seguem anexando (o padrão que já existia)", () => {
    for (const nome of ["syncOrderToUserDrive", "syncBacklogToUserDrive"]) {
      expect(corpoDe(fonte, nome), `${nome} deixou de anexar`).toMatch(/appendDataToSheet\s*\(/);
    }
  });
});
