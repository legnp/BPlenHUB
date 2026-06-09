import { drive_v3, sheets_v4 } from "googleapis";
import { serverEnv } from "@/env";

/**
 * BPlen HUB — Drive Utilities (Espinha Dorsal)
 * Centralização de operações Google Workspace para escala e resiliência.
 * Sincronizado com o Laboratório de Testes para suporte total a Drives Compartilhados.
 */

// ──────────────────────────────
// Governança de Pastas (Padrão BPlen)
// ──────────────────────────────
export const DRIVE_FOLDERS = {
  ACOMPANHAMENTO: "0.Acompanhamento",
  IDENTIDADE: "1.Identidade",
  CADASTRO: "2.Cadastro",
  SURVEYS: "3.Surveys",
  RESULTADOS: "4.Resultados",
  DOCUMENTOS: "5.Documentos",
  FINANCEIRO: "6.Financeiro"
} as const;

export const LEGACY_FOLDERS = {
  IDENTIDADE: ["Identidade"],
  CADASTRO: ["dados_cadastrais", "2.Cadastro"], // If they had 2.Cadastro previously, not really legacy but good to cover
  SURVEYS: ["1.Surveys", "Surveys"],
  RESULTADOS: ["2.Resultados", "Resultados"],
  DOCUMENTOS: ["2.Documentos", "Documentos"]
};

// ──────────────────────────────
// 1. Diagnóstico de Chave Privada
// ──────────────────────────────
export function checkKeySignature() {
  const key = serverEnv.FIREBASE_PRIVATE_KEY;
  if (!key.includes("-----BEGIN PRIVATE KEY-----") || !key.includes("-----END PRIVATE KEY-----")) {
    throw new Error("Chave Privada malformada detectada. Verifique as variáveis de ambiente.");
  }
}


// ──────────────────────────────
// 2. Navegador de Pastas Inteligente (Auto-Healing)
// ──────────────────────────────
/**
 * Garante que uma pasta existe. Se não existir, ela será criada.
 */
export async function ensureFolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const listFolders = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (listFolders.data.files && listFolders.data.files.length > 0) {
    return listFolders.data.files[0].id!;
  }

  const createFolder = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  if (!createFolder.data.id) throw new Error(`Falha ao criar pasta: ${folderName}`);
  return createFolder.data.id;
}

/**
 * Garante a existência de uma pasta no padrão de Governança, realizando "cura" (rename) 
 * automática caso encontre a versão legada da pasta.
 */
export async function getStandardFolderWithHealing(
  drive: drive_v3.Drive,
  parentFolderId: string,
  standardName: string,
  legacyNames: string[] = []
): Promise<string> {
  // 1. Tentar encontrar a pasta pelo padrão correto
  const listCorrect = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${standardName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (listCorrect.data.files && listCorrect.data.files.length > 0) {
    return listCorrect.data.files[0].id!;
  }

  // 2. Se não encontrou a correta, buscar pelas legadas
  if (legacyNames.length > 0) {
    const legacyQueries = legacyNames.map(name => `name = '${name}'`).join(" or ");
    const listLegacy = await drive.files.list({
      q: `'${parentFolderId}' in parents and (${legacyQueries}) and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (listLegacy.data.files && listLegacy.data.files.length > 0) {
      const folderId = listLegacy.data.files[0].id!;
      const oldName = listLegacy.data.files[0].name;
      console.log(`[Drive:Governance] Curando pasta legada: ${oldName} -> ${standardName}`);
      
      // Renomear para o padrão correto
      await drive.files.update({
        fileId: folderId,
        supportsAllDrives: true,
        requestBody: { name: standardName }
      });
      
      return folderId;
    }
  }

  // 3. Se não encontrou nem a correta nem a legada, cria a nova
  console.log(`[Drive:Governance] Criando nova pasta padrão: ${standardName}`);
  return await ensureFolder(drive, parentFolderId, standardName);
}


// ──────────────────────────────
// 3. Gerenciador de Planilhas
// ──────────────────────────────
/**
 * Cria uma planilha do Google Sheets dentro de uma pasta específica.
 */
export async function createSpreadsheet(
  drive: drive_v3.Drive,
  parentFolderId: string,
  fileName: string
): Promise<{ id: string; webViewLink: string }> {
  const sheetFile = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentFolderId],
    },
    fields: "id, webViewLink",
  });

  if (!sheetFile.data.id) throw new Error(`Falha ao criar planilha: ${fileName}`);
  return {
    id: sheetFile.data.id,
    webViewLink: sheetFile.data.webViewLink || ""
  };
}

/**
 * Governança Centralizada de Pastas de Evento BPlen.
 * Implementa o padrão {Slug} com suporte a auto-migração de pastas antigas (ID).
 */
export async function getEventDriveFolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  eventId: string,
  eventSlug: string
): Promise<string> {
  // 1. Tentar encontrar a pasta pelo NOVO padrão (Slug)
  const searchNew = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${eventSlug}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (searchNew.data.files && searchNew.data.files.length > 0) {
    return searchNew.data.files[0].id!;
  }

  // 2. Fallback: Buscar pela nomenclatura ANTIGA (Apenas ID) para migrar
  const searchOld = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${eventId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (searchOld.data.files && searchOld.data.files.length > 0) {
    const folderId = searchOld.data.files[0].id!;
    console.log(`[Drive:Governance] Migrando pasta ${eventId} -> ${eventSlug}`);
    await drive.files.update({
      fileId: folderId,
      supportsAllDrives: true,
      requestBody: { name: eventSlug }
    });
    return folderId;
  }

  // 3. Criar nova pasta no padrão BPlen
  console.log(`[Drive:Governance] Criando nova pasta padrão: ${eventSlug}`);
  return await ensureFolder(drive, parentFolderId, eventSlug);
}

/**
 * Grava ou Atualiza dados na planilha (Sobrescrevendo a primeira linha de dados).
 */
export async function syncDataToSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  headers: string[],
  rowData: (string | number | boolean | null)[]
) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetTitle = spreadsheet.data.sheets?.[0].properties?.title || "Sheet1";

  const lastColLetter = String.fromCharCode(64 + headers.length); 

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetTitle}!A1:${lastColLetter}2`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [headers, rowData],
    },
  });
}

/**
 * Anexa uma nova linha à planilha. Garante os cabeçalhos na primeira linha se estiver vazia.
 */
export async function appendDataToSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  headers: string[],
  rowData: (string | number | boolean | null)[]
) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: true, ranges: ["A1:Z1"] });
  const sheet = spreadsheet.data.sheets?.[0];
  const sheetTitle = sheet?.properties?.title || "Sheet1";
  
  const hasHeaders = sheet?.data?.[0]?.rowData?.[0]?.values && sheet.data[0].rowData[0].values.length > 0;

  // Se não tem headers, atualiza a primeira linha com os headers
  if (!hasHeaders) {
    const lastColLetter = String.fromCharCode(64 + headers.length);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1:${lastColLetter}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    });
  }

  // Anexa os dados na próxima linha livre
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetTitle}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [rowData],
    },
  });
}

/**
 * 4. Carregador de Arquivos (Mídia)
 * Realiza o upload de um arquivo binário para o Google Drive.
 */
export async function uploadFileToDrive(
  drive: drive_v3.Drive,
  parentFolderId: string,
  fileName: string,
  mimeType: string,
  body: string | Buffer | Uint8Array | import("stream").Readable
): Promise<{ id: string; webViewLink: string }> {
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [parentFolderId],
    },
    media: {
      mimeType,
      body,
    },
    fields: "id, webViewLink",
  });

  if (!file.data.id) throw new Error(`Falha ao fazer upload do arquivo: ${fileName}`);
  
  return {
    id: file.data.id,
    webViewLink: file.data.webViewLink || ""
  };
}

/**
 * 5. Gerenciador de Permissões
 * Torna um arquivo legível por qualquer pessoa com o link (Necessário para Imagens/Avatares).
 */
export async function makeFilePublic(
  drive: drive_v3.Drive,
  fileId: string
) {
  try {
    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ [Drive:Permissions] Falha ao tornar arquivo público (${fileId}):`, errorMessage);
  }
}

/**
 * Renomeia um arquivo ou pasta no Google Drive.
 */
export async function renameFile(
  drive: drive_v3.Drive,
  fileId: string,
  newName: string
) {
  await drive.files.update({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      name: newName,
    },
  });
}
