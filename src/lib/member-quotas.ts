import { getAdminDb } from "@/lib/firebase-admin";
import { MemberQuotaWallet, MemberQuota } from "@/types/entitlements";
import { safeSerialize } from "@/lib/utils/firestore";
import { normalizeQuotaKey, foldQuotaMap } from "@/lib/quota-keys";

/**
 * Camada CRUA da carteira de cotas — sem guard, e de proposito.
 *
 * Este arquivo NAO e `"use server"`: as funcoes daqui **nao sao endpoints de
 * rede**, so as alcanca quem ja esta rodando dentro do servidor. Os guards
 * vivem no `src/actions/quotas.ts`, que e a superficie exposta.
 *
 * Por que a separacao (Protocolo item 8 / Licao 9, mesmo desenho do lote 7 do
 * BUG-020): a concessao de cota e chamada por DOIS mundos com formas diferentes
 * de provar identidade —
 *
 * | Chamador | Como se autentica | Usa |
 * |---|---|---|
 * | Painel do admin (`admin/users`) | sessao (cookie assinado) | o action guardado |
 * | Webhook do Mercado Pago -> `maybeReleaseService` -> `grantServiceEntitlement` | assinatura HMAC (BUG-025), **sem sessao de usuario** | este resolvedor cru |
 *
 * Colocar `requireAuth`/`requireAdmin` na funcao unica faria **o cliente pagar e
 * nao receber a cota** — o webhook nao tem sessao para oferecer. Este arquivo
 * existe para que o guard proteja a porta de rede sem bloquear o pagamento.
 *
 * REGRA: quem chama daqui ja verificou identidade por outro meio. Nao importar
 * este arquivo em componente de cliente nem reexporta-lo de um `"use server"`
 * sem guard proprio.
 */

/** Resolve a matricula de um UID via `_AuthMap`. */
export async function resolveMatriculaByUid(uid: string): Promise<string | null> {
  const db = getAdminDb();
  const mapSnap = await db.collection("_AuthMap").doc(uid).get();
  return mapSnap.exists ? mapSnap.data()?.matricula : null;
}

/** Le a carteira de cotas do membro, com as chaves ja normalizadas (BUG-008). */
export async function readMemberQuotas(uid: string): Promise<MemberQuotaWallet | null> {
  const matricula = await resolveMatriculaByUid(uid);
  if (!matricula) throw new Error("Matricula nao vinculada ao UID.");

  const db = getAdminDb();
  const doc = await db.doc(`User/${matricula}/User_Permissions/quotas`).get();

  if (!doc.exists) return null;
  const wallet = safeSerialize<MemberQuotaWallet>(doc.data());

  // Normalizacao canonica de chaves (BUG-008): dobra 1-TO-1/mentoria_1to1 ->
  // 1-to-1 e mescla duplicatas de case, para todo leitor ver a mesma chave.
  wallet.quotas = foldQuotaMap(wallet.quotas);

  return wallet;
}

/**
 * SOMA as cotas informadas ao saldo existente.
 *
 * A soma e intencional e pedida pela Gestora: uma nova aquisicao do mesmo
 * servico — ou de outro servico que conceda a mesma cota — deve **acumular**.
 * Atencao: a edicao manual no painel do admin usa esta mesma funcao hoje e por
 * isso **dobra** o saldo ao salvar duas vezes (`BUG-104`, a tratar em PR
 * proprio, onde esta camada ganha um `setMemberQuotas` explicito ao lado deste).
 */
export async function addMemberQuotas(uid: string, newQuotas: Record<string, number>) {
  const matricula = await resolveMatriculaByUid(uid);
  if (!matricula) throw new Error("Matricula nao vinculada ao UID.");

  const db = getAdminDb();
  const walletRef = db.doc(`User/${matricula}/User_Permissions/quotas`);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(walletRef);
    const now = new Date().toISOString();

    // Normaliza + mescla as chaves ja existentes antes de somar (auto-cura o
    // drift de case a cada escrita — BUG-008). Chave canonica = minuscula do
    // catalogo; nao forcar mais UPPERCASE.
    const currentQuotas: Record<string, MemberQuota> = doc.exists
      ? foldQuotaMap((doc.data() as MemberQuotaWallet).quotas)
      : {};

    for (const [type, amount] of Object.entries(newQuotas)) {
      const normalizedType = normalizeQuotaKey(type);
      const current = currentQuotas[normalizedType] || { total: 0, used: 0, lastUpdated: now };
      currentQuotas[normalizedType] = {
        total: current.total + amount,
        used: current.used,
        lastUpdated: now
      };
    }

    // Substitui o campo `quotas` inteiro (remove chaves-lixo de case antigas —
    // set(merge:true) NUNCA apaga chave de map, ver L16). update() falha se o
    // doc nao existir, entao usa set completo no primeiro deposito.
    if (doc.exists) {
      transaction.update(walletRef, { uid, quotas: currentQuotas, updatedAt: now });
    } else {
      transaction.set(walletRef, { uid, quotas: currentQuotas, updatedAt: now });
    }
  });

  return { success: true };
}

/** Consome um credito de servico (ex.: ao confirmar agendamento). */
export async function consumeMemberQuota(uid: string, eventTypeId: string) {
  const matricula = await resolveMatriculaByUid(uid);
  if (!matricula) throw new Error("Matricula nao vinculada ao UID.");

  const db = getAdminDb();
  const walletRef = db.doc(`User/${matricula}/User_Permissions/quotas`);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(walletRef);
    if (!doc.exists) throw new Error("Membro nao possui carteira de cotas.");

    const wallet = doc.data() as MemberQuotaWallet;
    // Normaliza + mescla as chaves (BUG-008) antes de localizar a cota-alvo.
    const quotas = foldQuotaMap(wallet.quotas);

    const targetKey = normalizeQuotaKey(eventTypeId);
    const quota = quotas[targetKey];

    if (!quota || quota.used >= quota.total) {
      throw new Error(`Saldo insuficiente para o servico: ${targetKey}`);
    }

    transaction.update(walletRef, {
      quotas: {
        ...quotas,
        [targetKey]: {
          ...quota,
          used: (quota.used || 0) + 1,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  });

  return { success: true };
}

/**
 * DEFINE o total das cotas informadas (nao soma).
 *
 * Irma de `addMemberQuotas`, e a distincao e o `BUG-104`: as duas operacoes eram
 * a MESMA funcao, e o nome ("update") nao dizia qual delas acontecia. O painel do
 * admin exibe o valor atual no campo e reenviava esse mesmo valor — que era
 * SOMADO ao saldo. Abrir a ficha e salvar duas vezes DOBRAVA a cota do membro.
 *
 * A soma continua existindo e e intencional (decisao da Gestora): uma nova
 * aquisicao do mesmo servico — ou de outro que conceda a mesma cota — deve
 * acumular. O que faltava era o nome da funcao dizer o que ela faz, em vez de a
 * intencao viver na cabeca de quem chama.
 *
 * | Uso | Chamador | Operacao |
 * |---|---|---|
 * | Nova aquisicao (compra, cupom) | `lib/checkout.ts` (webhook) | `addMemberQuotas` |
 * | Edicao manual da ficha | `admin/users` | `setMemberQuotas` |
 *
 * **`used` e SEMPRE preservado**: o admin edita o total contratado, nunca o que
 * ja foi consumido. E chaves que nao vierem no parametro ficam intactas — o
 * painel envia so as cotas de servicos ativos, e apagar as demais seria uma
 * mudanca de dado alem da intencao.
 */
export async function setMemberQuotas(uid: string, quotas: Record<string, number>) {
  const matricula = await resolveMatriculaByUid(uid);
  if (!matricula) throw new Error("Matricula nao vinculada ao UID.");

  const db = getAdminDb();
  const walletRef = db.doc(`User/${matricula}/User_Permissions/quotas`);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(walletRef);
    const now = new Date().toISOString();

    // Normaliza + mescla as chaves ja existentes (auto-cura o drift de case —
    // BUG-008), igual ao `addMemberQuotas`.
    const currentQuotas: Record<string, MemberQuota> = doc.exists
      ? foldQuotaMap((doc.data() as MemberQuotaWallet).quotas)
      : {};

    for (const [type, amount] of Object.entries(quotas)) {
      const normalizedType = normalizeQuotaKey(type);
      const current = currentQuotas[normalizedType];
      currentQuotas[normalizedType] = {
        total: amount,
        // Preserva o consumo: o admin define o CONTRATADO, nao o usado.
        used: current?.used ?? 0,
        lastUpdated: now
      };
    }

    if (doc.exists) {
      transaction.update(walletRef, { uid, quotas: currentQuotas, updatedAt: now });
    } else {
      transaction.set(walletRef, { uid, quotas: currentQuotas, updatedAt: now });
    }
  });

  return { success: true };
}
