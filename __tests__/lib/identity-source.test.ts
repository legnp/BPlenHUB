import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * BUG-106 (Critico) — de onde vem a identidade em que o codigo acredita.
 *
 * Dois ramos do sistema curavam a conta **casando o `User` por e-mail e
 * reescrevendo o `uid` do dono**. Quando esse e-mail vinha do cliente
 * (`responses.email`, ou o parametro `email?`), bastava informar o e-mail de
 * outra pessoa para o `_AuthMap` passar a apontar o uid do chamador para a
 * matricula dela — sequestro de conta. E o mesmo padrao do `BUG-032`, que foi
 * corrigido em `auth-permissions.ts` e **sobreviveu nestas duas copias**.
 *
 * A invariante que estes testes protegem e uma so:
 *   **e-mail que decide identidade vem da SESSAO VERIFICADA, nunca de parametro.**
 *
 * Licao 44: "tem guard?" e metade da pergunta; a outra e "no que esta funcao
 * confia?". As travas do lote 2a (PR #123) conferiam o `uid` e passavam — com a
 * brecha do e-mail intacta na linha seguinte.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");

/**
 * Remove comentarios antes de asserir sobre o CODIGO.
 *
 * Sem isto o teste acusa a propria documentacao: o comentario que explica o
 * BUG-106 cita `responses.email` para dizer por que nao se pode le-lo, e a
 * primeira versao deste teste falhou por causa dele. Explicar o defeito nao
 * pode ser confundido com comete-lo.
 */
const codigoDe = (rel: string) =>
  ler(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("survey-effects: a cura por e-mail nao pode ler o formulario", () => {
  const fonte = codigoDe("src/actions/survey-effects.ts");

  it("NAO le `responses.email` para decidir identidade", () => {
    // Esta e a linha que era o Critico.
    expect(fonte).not.toMatch(/responses\.email/);
  });

  it("obtem o e-mail da sessao verificada", () => {
    expect(fonte).toMatch(/getServerSession\s*\(/);
  });

  it("so cura quando a sessao e o dono do uid recebido", () => {
    // Sem esta comparacao, um usuario logado curaria a conta de outro uid.
    expect(fonte).toMatch(/sessionForHealing\?\.uid === userUid/);
  });
});

describe("resolveMatricula: o e-mail e contratualmente verificado", () => {
  const lib = ler("src/lib/user-matricula.ts");

  it("o parametro se chama verifiedEmail (o nome carrega o contrato)", () => {
    expect(lib).toMatch(/resolveMatricula\(\s*userUid: string,\s*verifiedEmail\?: string/);
    expect(lib).not.toMatch(/resolveMatricula\(\s*userUid: string,\s*email\?: string/);
  });

  it("o contrato esta documentado junto da funcao", () => {
    expect(lib).toMatch(/CONTRATO DO `verifiedEmail`/);
  });
});

describe("nenhum chamador repassa e-mail de origem cliente", () => {
  const fonte = codigoDe("src/actions/get-user-results.ts");

  it("os getters passam o e-mail da sessao, e so quando a sessao e o dono", () => {
    // `session.uid === userUid ? session.email : undefined` — com o admin lendo o
    // resultado de outro membro, o e-mail dele resolveria para a matricula errada.
    const ocorrencias = fonte.match(/const verifiedEmail = session\.uid === userUid \? session\.email : undefined;/g) || [];
    expect(ocorrencias.length).toBe(4);
  });

  it("nenhum getter repassa o parametro `email` do cliente para resolveMatricula", () => {
    expect(fonte).not.toMatch(/resolveMatricula\(userUid,\s*email\)/);
    expect(fonte).not.toMatch(/resolveMatricula\(userUid,\s*userEmail\)/);
  });
});

describe("o padrao nao pode reaparecer em outro arquivo", () => {
  it("so os pontos conhecidos casam User por e-mail e escrevem uid do dono", () => {
    // O BUG-106 nasceu de o BUG-032 ter sido corrigido num arquivo e sobreviver
    // em outros dois. Se um arquivo novo passar a fazer isso, este teste avisa.
    const alvos = [
      "src/actions/survey-effects.ts",
      "src/lib/user-matricula.ts",
      "src/actions/auth-permissions.ts",
      "src/actions/invitations.ts"
    ];
    const encontrados: string[] = [];
    const varrer = (dir: string) => {
      for (const e of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) varrer(rel);
        else if (e.name.endsWith(".ts")) {
          const t = fs.readFileSync(path.join(raiz, rel), "utf8");
          if (/where\(\s*["']email["']\s*,\s*["']==["']/.test(t) && /update\(\s*\{\s*uid:/.test(t)) {
            encontrados.push(rel);
          }
        }
      }
    };
    varrer("src");
    for (const f of encontrados) {
      expect(alvos, `arquivo novo casando e-mail e reescrevendo uid: ${f}`).toContain(f);
    }
  });
});
