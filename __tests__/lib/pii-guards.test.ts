import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 2a do BUG-103 — leitura de PII (resultados psicometricos e respostas de
 * survey) e o primitivo de resolucao de matricula.
 *
 * Ate este lote, `getDiscResult(userUid)` e `getPdiSurveysDataAction(matricula)`
 * aceitavam o identificador **do cliente** sem conferir a sessao: dava para ler
 * o DISC, o PDI e as respostas de survey de qualquer membro. E `resolveMatricula`
 * era um endpoint de rede que revelava a matricula de qualquer uid/e-mail.
 *
 * Testes de ARQUITETURA de proposito: o comportamento depende do Firestore
 * Admin, mas a fiacao — quem tem guard, quem esta exposto — e o que quebra.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");

/** Recorta o corpo de uma funcao exportada ate a proxima declaracao exportada. */
function corpoDe(fonte: string, nome: string): string {
  const ini = fonte.indexOf(`export async function ${nome}`);
  if (ini < 0) return "";
  const resto = fonte.slice(ini + 1);
  const prox = resto.indexOf("\nexport ");
  return prox < 0 ? resto : resto.slice(0, prox);
}

describe("resolveMatricula deixou de ser endpoint de rede", () => {
  it("vive numa lib que NAO e 'use server'", () => {
    const lib = ler("src/lib/user-matricula.ts");
    expect(lib).toMatch(/export async function resolveMatricula/);
    expect(lib).not.toMatch(/^\s*["']use server["']/);
  });

  it("nao e mais exportada de get-user-results.ts", () => {
    // Se voltar a ser exportada dali, volta a ser chamavel pela rede.
    expect(ler("src/actions/get-user-results.ts")).not.toMatch(
      /export\s+(async\s+)?function\s+resolveMatricula/
    );
  });
});

describe("resultados psicometricos exigem dono-ou-admin", () => {
  const fonte = ler("src/actions/get-user-results.ts");
  const getters = [
    "getGestaoTempoResult",
    "getAprendizadoResult",
    "getReconhecimentoResult",
    "getDiscResult"
  ];

  for (const nome of getters) {
    it(`${nome} confere a sessao contra o userUid recebido`, () => {
      const corpo = corpoDe(fonte, nome);
      expect(corpo, `${nome} nao encontrada`).not.toBe("");
      expect(corpo, `${nome} sem requireAuth`).toMatch(/requireAuth\s*\(/);
      expect(corpo, `${nome} sem trava de dono`).toMatch(
        /session\.uid !== userUid && !session\.isAdmin/
      );
    });
  }

  it("getOwnCheckinPrefillAction continua resolvendo pela sessao, nunca por parametro", () => {
    // Esta ja era a implementacao correta antes do lote — serviu de modelo.
    const corpo = corpoDe(fonte, "getOwnCheckinPrefillAction");
    expect(corpo).toMatch(/requireAuth\s*\(/);
    expect(corpo).toMatch(/session\.uid/);
  });

  it("a funcao orfa getPreAnaliseComportamentalResult foi removida", () => {
    // Zero chamadores em todo o repo. O DADO segue sendo gravado pelo efeito
    // `effects/pre-analise-comportamental.ts` — so o getter morto saiu.
    expect(fonte).not.toMatch(/getPreAnaliseComportamentalResult/);
  });
});

describe("leitura de respostas de survey exige dono-ou-admin", () => {
  const fonte = ler("src/actions/submit-survey.ts");
  const leitores = [
    "checkSurveyCompletedAction",
    "getPreviousSurveysDataAction",
    "getPdiSurveysDataAction"
  ];

  for (const nome of leitores) {
    it(`${nome} confere a sessao contra a matricula recebida`, () => {
      const corpo = corpoDe(fonte, nome);
      expect(corpo, `${nome} nao encontrada`).not.toBe("");
      expect(corpo, `${nome} sem requireAuth`).toMatch(/requireAuth\s*\(/);
      expect(corpo, `${nome} sem trava de dono`).toMatch(
        /session\.matricula !== matricula && !session\.isAdmin/
      );
    });
  }

  it("submitSurvey NAO recebeu guard neste lote (fica para o 2b)", () => {
    // Deliberado: `submitSurvey` serve TAMBEM o caminho publico —
    // `feedback.ts:submitContentFeedback` delega para ele com um uid anonimo
    // (`lead_eval_*`) quando quem responde nao esta logado. Um requireAuth aqui
    // derrubaria o feedback de visitante. A dualidade publico/logado e a
    // rastreabilidade nao-forjavel sao o escopo do lote 2b.
    const corpo = corpoDe(fonte, "submitSurvey");
    expect(corpo).not.toMatch(/requireAuth\s*\(/);
  });
});
