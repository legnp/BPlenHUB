import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";

/**
 * Resolucao de matricula a partir da identidade.
 *
 * **A logica vive em `@/lib/identity/find-matricula` — este arquivo e so o nome
 * historico pelo qual 6 modulos ja a chamam.** Ate o lote 2b.2 do `BUG-103` havia
 * aqui uma copia inteira da resolucao, irma da de `survey-effects.ts`; foi essa
 * duplicacao que permitiu ao padrao do `BUG-032` sobreviver ate virar o `BUG-106`
 * (sequestro de conta). Consolidado numa fonte unica para que o proximo
 * endurecimento valha para todos os chamadores de uma vez (Licoes 21/37/44).
 *
 * Este arquivo **nao e `"use server"`**: nao e endpoint de rede. Ate o `BUG-103`
 * a funcao era exportada de `actions/get-user-results.ts` (que e `"use server"`),
 * logo qualquer um podia descobrir a matricula de outra pessoa por uid/e-mail.
 * Guarda-la no lugar nao servia: e primitivo de infraestrutura chamado por
 * checkout, cupom, mp-checkout, orders, perfil e cadastro, que **ja autenticaram**
 * e passam `session.uid` — um guard seria redundante em ~20 pontos e custaria uma
 * leitura de sessao no caminho quente do checkout (Protocolo item 8).
 *
 * **CONTRATO DO `verifiedEmail` (BUG-106, CRITICO).** So aceita e-mail de sessao
 * verificada, e so quando a sessao e o DONO do `userUid`. Detalhe completo no
 * cabecalho de `find-matricula.ts`. Na duvida, passe `undefined`.
 */
export async function resolveMatricula(
  userUid: string,
  verifiedEmail?: string
): Promise<string | null> {
  return findMatriculaByIdentity(userUid, verifiedEmail);
}
