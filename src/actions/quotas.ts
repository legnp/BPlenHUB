"use server";

import { requireAdmin, requireAuth, AuthorizationError } from "@/lib/auth-guards";
import { MemberQuotaWallet } from "@/types/entitlements";
import { getErrorMessage } from "@/lib/utils/errors";
import { setMemberQuotas, readMemberQuotas, consumeMemberQuota } from "@/lib/member-quotas";

/**
 * BPlen HUB — Quota Engine (superficie exposta)
 *
 * Este arquivo e `"use server"`: tudo que ele exporta e um **endpoint de rede
 * real**, chamavel por quem conhecer a assinatura. Por isso aqui so moram
 * guards + delegacao — a logica vive em `@/lib/member-quotas` (camada crua).
 *
 * Ate o `BUG-103` estas tres actions nao tinham guard nenhum: um chamador nao
 * autenticado podia conceder cota arbitraria passando o `uid` de qualquer
 * pessoa. A protecao era so a UI nao expor o botao — a mesma premissa que o
 * `BUG-020` derrubou.
 *
 * **Nao mova estes guards para a camada crua**: o webhook do Mercado Pago
 * concede cota apos o pagamento e nao tem sessao de usuario (autentica por HMAC).
 * Guardar la faria o cliente pagar e nao receber a cota. Ver `member-quotas.ts`.
 */

/**
 * Busca a carteira de cotas de um membro.
 * Dono-ou-admin: o membro le a propria (`useJourney`, modal do 1 to 1) e o admin
 * le a de qualquer um (`admin/users`).
 */
export async function getMemberQuotasAction(uid: string): Promise<MemberQuotaWallet | null> {
  try {
    const session = await requireAuth();
    if (session.uid !== uid && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode acessar a carteira de cotas de outro membro.");
    }
    return await readMemberQuotas(uid);
  } catch (error) {
    console.error(`Erro ao buscar cotas do membro ${uid}:`, error);
    return null;
  }
}

/**
 * DEFINE o total das cotas de um membro (uso administrativo).
 *
 * Substitui a antiga `updateMemberQuotasAction`, cujo nome nao dizia se somava ou
 * definia — e ela SOMAVA. O painel exibe o valor atual no campo e reenviava esse
 * mesmo valor, entao abrir a ficha e salvar duas vezes DOBRAVA a cota (`BUG-104`).
 *
 * `requireAdmin` e a trava certa: o unico chamador e o painel `admin/users`,
 * editando a cota de OUTRA pessoa — uma trava de dono barraria a propria Gestora.
 * A concessao automatica pos-compra NAO passa por aqui: ela chama
 * `addMemberQuotas` direto da camada crua, que SOMA (ver `lib/checkout.ts`).
 */
export async function setMemberQuotasAction(uid: string, quotas: Record<string, number>) {
  try {
    await requireAdmin();
    return await setMemberQuotas(uid, quotas);
  } catch (error) {
    console.error(`Erro ao definir cotas do membro ${uid}:`, error);
    throw new Error("Falha ao atualizar carteira de cotas.");
  }
}

/**
 * Consome um credito de servico (ex.: ao confirmar agendamento).
 * Sem chamadores hoje — o consumo ainda nao esta ligado ao booking (`BUG-013`).
 */
export async function consumeQuotaAction(uid: string, eventTypeId: string) {
  try {
    const session = await requireAuth();
    if (session.uid !== uid && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode consumir a cota de outro membro.");
    }
    return await consumeMemberQuota(uid, eventTypeId);
  } catch (error: unknown) {
    console.error(`Erro ao consumir cota do membro ${uid}:`, error);
    return { success: false, error: getErrorMessage(error) };
  }
}
