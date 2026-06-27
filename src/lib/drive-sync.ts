import { getDriveClient, getSheetsClient } from "@/lib/google-auth";
import { serverEnv } from "@/env";
import { ensureFolder, createSpreadsheet, getOrCreateSpreadsheet, syncDataToSheet, appendDataToSheet, getStandardFolderWithHealing, uploadFileToDrive, DRIVE_FOLDERS, LEGACY_FOLDERS } from "@/lib/drive-utils";

/**
 * BPlen HUB — Drive Sync Service (🏁)
 * Coordena a hierarquia de pastas e sincronização de dados no Google Drive/Sheets.
 * Centraliza a inteligência de onde salvar cada dado baseada no tipo de usuário e matrícula.
 */

interface SurveySyncConfig {
  matricula: string;
  surveyTitle: string;
  headers: string[];
  rowData: (string | number | boolean | null)[];
}

/**
 * Sincroniza dados de uma pesquisa para a pasta do usuário no Google Drive.
 * Padrão: 2.x (B2B/B2C) -> {Matricula} -> 1.Surveys -> {SurveyTitle}.
 * 
 * @param config Configuração da pesquisa e dados a sincronizar.
 * @returns O ID da planilha criada ou atualizada.
 */
export async function syncSurveyToUserDrive(config: SurveySyncConfig) {
  const { matricula, surveyTitle, headers, rowData } = config;

  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;

    // 1. Resolver categoria (B2B vs B2C)
    const isPJ = matricula.includes("-PJ-");
    const categoryName = isPJ ? "2.3.B2B" : "2.2.B2C";

    // 2. Garantir hierarquia (Cascata 🛰️)
    const catFolderId = await ensureFolder(drive, baseFolderId, categoryName);
    const userFolderId = await ensureFolder(drive, catFolderId, matricula);

    // Identificar destino baseado no título
    const isCadastro = surveyTitle.toLowerCase().includes("cadastro") || surveyTitle.toLowerCase().includes("perfil");
    const targetFolder = isCadastro ? DRIVE_FOLDERS.CADASTRO : DRIVE_FOLDERS.SURVEYS;
    const legacyFolders = isCadastro ? LEGACY_FOLDERS.CADASTRO : LEGACY_FOLDERS.SURVEYS;

    const targetFolderId = await getStandardFolderWithHealing(drive, userFolderId, targetFolder, legacyFolders);

    // 3. Criar/Atualizar Planilha
    const { id: spreadsheetId } = await getOrCreateSpreadsheet(drive, targetFolderId, `${surveyTitle} - ${matricula}`);

    // 4. Sincronizar Dados
    await syncDataToSheet(sheets, spreadsheetId, headers, [rowData]);

    console.log(`✅ [DriveSync] Dados sincronizados: ${surveyTitle} -> ${matricula}`);
    return spreadsheetId;

  } catch (err) {
    // Fail-soft: Logs erro mas não derruba a execução principal das server actions
    console.error(`❌ [DriveSync] Falha crítica na sincronização (${surveyTitle}):`, err);
    throw err;
  }
}

/**
 * Helper para obter a pasta raiz de um usuário.
 */
export async function getUserRootFolder(matricula: string) {
  const drive = await getDriveClient();
  const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;
  const isPJ = matricula.includes("-PJ-");
  const categoryName = isPJ ? "2.3.B2B" : "2.2.B2C";

  const catFolderId = await ensureFolder(drive, baseFolderId, categoryName);
  return await ensureFolder(drive, catFolderId, matricula);
}

/**
 * 💰 Sincroniza dados financeiros (Extrato de Ordens)
 */
export async function syncOrderToUserDrive(matricula: string, rowData: (string | number | boolean | null)[]) {
  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const userFolderId = await getUserRootFolder(matricula);

    const financeFolderId = await getStandardFolderWithHealing(drive, userFolderId, DRIVE_FOLDERS.FINANCEIRO);
    const fileName = `Extrato_Financeiro - ${matricula}`;

    const { id: spreadsheetId } = await getOrCreateSpreadsheet(drive, financeFolderId, fileName);

    const headers = ["Data", "Order ID", "Produto", "Valor Original", "Desconto", "Valor Pago", "Status"];
    await appendDataToSheet(sheets, spreadsheetId, headers, rowData);

    console.log(`✅ [DriveSync:Finance] Ordem anexada: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`❌ [DriveSync:Finance] Falha ao sincronizar ordem:`, err);
    throw err;
  }
}

/**
 * 🗺️ Sincroniza o Snapshot da Jornada (Progresso)
 */
export async function syncJourneyToUserDrive(matricula: string, rowsData: (string | number | boolean | null)[][]) {
  try {
    console.log(`[DriveSync:Journey] Iniciando sincronização do Snapshot para ${matricula}...`);
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const userFolderId = await getUserRootFolder(matricula);

    const acompanhamentoFolderId = await getStandardFolderWithHealing(drive, userFolderId, DRIVE_FOLDERS.ACOMPANHAMENTO);
    const fileName = `Progresso_Jornada - ${matricula}`;

    const { id: spreadsheetId } = await getOrCreateSpreadsheet(drive, acompanhamentoFolderId, fileName);

    const headers = ["Fase (Módulo)", "Checkpoint (Atividade)", "Status", "Data de Conclusão", "Última Atualização", "Progresso Global (%)"];
    
    // Para jornada, nós sobrescrevemos (Snapshot)
    await syncDataToSheet(sheets, spreadsheetId, headers, rowsData);

    console.log(`✅ [DriveSync:Journey] Snapshot de Jornada atualizado: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`❌ [DriveSync:Journey] Falha ao sincronizar jornada:`, err);
    throw err;
  }
}

/**
 * ✅ Sincroniza o Backlog de Tarefas
 */
export async function syncBacklogToUserDrive(matricula: string, rowData: (string | number | boolean | null)[]) {
  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const userFolderId = await getUserRootFolder(matricula);

    const docsFolderId = await getStandardFolderWithHealing(drive, userFolderId, DRIVE_FOLDERS.DOCUMENTOS, LEGACY_FOLDERS.DOCUMENTOS);
    const fileName = `Tarefas_Backlog - ${matricula}`;

    const { id: spreadsheetId } = await getOrCreateSpreadsheet(drive, docsFolderId, fileName);

    const headers = ["Data Atribuição", "ID Evento/Origem", "Tarefa", "Status", "Comentários"];
    
    // Adiciona ao backlog (anexa linhas)
    await appendDataToSheet(sheets, spreadsheetId, headers, rowData);

    console.log(`✅ [DriveSync:Backlog] Tarefa anexada: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`❌ [DriveSync:Backlog] Falha ao sincronizar backlog:`, err);
    throw err;
  }
}

/**
 * 📝 Salva o Termo de Aceite de Cupom de Desconto na pasta do usuário.
 * Governança: sem emojis nos logs de console e erros.
 */
export async function syncCouponAcceptanceToDrive(
  matricula: string,
  couponCode: string,
  termText: string,
  details: {
    cpfHash: string;
    acceptedAt: Date;
    ipAddress?: string;
  }
): Promise<{ id: string; webViewLink: string }> {
  try {
    const drive = await getDriveClient();
    const userFolderId = await getUserRootFolder(matricula);

    const docsFolderId = await getStandardFolderWithHealing(
      drive,
      userFolderId,
      DRIVE_FOLDERS.DOCUMENTOS,
      LEGACY_FOLDERS.DOCUMENTOS
    );

    const fileName = `Aceite_Termos_Cupom_${couponCode}`;
    const timestampStr = details.acceptedAt.toISOString();

    const fileContent = `==================================================
COMPROVANTE DE ACEITE DIGITAL DE TERMO E CONDICOES
==================================================

Identificacao do Membro:
- Matricula: ${matricula}
- Codigo do Cupom: ${couponCode}
- Hash de Identificacao (CPF): ${details.cpfHash}
- Data/Hora do Aceite: ${timestampStr}
- Endereco IP (se disponivel): ${details.ipAddress || "N/A"}

--------------------------------------------------
TEXTO INTEGRAL DOS TERMOS ACEITOS
--------------------------------------------------
${termText}
==================================================
`;

    const result = await uploadFileToDrive(
      drive,
      docsFolderId,
      `${fileName}.txt`,
      "text/plain",
      fileContent
    );

    console.log(`[DriveSync:Coupon] Comprovante de aceite enviado ao Drive para matricula: ${matricula}`);
    return result;
  } catch (err) {
    console.error(`[DriveSync:Coupon] Falha ao sincronizar comprovante de termos:`, err);
    throw err;
  }
}


