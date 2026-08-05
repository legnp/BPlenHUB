import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { PartnerDirectorySchema } from "@/types/partners";

/**
 * Registro da indicacao — modulo de SERVIDOR, nao server action.
 *
 * Mesma disciplina de `src/actions/effects/*`: sem `"use server"` nao ha porta na rede.
 * O unico chamador e' o efeito da Welcome Survey, que roda depois de a identidade ja
 * ter sido resolvida pela sessao (BUG-103 / Protocolo item 8).
 *
 * Mecanismo (decisao da Gestora, plano secao 4): nao existe link nem codigo de
 * indicacao. O proprio cliente escolhe, na pergunta "Como voce nos conheceu?", o NOME
 * do parceiro. Aqui esse nome vira matricula e a indicacao e' gravada sob o parceiro.
 */

/** Normaliza para comparar nome escolhido x nome cadastrado, sem acento nem caixa. */
function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Resolve o parceiro dono de um nome do diretorio. Server-only. */
export async function resolvePartnerByDisplayName(
  displayName: string
): Promise<{ partnerMatricula: string; displayName: string } | null> {
  const alvo = normalizeName(displayName || "");
  if (!alvo) return null;

  const snap = await getAdminDb().doc("Settings/PartnerDirectory").get();
  if (!snap.exists) return null;

  const parsed = PartnerDirectorySchema.safeParse(snap.data());
  if (!parsed.success) return null;

  const entry = parsed.data.entries.find(
    (e) => e.active && normalizeName(e.displayName) === alvo
  );
  return entry ? { partnerMatricula: entry.partnerMatricula, displayName: entry.displayName } : null;
}

/**
 * Grava a indicacao sob o parceiro, se a origem escolhida for um nome do diretorio.
 *
 * Idempotente por construcao: o id do documento e' a matricula do indicado, e a
 * Welcome Survey roda uma vez por usuario. Nao lanca — indicacao e' efeito colateral do
 * onboarding, e uma falha aqui nunca pode derrubar a entrada do cliente no hub.
 */
export async function registerReferralFromOrigin(input: {
  origin: string;
  referredMatricula: string;
  referredNome: string;
  cpfHash?: string | null;
}): Promise<{ registered: boolean; partnerMatricula?: string }> {
  try {
    const partner = await resolvePartnerByDisplayName(input.origin);
    if (!partner) return { registered: false };

    // Indicar a si mesmo nao e' indicacao.
    if (partner.partnerMatricula === input.referredMatricula) {
      console.warn("[partner-referrals] Origem aponta para o proprio usuario — ignorada.");
      return { registered: false };
    }

    const db = getAdminDb();

    // Copia do percentual VIGENTE: mudar a taxa do parceiro depois nao reescreve
    // indicacoes ja geradas (plano secao 1.2).
    const accessSnap = await db.doc(`User/${partner.partnerMatricula}/User_Permissions/access`).get();
    const commissionPercent =
      typeof accessSnap.data()?.partnerCommissionPercent === "number"
        ? (accessSnap.data()?.partnerCommissionPercent as number)
        : 0;

    await db
      .doc(`User/${partner.partnerMatricula}/Partner_Referrals/${input.referredMatricula}`)
      .set(
        {
          referredMatricula: input.referredMatricula,
          referredNome: input.referredNome,
          cpfHash: input.cpfHash ?? null,
          dataIndicacao: new Date().toISOString(),
          registeredAt: admin.firestore.FieldValue.serverTimestamp(),
          commissionPercent,
          source: "welcome_survey",
        },
        { merge: true }
      );

    console.log(
      `[partner-referrals] Indicacao registrada para o parceiro ${partner.partnerMatricula}.`
    );
    return { registered: true, partnerMatricula: partner.partnerMatricula };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-referrals] Falha ao registrar indicacao:", message);
    return { registered: false };
  }
}
