import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 1 do BUG-103 — a separacao entre a camada CRUA de cotas e a superficie
 * exposta com guard.
 *
 * O risco que estes testes protegem nao e teorico: a concessao de cota pos-compra
 * roda no webhook do Mercado Pago, que autentica por HMAC e **nao tem sessao de
 * usuario**. Se alguem (eu, no futuro) reapontar o checkout para o action
 * guardado, o cliente passa a **pagar e nao receber a cota** — e a falha e muda,
 * porque a chamada vive dentro de um try/catch que so faz console.error.
 *
 * Sao testes de ARQUITETURA (leem o fonte) de proposito: o comportamento em si
 * depende do Firestore Admin, mas a *fiacao* — quem chama quem — e exatamente o
 * que quebra nessa regressao, e da para provar sem infraestrutura.
 */

const raiz = process.cwd();
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");

describe("caminho do pagamento nao pode passar pelo action guardado", () => {
  const checkout = ler("src/lib/checkout.ts");

  it("lib/checkout.ts NAO importa de @/actions/quotas", () => {
    // Este e o teste que impede a regressao de receita. Se falhar, alguem
    // reapontou a concessao de cota para a porta guardada.
    expect(checkout).not.toMatch(/from\s+["']@\/actions\/quotas["']/);
  });

  it("lib/checkout.ts concede cota pela camada crua (addMemberQuotas)", () => {
    // O import e dinamico (`await import(...)`), nao estatico — a regex aceita
    // as duas formas para nao quebrar se o estilo mudar.
    expect(checkout).toMatch(/(from|import\()\s*["']@\/lib\/member-quotas["']/);
    expect(checkout).toMatch(/addMemberQuotas\s*\(/);
  });
});

describe("camada crua nao pode virar endpoint de rede", () => {
  const cru = ler("src/lib/member-quotas.ts");

  it("member-quotas.ts NAO e 'use server'", () => {
    // Se virar "use server", as funcoes sem guard passam a ser chamaveis
    // diretamente pela rede — exatamente o BUG-103 de volta, com outro nome.
    expect(cru).not.toMatch(/^\s*["']use server["']/);
  });

  it("a camada crua nao importa guards (a trava e responsabilidade do action)", () => {
    expect(cru).not.toMatch(/from\s+["']@\/lib\/auth-guards["']/);
  });
});

describe("superficie exposta: toda action de cota tem guard", () => {
  const actions = ler("src/actions/quotas.ts");

  it("quotas.ts continua sendo 'use server'", () => {
    expect(actions).toMatch(/^\s*["']use server["']/);
  });

  it("updateMemberQuotasAction exige admin", () => {
    // requireAdmin e nao dono-ou-admin: o unico caller de UI e o painel
    // concedendo cota a OUTRA pessoa; uma trava de dono barraria a Gestora.
    const corpo = actions.slice(actions.indexOf("export async function updateMemberQuotasAction"));
    expect(corpo).toMatch(/requireAdmin\s*\(/);
  });

  it("getMemberQuotasAction e consumeQuotaAction exigem sessao + dono-ou-admin", () => {
    for (const nome of ["getMemberQuotasAction", "consumeQuotaAction"]) {
      const ini = actions.indexOf(`export async function ${nome}`);
      expect(ini, `${nome} nao encontrada`).toBeGreaterThan(-1);
      const corpo = actions.slice(ini, ini + 900);
      expect(corpo, `${nome} sem requireAuth`).toMatch(/requireAuth\s*\(/);
      expect(corpo, `${nome} sem trava de dono`).toMatch(/session\.uid !== uid && !session\.isAdmin/);
    }
  });

  it("nenhuma action exportada de quotas.ts fica sem guard", () => {
    const re = /export\s+async\s+function\s+(\w+)/g;
    const nomes: string[] = [];
    let m;
    while ((m = re.exec(actions))) nomes.push(m[1]);
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) {
      const ini = actions.indexOf(`export async function ${nome}`);
      const prox = nomes
        .map(n => actions.indexOf(`export async function ${n}`))
        .filter(i => i > ini)
        .sort((a, b) => a - b)[0] ?? actions.length;
      const corpo = actions.slice(ini, prox);
      expect(corpo, `${nome} exportada sem guard`).toMatch(/require(Admin|Auth)\s*\(/);
    }
  });
});
