"use server";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { PartnerDirectoryEntry, PartnerDirectorySchema } from "@/types/partners";

/**
 * BPlen HUB — Diretorio de Parceiros.
 *
 * E' a lista que alimenta a pergunta "Como voce nos conheceu?" da Welcome Survey
 * (PARTNER-AREA-EXPANSION-PLAN.md secao 1.3 e 4). A captura da indicacao nao tem link
 * nem codigo: o proprio cliente diz quem o indicou, escolhendo um NOME.
 *
 * Por isso a leitura publica devolve SO os nomes: a matricula do parceiro nunca chega
 * ao navegador de terceiros. A resolucao nome -> parceiro acontece no servidor, no
 * efeito da survey (`resolvePartnerByDisplayName`).
 */

const DIRECTORY_DOC = "Settings/PartnerDirectory";

async function readDirectory(): Promise<PartnerDirectoryEntry[]> {
  const snap = await getAdminDb().doc(DIRECTORY_DOC).get();
  if (!snap.exists) return [];
  const parsed = PartnerDirectorySchema.safeParse(snap.data());
  if (!parsed.success) {
    console.error("[partner-directory] Diretorio com formato invalido — tratado como vazio.");
    return [];
  }
  return parsed.data.entries;
}

/** Nomes ativos, para as opcoes da Welcome Survey. Exige apenas sessao valida. */
export async function getPartnerDirectoryOptionsAction(): Promise<string[]> {
  try {
    await requireAuth();
    const entries = await readDirectory();
    return entries
      .filter((e) => e.active && e.displayName.trim().length > 0)
      .map((e) => e.displayName.trim())
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-directory] Falha ao ler as opcoes de indicacao:", message);
    // A recepcao nao pode quebrar por causa disto: sem opcoes, a pergunta segue com
    // as origens fixas de sempre.
    return [];
  }
}

/**
 * Parceiros do programa, para a tela de operacao dos ciclos (admin).
 *
 * A lista sai do diretorio porque e' ele que a ficha do usuario alimenta ao conceder o
 * selo. Parceiro desativado continua aparecendo: revogar o acesso nao encerra os ciclos
 * que ele ja tem — o repasse pendente precisa continuar visivel para ser pago.
 */
export async function getPartnersProgramListAction(
  adminToken?: string
): Promise<Array<PartnerDirectoryEntry & { commissionPercent: number; name: string }>> {
  try {
    await requireAdmin(adminToken);
    const db = getAdminDb();
    const entries = await readDirectory();

    const detalhados = await Promise.all(
      entries.map(async (entry) => {
        const [accessSnap, userSnap] = await Promise.all([
          db.doc(`User/${entry.partnerMatricula}/User_Permissions/access`).get(),
          db.doc(`User/${entry.partnerMatricula}`).get(),
        ]);
        const user = userSnap.data();
        return {
          ...entry,
          commissionPercent:
            typeof accessSnap.data()?.partnerCommissionPercent === "number"
              ? (accessSnap.data()?.partnerCommissionPercent as number)
              : 0,
          name: String(user?.Authentication_Name || user?.User_Name || entry.displayName),
        };
      })
    );

    return detalhados.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-directory] Falha ao listar os parceiros do programa:", message);
    return [];
  }
}

/** Diretorio completo (admin). */
export async function getPartnerDirectoryAction(
  adminToken?: string
): Promise<PartnerDirectoryEntry[]> {
  try {
    await requireAdmin(adminToken);
    return await readDirectory();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-directory] Falha ao ler o diretorio:", message);
    return [];
  }
}

/**
 * Cria/atualiza a entrada de um parceiro. Chamado quando o Admin concede (ou revoga) o
 * selo na ficha do usuario — revogar NAO apaga a entrada, so a desativa: o historico de
 * indicacoes ja registradas continua fazendo sentido.
 */
export async function upsertPartnerDirectoryEntryAction(
  input: { partnerMatricula: string; displayName: string; active: boolean },
  adminToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin(adminToken);

    const displayName = input.displayName.trim();
    if (input.active && displayName.length < 2) {
      return {
        success: false,
        error: "Informe o nome que o cliente vera na lista de indicacao.",
      };
    }

    const entries = await readDirectory();
    const outros = entries.filter((e) => e.partnerMatricula !== input.partnerMatricula);

    // Nome duplicado tornaria a resolucao ambigua e silenciosa — a indicacao iria para
    // o parceiro errado. Recusa explicita e melhor do que sorteio.
    const conflito = outros.find(
      (e) => e.active && e.displayName.trim().toLowerCase() === displayName.toLowerCase()
    );
    if (input.active && conflito) {
      return {
        success: false,
        error: `Ja existe um parceiro ativo com o nome "${displayName}". Use um nome distinto.`,
      };
    }

    const proximas = [
      ...outros,
      { partnerMatricula: input.partnerMatricula, displayName, active: input.active },
    ];

    await getAdminDb().doc(DIRECTORY_DOC).set({ entries: proximas }, { merge: true });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-directory] Falha ao gravar entrada do diretorio:", message);
    return { success: false, error: "Nao foi possivel salvar o nome de indicacao agora." };
  }
}
