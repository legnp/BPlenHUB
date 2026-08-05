"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getSurveyConfig } from "@/config/surveys";
import { buildGenericSurveyRow } from "@/lib/survey/survey-serializer";
import { syncSurveyToUserDrive } from "@/lib/drive-sync";
import { DRIVE_FOLDERS } from "@/lib/drive-utils";
import { getErrorMessage } from "@/lib/utils/errors";
import type { SurveyValue } from "@/types/survey";

/**
 * BPlen HUB — Resgate retroativo do acervo do usuario.
 *
 * A cobertura no Drive dependia de uma allowlist por surveyId: quem nao estivesse
 * nela era gravado so no Firestore. A correcao no dispatcher vale dali para a
 * frente — o que ja tinha sido respondido continua invisivel na pasta do usuario
 * ate alguem ir buscar. E isto que esta funcao faz.
 *
 * Idempotente por construcao: a chave de cada linha e o carimbo do envio, e o
 * append so acontece se aquele carimbo ainda nao estiver na planilha. Rodar duas
 * vezes nao duplica nada, entao a Gestora pode reexecutar sem medo.
 *
 * Complementa `triggerRetroactiveDriveSyncAction` (financeiro, jornada, backlog),
 * que ja existia e nao cobria surveys nem formularios.
 */

/** Converte o `submittedAt` do Firestore (Timestamp, string ou Date) em Date. */
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const candidate = (value as { toDate: () => Date }).toDate();
    return isNaN(candidate.getTime()) ? undefined : candidate;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

export interface BackfillReport {
  matricula: string;
  surveysFound: number;
  surveysWritten: number;
  surveysSkipped: number;
  formsFound: number;
  formsWritten: number;
  /** Comprovantes de aceite de termos gerados a partir de User_Consent_History. */
  consentWritten: number;
  /** Linhas de trilha de assinatura geradas a partir de Legal_Audits. */
  auditsWritten: number;
  /** Feedbacks de carreira espelhados. */
  feedbacksWritten: number;
  /** 1 se o snapshot de objetivos foi (re)gerado, 0 se nao havia objetivos. */
  objectivesWritten: number;
  /** Chamados de suporte espelhados. */
  ticketsWritten: number;
  /** Transferencias de titularidade espelhadas. */
  transfersWritten: number;
  failures: string[];
}

async function backfillOneUser(matricula: string, dryRun: boolean): Promise<BackfillReport> {
  const db = getAdminDb();
  const report: BackfillReport = {
    matricula,
    surveysFound: 0,
    surveysWritten: 0,
    surveysSkipped: 0,
    formsFound: 0,
    formsWritten: 0,
    consentWritten: 0,
    auditsWritten: 0,
    feedbacksWritten: 0,
    objectivesWritten: 0,
    ticketsWritten: 0,
    transfersWritten: 0,
    failures: [],
  };

  const [surveysSnap, formsSnap] = await Promise.all([
    db.collection(`User/${matricula}/Surveys`).get(),
    db.collection(`User/${matricula}/Forms`).get(),
  ]);

  report.surveysFound = surveysSnap.size;
  report.formsFound = formsSnap.size;

  for (const doc of surveysSnap.docs) {
    const data = doc.data();
    const surveyId = typeof data.surveyId === "string" && data.surveyId ? data.surveyId : doc.id;
    const responses = (data.data ?? {}) as Record<string, SurveyValue>;

    // Sem respostas nao ha o que espelhar (rascunho aberto e abandonado).
    if (Object.keys(responses).length === 0) {
      report.surveysSkipped += 1;
      continue;
    }

    const submittedAt = toDate(data.submittedAt);
    const config = getSurveyConfig(surveyId);
    const { headers, rowData } = buildGenericSurveyRow(
      surveyId,
      responses,
      matricula,
      config,
      submittedAt
    );

    if (dryRun) {
      report.surveysWritten += 1;
      continue;
    }

    try {
      await syncSurveyToUserDrive({
        matricula,
        surveyTitle: `${config?.title || surveyId} (Respostas completas)`,
        headers,
        rowData,
        targetFolderOverride: DRIVE_FOLDERS.SURVEYS,
        // Chave de idempotencia: o carimbo do envio, que e a propria coluna A.
        skipIfFirstColumnMatches: String(rowData[0] ?? ""),
      });
      report.surveysWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`survey ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  for (const doc of formsSnap.docs) {
    const data = doc.data();
    const formId = typeof data.formId === "string" && data.formId ? data.formId : doc.id;
    const responses = (data.data ?? {}) as Record<string, SurveyValue>;

    if (Object.keys(responses).length === 0) continue;

    const submittedAt = toDate(data.submittedAt);
    // Formulario nao tem definicao no registry de surveys: as colunas saem das
    // proprias chaves da resposta (o serializador ja cobre esse caso).
    const { headers, rowData } = buildGenericSurveyRow(
      formId,
      responses,
      matricula,
      undefined,
      submittedAt
    );

    if (dryRun) {
      report.formsWritten += 1;
      continue;
    }

    try {
      await syncSurveyToUserDrive({
        matricula,
        surveyTitle: `${formId} (Respostas completas)`,
        headers,
        rowData,
        targetFolderOverride: DRIVE_FOLDERS.SURVEYS,
        skipIfFirstColumnMatches: String(rowData[0] ?? ""),
      });
      report.formsWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`form ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  await backfillProofTrails(matricula, dryRun, report);

  return report;
}

/**
 * Categorias com valor probatorio e material de acompanhamento.
 *
 * Separado do bloco de respostas porque a natureza e outra: aqui nao ha
 * definicao de survey para derivar colunas, e cada categoria tem forma propria e
 * conhecida (tipada). O que se mantem e a idempotencia — comprovante pelo nome
 * do arquivo, series pelo carimbo na coluna A.
 */
async function backfillProofTrails(
  matricula: string,
  dryRun: boolean,
  report: BackfillReport
): Promise<void> {
  const db = getAdminDb();

  const [consentSnap, auditsSnap, feedbacksSnap, objectivesSnap, ticketsSnap, transfersSnap] =
    await Promise.all([
      db.collection(`User/${matricula}/User_Consent_History`).get(),
      db.collection(`User/${matricula}/Legal_Audits`).get(),
      db.collection(`User/${matricula}/Feedbacks`).get(),
      db.collection(`User/${matricula}/Career_Objectives`).get(),
      db.collection(`User/${matricula}/Support_Tickets`).get(),
      // Colecao de raiz: a transferencia e indexada pela matricula que sobrevive.
      // Igualdade em campo unico usa o indice automatico — nao exige indice novo.
      db.collection("_AccountTransfers").where("sourceMatricula", "==", matricula).get(),
    ]);

  const {
    syncConsentAcceptanceToDrive,
    syncLegalAuditToUserDrive,
    syncCareerFeedbackToUserDrive,
    syncCareerObjectivesToUserDrive,
    syncSupportTicketToUserDrive,
    syncAccountTransferToUserDrive,
  } = await import("@/lib/drive-sync");

  // 1. Comprovantes de aceite de termos.
  for (const doc of consentSnap.docs) {
    const data = doc.data();
    const acceptedAt = toDate(data.acceptedAt);
    // Sem carimbo nao da para nomear o comprovante de forma estavel, e um nome
    // instavel quebraria a idempotencia (geraria um arquivo novo a cada resgate).
    if (!acceptedAt) {
      report.failures.push(`consent ${doc.id}: sem data de aceite`);
      continue;
    }

    if (dryRun) {
      report.consentWritten += 1;
      continue;
    }

    try {
      await syncConsentAcceptanceToDrive(matricula, {
        version: String(data.version || "sem-versao"),
        birthDate: String(data.birthDate || "nao informada"),
        newsletterOptIn: data.newsletterOptIn === true,
        proof: {
          ip: String(data.ip || "desconhecido"),
          userAgent: String(data.userAgent || "desconhecido"),
          deviceType: String(data.deviceType || "unknown"),
          location: formatGeo(data.geo),
          acceptedAt,
        },
      });
      report.consentWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`consent ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  // 2. Trilha de auditoria das assinaturas.
  for (const doc of auditsSnap.docs) {
    const data = doc.data();
    if (dryRun) {
      report.auditsWritten += 1;
      continue;
    }

    try {
      await syncLegalAuditToUserDrive(matricula, {
        auditId: String(data.auditId || doc.id),
        timestamp: String(data.timestamp || ""),
        productId: String(data.productId || ""),
        orderId: data.orderId ? String(data.orderId) : null,
        paymentId: data.paymentId ? String(data.paymentId) : null,
        verificationCode: String(data.verificationCode || ""),
        documentHash: String(data.documentHash || ""),
        verificationHash: String(data.verificationHash || ""),
        ipAddress: String(data.ipAddress || ""),
        location: formatGeo(data.geo),
        documentUrl: String(data.documentUrl || ""),
      });
      report.auditsWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`audit ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  // 3. Feedbacks de carreira.
  for (const doc of feedbacksSnap.docs) {
    const data = doc.data();
    if (dryRun) {
      report.feedbacksWritten += 1;
      continue;
    }

    try {
      await syncCareerFeedbackToUserDrive(matricula, {
        title: String(data.title || ""),
        content: String(data.content || ""),
        author: String(data.author || ""),
        createdAt: String(data.createdAt || ""),
      });
      report.feedbacksWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`feedback ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  // 4. Chamados de suporte.
  for (const doc of ticketsSnap.docs) {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    if (dryRun) {
      report.ticketsWritten += 1;
      continue;
    }

    try {
      await syncSupportTicketToUserDrive(matricula, {
        // Mesma formatacao do gancho ao vivo — a chave de idempotencia e esta string.
        createdAt: createdAt ? createdAt.toLocaleString("pt-BR") : "",
        description: String(data.description || ""),
        currentPage: data.currentPage ? String(data.currentPage) : null,
        status: String(data.status || "open"),
        priority: String(data.priority || "normal"),
        attachment: data.imageName ? String(data.imageName) : null,
      });
      report.ticketsWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`ticket ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  // 5. Transferencias de titularidade.
  for (const doc of transfersSnap.docs) {
    const data = doc.data();
    if (dryRun) {
      report.transfersWritten += 1;
      continue;
    }

    const performedAt = toDate(data.performedAt);
    try {
      await syncAccountTransferToUserDrive(matricula, {
        // Mesma formatacao do gancho ao vivo — a chave de idempotencia e esta string.
        performedAt: performedAt ? performedAt.toLocaleString("pt-BR") : "",
        targetEmail: String(data.targetEmail || ""),
        orphanMatricula: data.orphanMatricula ? String(data.orphanMatricula) : null,
        removedUids: Array.isArray(data.removedUids) ? data.removedUids.length : 0,
        performedBy: String(data.performedBy || ""),
      });
      report.transfersWritten += 1;
    } catch (error: unknown) {
      report.failures.push(`transferencia ${doc.id}: ${getErrorMessage(error)}`);
    }
  }

  // 6. Objetivos de carreira (snapshot unico, nao linha a linha).
  if (!objectivesSnap.empty) {
    if (dryRun) {
      report.objectivesWritten = 1;
      return;
    }

    try {
      await syncCareerObjectivesToUserDrive(
        matricula,
        objectivesSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            title: String(data.title || ""),
            description: data.description ? String(data.description) : undefined,
            status: String(data.status || ""),
            targetDate: data.targetDate ? String(data.targetDate) : undefined,
            createdAt: String(data.createdAt || ""),
            completedAt: data.completedAt ? String(data.completedAt) : undefined,
            goals: Array.isArray(data.goals) ? data.goals : [],
          };
        })
      );
      report.objectivesWritten = 1;
    } catch (error: unknown) {
      report.failures.push(`objetivos: ${getErrorMessage(error)}`);
    }
  }
}

/** Achata a geo gravada no Firestore para a celula de planilha. */
function formatGeo(geo: unknown): string {
  if (typeof geo !== "object" || geo === null) return "";
  const g = geo as Record<string, unknown>;
  const cityRegion = [g.city, g.region].filter(Boolean).join("/");
  return [cityRegion, g.country].filter(Boolean).join(", ");
}

/**
 * Resgata o acervo de UM usuario (ou de todos, quando `matricula` vem vazia).
 *
 * `dryRun` e o padrao de proposito: a varredura completa escreve em massa no
 * Drive de todos os membros, e a Gestora precisa ver o tamanho do estrago antes
 * de autorizar. Nada e gravado ate `dryRun: false` explicito.
 */
export async function backfillUserDriveAction(
  input: { matricula?: string; dryRun?: boolean },
  adminToken?: string
): Promise<{ success: boolean; reports?: BackfillReport[]; error?: string }> {
  try {
    await requireAdmin(adminToken);

    const dryRun = input.dryRun !== false;
    const db = getAdminDb();

    let matriculas: string[];
    if (input.matricula) {
      const userSnap = await db.doc(`User/${input.matricula}`).get();
      if (!userSnap.exists) {
        return { success: false, error: `Usuario ${input.matricula} nao encontrado.` };
      }
      matriculas = [input.matricula];
    } else {
      const usersSnap = await db.collection("User").get();
      matriculas = usersSnap.docs.map((doc) => doc.id);
    }

    console.log(
      `[BackfillDrive] Iniciando resgate para ${matriculas.length} usuario(s). Modo: ${dryRun ? "simulacao" : "gravacao"}.`
    );

    const reports: BackfillReport[] = [];
    // Sequencial de proposito: a API do Drive tem cota por minuto, e uma varredura
    // paralela da base inteira a estoura.
    for (const matricula of matriculas) {
      reports.push(await backfillOneUser(matricula, dryRun));
    }

    const totalSurveys = reports.reduce((sum, r) => sum + r.surveysWritten, 0);
    const totalForms = reports.reduce((sum, r) => sum + r.formsWritten, 0);
    console.log(
      `[BackfillDrive] Concluido. Surveys: ${totalSurveys}, formularios: ${totalForms}, modo: ${dryRun ? "simulacao" : "gravacao"}.`
    );

    return { success: true, reports };
  } catch (error: unknown) {
    console.error("[BackfillDrive] Falha no resgate retroativo:", getErrorMessage(error));
    return { success: false, error: getErrorMessage(error, "Falha no resgate retroativo.") };
  }
}
