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

  return report;
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
