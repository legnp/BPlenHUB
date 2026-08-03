import { getDriveClient, getSheetsClient } from "@/lib/google-auth";
import { serverEnv } from "@/env";
import { ensureFolder, getOrCreateSpreadsheet, syncDataToSheet, appendDataToSheet, getStandardFolderWithHealing, uploadFileToDrive, DRIVE_FOLDERS, LEGACY_FOLDERS } from "@/lib/drive-utils";

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
  /**
   * Forca a pasta de destino, ignorando a heuristica de titulo abaixo.
   *
   * O registro completo (serializador generico) sempre vai para `3.Surveys`: ele
   * cobre TODOS os surveys, e varios tem "perfil" no titulo sem serem cadastro
   * (`perfil_profissional_publico`), o que a heuristica desviaria para
   * `2.Cadastro`. Chamadas curadas nao passam este campo e seguem como antes.
   */
  targetFolderOverride?: string;
}

/**
 * Sincroniza dados de uma pesquisa para a pasta do usuário no Google Drive.
 * Padrão: 2.x (B2B/B2C) -> {Matricula} -> 1.Surveys -> {SurveyTitle}.
 * 
 * @param config Configuração da pesquisa e dados a sincronizar.
 * @returns O ID da planilha criada ou atualizada.
 */
export async function syncSurveyToUserDrive(config: SurveySyncConfig) {
  const { matricula, surveyTitle, headers, rowData, targetFolderOverride } = config;

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

    // Identificar destino baseado no título (salvo override explicito)
    const isCadastro = !targetFolderOverride
      && (surveyTitle.toLowerCase().includes("cadastro") || surveyTitle.toLowerCase().includes("perfil"));
    const targetFolder = targetFolderOverride || (isCadastro ? DRIVE_FOLDERS.CADASTRO : DRIVE_FOLDERS.SURVEYS);
    const legacyFolders = isCadastro ? LEGACY_FOLDERS.CADASTRO : LEGACY_FOLDERS.SURVEYS;

    const targetFolderId = await getStandardFolderWithHealing(drive, userFolderId, targetFolder, legacyFolders);

    // 3. Criar/Atualizar Planilha
    const { id: spreadsheetId } = await getOrCreateSpreadsheet(drive, targetFolderId, `${surveyTitle} - ${matricula}`);

    // 4. ANEXAR (nao sobrescrever) — BUG-110.
    //
    // Ate aqui usava-se `syncDataToSheet`, que APAGA a aba inteira antes de
    // escrever ("snapshot limpo, sem rastros do passado"). Isso trata resposta de
    // survey como ESTADO, quando ela e EVENTO: cada envio e um fato distinto, e o
    // historico e o produto — o Drive e a estrategia de backup independente da
    // plataforma, entao perder linha antiga esvazia o backup.
    //
    // O agravante estava na pasta unica de anonimos: o nome da planilha deriva da
    // matricula, e TODO visitante compartilha `BP-ANON` — dois visitantes no mesmo
    // artigo caiam na mesma planilha e o segundo APAGAVA o primeiro. A colisao foi
    // tratada no Firestore (id de doc composto) e passou despercebida aqui.
    //
    // Decisao da Gestora (2026-07-20): TODOS os surveys passam a acumular
    // historico, nao so o feedback de conteudo. O padrao ja existia no proprio
    // arquivo — `syncOrderToUserDrive` e `syncBacklogToUserDrive` ja anexavam.
    await appendDataToSheet(sheets, spreadsheetId, headers, rowData);

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

/** Prova de contexto capturada no momento de um aceite (mesma forma em consent/cookies). */
export interface AcceptanceProof {
  ip: string;
  userAgent: string;
  deviceType: string;
  location: string;
  acceptedAt: Date;
}

function formatProofBlock(proof: AcceptanceProof): string {
  return [
    `- Data/Hora: ${proof.acceptedAt.toISOString()}`,
    `- Endereco IP: ${proof.ip}`,
    `- Dispositivo: ${proof.deviceType}`,
    `- Localizacao aproximada: ${proof.location || "nao identificada"}`,
    `- User-Agent: ${proof.userAgent}`,
  ].join("\n");
}

/**
 * Comprovante de aceite dos Termos, Privacidade e declaracao de 18+ (LGPD).
 *
 * O aceite ja era gravado no Firestore com prova completa (IP, geo, dispositivo),
 * mas nunca saia de la — nao existia contrapartida na pasta do usuario, embora
 * seja o documento com maior peso probatorio do sistema depois do contrato.
 * Mesmo formato do comprovante de cupom, para o acervo do usuario ficar coerente.
 */
export async function syncConsentAcceptanceToDrive(
  matricula: string,
  details: {
    version: string;
    birthDate: string;
    newsletterOptIn: boolean;
    proof: AcceptanceProof;
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

    // Timestamp no nome: cada reaceite (nova versao dos termos) e um documento
    // proprio. Sobrescrever apagaria a trilha que a LGPD pede.
    const stamp = details.proof.acceptedAt.toISOString().replace(/[:.]/g, "-");
    const fileName = `Aceite_Termos_e_Privacidade_${details.version}_${stamp}.txt`;

    const fileContent = `==================================================
COMPROVANTE DE ACEITE DE TERMOS DE USO E PRIVACIDADE
==================================================

Identificacao do Membro:
- Matricula: ${matricula}
- Versao dos documentos aceitos: ${details.version}

Declaracoes registradas:
- Termos de Uso: aceito
- Politica de Privacidade: aceita
- Declaracao de maioridade (18 anos ou mais): confirmada
- Data de nascimento informada: ${details.birthDate}
- Comunicacoes opcionais (newsletter): ${details.newsletterOptIn ? "aceitas" : "recusadas"}

Prova do aceite:
${formatProofBlock(details.proof)}
==================================================
`;

    const result = await uploadFileToDrive(
      drive,
      docsFolderId,
      fileName,
      "text/plain",
      fileContent
    );

    console.log(`[DriveSync:Consent] Comprovante de consentimento gravado para: ${matricula}`);
    return result;
  } catch (err) {
    console.error(`[DriveSync:Consent] Falha ao gravar comprovante de consentimento:`, err);
    throw err;
  }
}

/**
 * Historico de preferencia de cookies.
 *
 * Ate aqui a escolha vivia SOMENTE no `localStorage` do navegador: nao havia
 * registro no servidor, nenhuma prova do que foi escolhido e quando, e a
 * preferencia se perdia ao limpar o navegador ou trocar de aparelho. Planilha e
 * nao documento porque preferencia muda com o tempo — o que importa e a serie.
 */
export async function syncCookiePreferenceToDrive(
  matricula: string,
  details: { choice: string; version: string; proof: AcceptanceProof }
): Promise<string> {
  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const userFolderId = await getUserRootFolder(matricula);

    const acompanhamentoFolderId = await getStandardFolderWithHealing(
      drive,
      userFolderId,
      DRIVE_FOLDERS.ACOMPANHAMENTO
    );

    const { id: spreadsheetId } = await getOrCreateSpreadsheet(
      drive,
      acompanhamentoFolderId,
      `Preferencias_Cookies - ${matricula}`
    );

    const headers = [
      "Data/Hora", "Escolha", "Versao", "IP", "Dispositivo", "Localizacao", "User-Agent",
    ];
    const rowData = [
      details.proof.acceptedAt.toLocaleString("pt-BR"),
      details.choice === "all" ? "Todos os cookies" : "Apenas essenciais",
      details.version,
      details.proof.ip,
      details.proof.deviceType,
      details.proof.location,
      details.proof.userAgent,
    ];

    await appendDataToSheet(sheets, spreadsheetId, headers, rowData);

    console.log(`[DriveSync:Cookies] Preferencia de cookies registrada para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:Cookies] Falha ao registrar preferencia de cookies:`, err);
    throw err;
  }
}

/**
 * Historico de acessos (quando entrou, por qual provedor, de onde).
 *
 * O `_AuthMap` guardava so o ULTIMO login (campo sobrescrito a cada entrada), o
 * que responde "quando foi a ultima vez" mas nao "quando foram todas". Aqui a
 * serie e append-only, na pasta do proprio usuario.
 */
export async function syncAccessLogToUserDrive(
  matricula: string,
  details: { provider: string; origin: string; proof: AcceptanceProof }
): Promise<string> {
  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const userFolderId = await getUserRootFolder(matricula);

    const acompanhamentoFolderId = await getStandardFolderWithHealing(
      drive,
      userFolderId,
      DRIVE_FOLDERS.ACOMPANHAMENTO
    );

    const { id: spreadsheetId } = await getOrCreateSpreadsheet(
      drive,
      acompanhamentoFolderId,
      `Historico_Acessos - ${matricula}`
    );

    const headers = [
      "Data/Hora", "Provedor", "Origem", "IP", "Dispositivo", "Localizacao", "User-Agent",
    ];
    const rowData = [
      details.proof.acceptedAt.toLocaleString("pt-BR"),
      details.provider,
      details.origin,
      details.proof.ip,
      details.proof.deviceType,
      details.proof.location,
      details.proof.userAgent,
    ];

    await appendDataToSheet(sheets, spreadsheetId, headers, rowData);

    console.log(`[DriveSync:Access] Acesso registrado para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:Access] Falha ao registrar acesso:`, err);
    throw err;
  }
}


