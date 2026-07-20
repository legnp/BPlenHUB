import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 2b.2-B — a superficie exposta de identidade e a pasta unica de anonimos.
 *
 * Duas invariantes distintas:
 *
 * 1. **Ninguem pode afirmar "sou esse uid" pela rede.** A protecao aqui nao e um
 *    guard a mais, e o **formato da assinatura**: os actions nao recebem uid.
 *    Enquanto `resolveUserIdentity(surveyId, responses, userUid)` era exportada de
 *    um `"use server"`, qualquer requisicao podia **cunhar matricula em serie**
 *    (o ramo de welcome/cadastro incrementa `_internal/counters/user/global`) e
 *    `getUserMetadata(userUid)` devolvia apelido e metadata de permissao de
 *    qualquer pessoa.
 *
 * 2. **A pasta unica de anonimos nao pode perder envio.** O id do documento e o
 *    `surveyId`; concentrando todos os anonimos em `BP-ANON`, dois visitantes
 *    avaliando o MESMO artigo colidiriam e o segundo apagaria o primeiro.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");
const codigoDe = (rel: string) =>
  ler(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a superficie exposta nao aceita uid do cliente", () => {
  const actions = codigoDe("src/actions/survey-effects.ts");

  it("os actions de identidade nao recebem uid — resolvem pela sessao", () => {
    expect(actions).toMatch(/resolveOwnIdentityAction\(surveyId: string\)/);
    expect(actions).toMatch(/getOwnMetadataAction\(\)/);
    expect(actions).toMatch(/requireAuth\s*\(/);
    expect(actions).toMatch(/session\.uid/);
  });

  it("as versoes cruas nao sao mais exportadas de um 'use server'", () => {
    // Eram o vetor de cunhagem de matricula em serie e de leitura de metadata
    // alheia. Se voltarem a ser exportadas daqui, o vetor volta.
    expect(actions).not.toMatch(/export async function resolveUserIdentity/);
    expect(actions).not.toMatch(/export async function getUserMetadata/);
  });

  it("a camada crua nao e endpoint de rede", () => {
    const lib = ler("src/lib/survey/identity.ts");
    expect(lib).toMatch(/export async function resolveUserIdentity/);
    expect(lib).toMatch(/export async function getUserMetadata/);
    expect(lib).not.toMatch(/^\s*["']use server["']/);
  });

  it("nenhum componente chama as versoes cruas direto", () => {
    for (const arq of ["src/components/forms/SurveyEngine.tsx", "src/components/forms/FormsEngine.tsx"]) {
      const t = codigoDe(arq);
      expect(t, `${arq} ainda usa a API antiga`).not.toMatch(/resolveUserIdentity|getUserMetadata/);
      expect(t, `${arq} nao usa o action de sessao`).toMatch(/resolveOwnIdentityAction/);
    }
  });
});

describe("pasta unica de anonimos sem perda de envio", () => {
  it("o anonimo cai numa pasta unica, nao numa por submissao", () => {
    const lib = codigoDe("src/lib/survey/identity.ts");
    expect(lib).toMatch(/export const ANON_MATRICULA = "BP-ANON"/);
    // A forma antiga criava um doc de User por envio.
    expect(lib).not.toMatch(/BP-ANON-\$\{/);
  });

  it("quem escreve da id UNICO ao doc do anonimo (senao um sobrescreve o outro)", () => {
    for (const arq of ["src/actions/submit-survey.ts", "src/actions/generic-form.ts"]) {
      const t = codigoDe(arq);
      expect(t, `${arq} nao trata a colisao`).toMatch(/matricula === ANON_MATRICULA \? `\$\{config\.id\}__\$\{Date\.now\(\)\}` : config\.id/);
      expect(t, `${arq} nao usa o docId no caminho`).toMatch(/\$\{docId\}`/);
    }
  });

  it("o identificado continua com id = surveyId (nada muda para ele)", () => {
    // O sufixo e SO para o anonimo: para o membro, o doc continua sendo
    // sobrescrito pelo proprio reenvio, que e o comportamento desejado.
    const t = codigoDe("src/actions/submit-survey.ts");
    expect(t).toMatch(/: config\.id;/);
  });
});
