import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 5 do `BUG-103` — a superficie de Server Actions, conferida por PADRAO.
 *
 * ## Por que este teste existe
 *
 * O T-02 foi declarado FECHADO 12/12 e **nao estava**: a conferencia passou
 * **bug a bug**, mas a lista de arquivos DENTRO do `BUG-020` tambem era um
 * checklist, e ninguem a releu. O `post-event.ts` estava la e nenhum dos 7 lotes
 * o tocou (`BUG-102`) — e a varredura que se seguiu achou 57 funcoes expostas sem
 * guard (`BUG-103`), incluindo um **Critico** de sequestro de conta (`BUG-106`).
 *
 * Este teste substitui a conferencia humana por uma **invariante executavel**: em
 * `src/actions`, toda funcao exportada de um arquivo `"use server"` e um endpoint
 * de rede. Ou ela tem guard, ou esta na lista de **publicas por design** abaixo —
 * cada uma com o motivo registrado. Qualquer funcao nova que fuja disso quebra o
 * teste **antes** de virar bug.
 */

const raiz = process.cwd();
const GUARDS = /\b(requireAdmin|requireAuth|requireMatricula|requireMemberAccess|verifySignedSession|getServerSession|checkAuthAndGetDb)\s*\(/;

/**
 * Funcoes expostas SEM guard que sao intencionais. Cada entrada e uma decisao
 * registrada, nao uma excecao para fazer o teste passar.
 */
const PUBLICAS_POR_DESIGN: Record<string, string> = {
  // Primitivos de sessao: guardar recursa (o guard depende deles). Protocolo item 8.
  "auth-session.ts:createSignedSessionCookie": "primitivo de sessao — cria o cookie; guardar recursa",
  "auth-session.ts:clearSessionCookie": "primitivo de sessao — logout precisa funcionar sem sessao valida",
  "auth-session.ts:hasServerSession": "primitivo de sessao — responde SE ha sessao; guardar recursa",

  // Funil de lead PUBLICO — intencional desde o lote 1 do BUG-020.
  "external-booking.ts:getPublicSlotsAction": "funil de lead publico — visitante ve horarios sem login",
  "external-booking.ts:bookPublicMeetingAction": "funil de lead publico — visitante agenda sem login",
  "external-booking.ts:getPublicAvailableDaysAction": "funil de lead publico — dias livres sem login",
  "external-booking.ts:submitBookingProposalAction": "funil de lead publico — proposta sem login",

  // Feedback publico: requisito explicito da Gestora. Identidade, quando existe,
  // vem da SESSAO verificada (BUG-106/BUG-107) — nao de parametro do cliente.
  "feedback.ts:submitContentFeedback": "publico por requisito — visitante avalia conteudo; uid vem da sessao",
  "feedback.ts:submitThemeSuggestion": "publico por requisito — visitante sugere tema; uid vem da sessao",
  "generic-form.ts:submitGenericForm": "form publico; anonimo explicito quando nao ha uid",
  "submit-survey.ts:submitSurvey": "serve logado E anonimo; identidade resolvida internamente pela sessao",

  // Catalogo/conteudo publico — leitura sem dado sensivel.
  "products.ts:getProductBySlug": "catalogo publico",
  "products.ts:getProductsByAudience": "catalogo publico",
  "products.ts:getJourneyProducts": "catalogo publico",
  "products.ts:registerFaqQuestionAction": "form de contato publico; recebe contato, nao identidade",
  "social.ts:checkSlugExists": "conteudo publico",
  "social.ts:getSocialPostBySlugOrId": "conteudo publico",
  "social.ts:getSocialPosts": "conteudo publico",
  "social.ts:getSocialPostById": "conteudo publico",
  "OneToOneActions.ts:getOneToOneTypes": "config de razoes do 1 to 1 — catalogo, sem dado de usuario",
  "calendar-event-types.ts:getCalendarEventTypes": "config de tipos de evento — catalogo, sem dado de usuario",

  // Fluxo de convite: o TOKEN e a credencial.
  "invitations.ts:getInvitationEventAction": "pagina publica de convite — le o evento pelo slug",
  "invitations.ts:validateInvitationTokenAction": "o token E a credencial",
  "invitations.ts:claimInvitationTokenAction": "o token E a credencial",
  // BUG-108 corrigido: `submitInvitationSurveyAction` saiu desta lista porque passou
  // a ter guard — deriva a identidade da SESSAO verificada (`getServerSession`) e
  // exige `token.claimedBy === matricula` da sessao, em vez de aceitar a matricula do
  // cliente. `sendInvitationRsvpEmailsAction` deixou de existir na rede (virou o
  // helper interno `sendInvitationRsvpEmails`, sem `export`).
};

/** Todas as funcoes exportadas de arquivos `"use server"` em src/actions. */
function levantarSuperficie(): Array<{ chave: string; corpo: string; aliases: Map<string, string> }> {
  const out: Array<{ chave: string; corpo: string; aliases: Map<string, string> }> = [];
  const varrer = (dir: string) => {
    for (const e of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { varrer(rel); continue; }
      if (!e.name.endsWith(".ts")) continue;
      const texto = fs.readFileSync(path.join(raiz, rel), "utf8");
      if (!/^\s*["']use server["']/.test(texto)) continue;

      const aliases = new Map<string, string>();
      const reAlias = /import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["']/g;
      let ma;
      while ((ma = reAlias.exec(texto))) {
        let destino = ma[2];
        if (destino.startsWith("@/")) destino = "src/" + destino.slice(2);
        else destino = path.posix.join(path.posix.dirname(rel), destino);
        aliases.set(ma[1], destino + ".ts");
      }

      const re = /export\s+async\s+function\s+(\w+)\s*\(/g;
      const marcos: Array<{ nome: string; ini: number }> = [];
      let m;
      while ((m = re.exec(texto))) marcos.push({ nome: m[1], ini: m.index });
      marcos.forEach((mk, i) => {
        const fim = i + 1 < marcos.length ? marcos[i + 1].ini : texto.length;
        out.push({ chave: `${e.name}:${mk.nome}`, corpo: texto.slice(mk.ini, fim), aliases });
      });
    }
  };
  varrer("src/actions");
  return out;
}

/**
 * O guard pode estar na funcao de DESTINO, nao no wrapper. O `calendar.ts` e um
 * dispatcher: `export async function x() { return Mod.x(); }` — o guard vive em
 * `Mod.x`. Ignorar isso gerava falso positivo em 12 actions legitimamente
 * guardadas. (O script de varredura ja resolvia; o teste precisava aprender.)
 */
function temGuardConsiderandoDelegacao(f: { corpo: string; aliases: Map<string, string> }): boolean {
  if (GUARDS.test(f.corpo)) return true;

  const deleg = f.corpo.match(/return\s+(\w+)\.(\w+)\s*\(/);
  if (!deleg) return false;
  const alvoArq = f.aliases.get(deleg[1]);
  if (!alvoArq) return false;

  const abs = path.join(raiz, alvoArq);
  if (!fs.existsSync(abs)) return false;
  const alvoTexto = fs.readFileSync(abs, "utf8");

  const re = new RegExp("export\\s+async\\s+function\\s+" + deleg[2] + "\\s*\\(");
  const ini = alvoTexto.search(re);
  if (ini < 0) return false;
  const resto = alvoTexto.slice(ini + 1);
  const prox = resto.search(new RegExp("\\nexport\\s"));
  const corpoAlvo = prox < 0 ? resto : resto.slice(0, prox);
  return GUARDS.test(corpoAlvo);
}

describe("superficie de Server Actions conferida por padrao", () => {
  const superficie = levantarSuperficie();

  it("a varredura encontra a superficie (sanidade do proprio teste)", () => {
    // Se isto zerar, o teste passaria vaziamente — o falso verde que ja
    // aconteceu duas vezes nesta auditoria.
    expect(superficie.length).toBeGreaterThan(100);
  });

  it("toda action exposta tem guard OU esta declarada como publica por design", () => {
    const semGuardNemDeclaracao = superficie
      .filter(f => !temGuardConsiderandoDelegacao(f))
      .filter(f => !(f.chave in PUBLICAS_POR_DESIGN))
      .map(f => f.chave);

    expect(
      semGuardNemDeclaracao,
      `Action(s) exposta(s) sem guard e sem decisao registrada. Ou adicione o guard, ` +
      `ou tire da rede (mover para lib), ou declare em PUBLICAS_POR_DESIGN com o motivo:\n` +
      semGuardNemDeclaracao.map(c => `  - ${c}`).join("\n")
    ).toEqual([]);
  });

  it("a lista de publicas por design nao tem entrada morta", () => {
    // Entrada que nao corresponde a nenhuma action real e lixo que mascara o
    // proximo problema.
    const chaves = new Set(superficie.map(f => f.chave));
    const mortas = Object.keys(PUBLICAS_POR_DESIGN).filter(c => !chaves.has(c));
    expect(mortas, `entradas obsoletas em PUBLICAS_POR_DESIGN:\n${mortas.join("\n")}`).toEqual([]);
  });
});

describe("os handlers de efeito sairam da rede", () => {
  it("nenhum arquivo em actions/effects e 'use server'", () => {
    // Eram 6 arquivos, 9 handlers, todos endpoints: uma requisicao nao
    // autenticada disparava efeitos na conta de qualquer matricula.
    const dir = "src/actions/effects";
    for (const e of fs.readdirSync(path.join(raiz, dir))) {
      if (!e.endsWith(".ts")) continue;
      const t = fs.readFileSync(path.join(raiz, dir, e), "utf8");
      expect(t, `${e} voltou a ser "use server"`).not.toMatch(/^\s*["']use server["']/);
    }
  });

  it("os dispatchers de efeito vivem em lib, nao em actions", () => {
    expect(fs.existsSync(path.join(raiz, "src/lib/survey/effects.ts"))).toBe(true);
    const formEffects = fs.readFileSync(path.join(raiz, "src/actions/form-effects.ts"), "utf8");
    expect(formEffects).not.toMatch(/^\s*["']use server["']/);
  });

  it("a geracao de contrato exige dono-ou-admin (e SEGUE use server)", () => {
    // Aceitava o uid do CLIENTE: qualquer um gerava/gravava o contrato de outra
    // pessoa. Aqui a correcao NAO pode ser tirar da rede: a diretiva "use server"
    // e tambem FRONTEIRA DE BUNDLE — sem ela o bundler traca pdfkit/fs/stream e o
    // build morre com heap out of memory (confirmado por bisseccao: passa na main,
    // falha so com a diretiva removida). Entao a protecao e guard, e o teste trava
    // as DUAS coisas — inclusive a diretiva, para ninguem "limpar" de novo.
    const legal = fs.readFileSync(path.join(raiz, "src/actions/legal.ts"), "utf8");
    expect(legal, "legal.ts PRECISA continuar use server (pdfkit no bundle)")
      .toMatch(/^\s*["']use server["']/);
    expect(legal).toMatch(/requireAuth\s*\(/);
    expect(legal).toMatch(/session\.uid !== userId && !session\.isAdmin/);
  });
});
