import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 2b.2-A — fonte unica de identidade (`BUG-103`) + feedback publico (`BUG-107`).
 *
 * Por que a fonte unica importa: a resolucao "uid -> matricula" vivia em DUAS
 * copias (`lib/user-matricula.ts` e `actions/survey-effects.ts`). Elas divergiram,
 * e foi por isso que o padrao do `BUG-032` foi corrigido em `auth-permissions.ts`
 * e **sobreviveu nas outras duas** ate virar o `BUG-106` (sequestro de conta).
 * Enquanto forem copias, o proximo endurecimento conserta uma e a outra sobrevive.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");
const codigoDe = (rel: string) =>
  ler(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a resolucao uid -> matricula existe em UM lugar so", () => {
  it("a fonte unica nao e endpoint de rede", () => {
    const fonte = ler("src/lib/identity/find-matricula.ts");
    expect(fonte).toMatch(/export async function findMatriculaByIdentity/);
    expect(fonte).not.toMatch(/^\s*["']use server["']/);
  });
  it("as duas antigas copias CHAMAM a fonte unica, nao so a mencionam", () => {
    // Versao anterior deste teste so procurava o nome no arquivo — e o import
    // sozinho ja satisfazia. A mutacao que trocava a chamada por `null` passava
    // verde, embora quebrasse a resolucao (o welcome cunharia matricula NOVA
    // para usuario existente). Agora exige a chamada com argumentos.
    expect(codigoDe("src/lib/user-matricula.ts"))
      .toMatch(/findMatriculaByIdentity\(\s*userUid\s*,\s*verifiedEmail\s*\)/);
    expect(codigoDe("src/actions/survey-effects.ts"))
      .toMatch(/=\s*await findMatriculaByIdentity\(\s*userUid\s*,\s*verifiedEmail\s*\)/);
  });

  it("so a fonte unica escreve identidade a partir de e-mail", () => {
    // A invariante estrutural: quem casa `User` por e-mail e reescreve o `uid`
    // do dono tem de ser um arquivo so. Se reaparecer noutro, o padrao do
    // BUG-106 esta voltando.
    const encontrados: string[] = [];
    const varrer = (dir: string) => {
      for (const e of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) varrer(rel);
        else if (e.name.endsWith(".ts")) {
          const t = codigoDe(rel);
          if (/where\(\s*["']email["']\s*,\s*["']==["']/.test(t) && /update\(\s*\{\s*uid\s*[,:}]/.test(t)) {
            encontrados.push(rel);
          }
        }
      }
    };
    varrer("src");
    // `auth-permissions.ts` tem desenho proprio (fluxo de login, BUG-032) e fica
    // fora da consolidacao por ora — mas nao pode haver NENHUM outro.
    expect(encontrados.sort()).toEqual(["src/lib/identity/find-matricula.ts"]);
  });

  it("o e-mail continua vindo da sessao, nunca do formulario", () => {
    const efeitos = codigoDe("src/actions/survey-effects.ts");
    expect(efeitos).not.toMatch(/responses\.email/);
    expect(efeitos).toMatch(/getServerSession\s*\(/);
    expect(efeitos).toMatch(/sessionForHealing\?\.uid === userUid/);
  });
});

describe("BUG-107: o visitante nao logado consegue enviar feedback", () => {
  const fonte = codigoDe("src/actions/feedback.ts");

  it("nao fabrica mais identidade (`lead_eval_*` / `lead_theme_*`)", () => {
    // O id fabricado era truthy, entao o resolvedor pulava o ramo anonimo,
    // falhava nos lookups e terminava em erro — o visitante via
    // "Falha ao registrar sua avaliacao".
    expect(fonte).not.toMatch(/lead_eval_/);
    expect(fonte).not.toMatch(/lead_theme_/);
  });

  it("nao compoe identidade a partir de e-mail digitado", () => {
    // O hash do e-mail do formulario tambem era identidade forjavel.
    expect(fonte).not.toMatch(/emailHash/);
  });

  it("os dois envios resolvem o uid pela sessao verificada", () => {
    const usos = fonte.match(/await resolveSubmitterUid\(\)/g) || [];
    expect(usos.length).toBe(2); // avaliacao de conteudo + sugestao de tema
    expect(fonte).toMatch(/getServerSession\s*\(/);
  });

  it("nao aceita mais `uid` vindo do cliente como identidade", () => {
    // Rastreabilidade forjavel nao e rastreabilidade (familia do BUG-106).
    expect(fonte).not.toMatch(/data\.uid\s*\|\|/);
  });
});

describe("o caminho anonimo e explicito, nao um efeito colateral", () => {
  it("submitSurvey e submitGenericForm aceitam ausencia de uid", () => {
    expect(codigoDe("src/actions/submit-survey.ts")).toMatch(/userUid\?: string/);
    expect(codigoDe("src/actions/generic-form.ts")).toMatch(/userUid\?: string/);
  });

  it("generic-form decide anonimo por ausencia de uid, nao por miss de lookup", () => {
    const t = codigoDe("src/actions/generic-form.ts");
    expect(t).toMatch(/if \(userUid\)/);
    expect(t).not.toMatch(/_AuthMap\/\$\{userUid\}`\)\.get\(\);\s*const matricula = authMapSnap\.exists/);
  });
});
