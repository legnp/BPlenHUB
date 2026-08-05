import { getDriveClient, getSheetsClient } from "@/lib/google-auth";
import { serverEnv } from "@/env";
import { ensureFolder, getOrCreateSpreadsheet, syncDataToSheet, appendDataToSheet, getFirstColumnValues, fileExistsInFolder, getStandardFolderWithHealing, uploadFileToDrive, DRIVE_FOLDERS, LEGACY_FOLDERS } from "@/lib/drive-utils";

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
  /**
   * Nao anexa se a primeira coluna ja contiver este valor.
   *
   * Usado pelo resgate retroativo, cuja chave e o carimbo de tempo do envio: sem
   * isto, rodar o backfill duas vezes duplicaria todo o historico do usuario. O
   * envio ao vivo nao passa este campo — ali cada envio e um fato novo, mesmo que
   * identico ao anterior.
   */
  skipIfFirstColumnMatches?: string;
}

/**
 * Sincroniza dados de uma pesquisa para a pasta do usuário no Google Drive.
 * Padrão: 2.x (B2B/B2C) -> {Matricula} -> 1.Surveys -> {SurveyTitle}.
 * 
 * @param config Configuração da pesquisa e dados a sincronizar.
 * @returns O ID da planilha criada ou atualizada.
 */
export async function syncSurveyToUserDrive(config: SurveySyncConfig) {
  const { matricula, surveyTitle, headers, rowData, targetFolderOverride, skipIfFirstColumnMatches } = config;

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

    // Guarda de reexecucao do resgate retroativo (ver `skipIfFirstColumnMatches`).
    if (skipIfFirstColumnMatches) {
      const existing = await getFirstColumnValues(sheets, spreadsheetId);
      if (existing.includes(skipIfFirstColumnMatches.trim())) {
        console.log(`[DriveSync] Linha ja presente, nada a anexar: ${surveyTitle} -> ${matricula}`);
        return spreadsheetId;
      }
    }

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

/**
 * Anexa uma linha a uma serie do acervo do usuario.
 *
 * Base comum das categorias que sao SERIE (evento que se repete): acessos,
 * preferencias, feedbacks, auditoria de assinatura. Antes de existir, cada
 * categoria repetia o mesmo bloco de resolver pasta, achar planilha e anexar —
 * e cada repeticao era uma chance de esquecer a cura da pasta legada ou de
 * sobrescrever em vez de anexar.
 *
 * Ver `WORKSPACE_GLOBAL.md` para o criterio de serie versus documento.
 */
async function appendToUserSeries(config: {
  matricula: string;
  folder: string;
  legacyFolders?: string[];
  fileName: string;
  headers: string[];
  rowData: (string | number | boolean | null)[];
  /** Nao anexa se a primeira coluna ja tiver este valor (idempotencia do resgate). */
  skipIfFirstColumnMatches?: string;
}): Promise<string> {
  const drive = await getDriveClient();
  const sheets = await getSheetsClient();
  const userFolderId = await getUserRootFolder(config.matricula);

  const folderId = await getStandardFolderWithHealing(
    drive,
    userFolderId,
    config.folder,
    config.legacyFolders
  );

  const { id: spreadsheetId } = await getOrCreateSpreadsheet(
    drive,
    folderId,
    `${config.fileName} - ${config.matricula}`
  );

  if (config.skipIfFirstColumnMatches) {
    const existing = await getFirstColumnValues(sheets, spreadsheetId);
    if (existing.includes(config.skipIfFirstColumnMatches.trim())) return spreadsheetId;
  }

  await appendDataToSheet(sheets, spreadsheetId, config.headers, config.rowData);
  return spreadsheetId;
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

    // Guarda de reexecucao do resgate: o nome ja carrega versao e carimbo, entao
    // ele mesmo e a chave. Sem isto, resgatar duas vezes duplicaria o comprovante.
    if (await fileExistsInFolder(drive, docsFolderId, fileName)) {
      console.log(`[DriveSync:Consent] Comprovante ja existente, nada a gravar: ${matricula}`);
      return { id: "", webViewLink: "" };
    }

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
    const spreadsheetId = await appendToUserSeries({
      matricula,
      folder: DRIVE_FOLDERS.ACOMPANHAMENTO,
      fileName: "Preferencias_Cookies",
      headers: ["Data/Hora", "Escolha", "Versao", "IP", "Dispositivo", "Localizacao", "User-Agent"],
      rowData: [
        details.proof.acceptedAt.toLocaleString("pt-BR"),
        details.choice === "all" ? "Todos os cookies" : "Apenas essenciais",
        details.version,
        details.proof.ip,
        details.proof.deviceType,
        details.proof.location,
        details.proof.userAgent,
      ],
    });

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
    const spreadsheetId = await appendToUserSeries({
      matricula,
      folder: DRIVE_FOLDERS.ACOMPANHAMENTO,
      fileName: "Historico_Acessos",
      headers: ["Data/Hora", "Provedor", "Origem", "IP", "Dispositivo", "Localizacao", "User-Agent"],
      rowData: [
        details.proof.acceptedAt.toLocaleString("pt-BR"),
        details.provider,
        details.origin,
        details.proof.ip,
        details.proof.deviceType,
        details.proof.location,
        details.proof.userAgent,
      ],
    });

    console.log(`[DriveSync:Access] Acesso registrado para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:Access] Falha ao registrar acesso:`, err);
    throw err;
  }
}

/**
 * Trilha de auditoria da assinatura de contrato.
 *
 * O PDF assinado ja ia para `5.Documentos`, mas o registro que da valor
 * probatorio a ele — codigo de verificacao, hash de integridade, IP e geo do
 * momento da assinatura — ficava so no banco (`Legal_Audits`). O documento sem a
 * trilha prova menos do que os dois juntos.
 */
export async function syncLegalAuditToUserDrive(
  matricula: string,
  audit: {
    auditId: string;
    timestamp: string;
    productId: string;
    orderId?: string | null;
    paymentId?: string | null;
    verificationCode: string;
    documentHash: string;
    verificationHash: string;
    ipAddress: string;
    location: string;
    documentUrl: string;
  }
): Promise<string> {
  try {
    const spreadsheetId = await appendToUserSeries({
      matricula,
      folder: DRIVE_FOLDERS.DOCUMENTOS,
      legacyFolders: LEGACY_FOLDERS.DOCUMENTOS,
      fileName: "Auditoria_Assinaturas",
      headers: [
        "Data/Hora", "ID da auditoria", "Produto", "Pedido", "Pagamento",
        "Codigo de verificacao", "Hash do documento", "Hash de verificacao",
        "IP", "Localizacao", "Documento",
      ],
      rowData: [
        audit.timestamp,
        audit.auditId,
        audit.productId,
        audit.orderId || "sem pedido",
        audit.paymentId || "sem pagamento",
        audit.verificationCode,
        audit.documentHash,
        audit.verificationHash,
        audit.ipAddress,
        audit.location || "nao identificada",
        audit.documentUrl,
      ],
      // Chave do resgate: o carimbo da assinatura, que e a coluna A.
      skipIfFirstColumnMatches: audit.timestamp,
    });

    console.log(`[DriveSync:LegalAudit] Auditoria de assinatura registrada para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:LegalAudit] Falha ao registrar auditoria de assinatura:`, err);
    throw err;
  }
}

/**
 * Feedback de carreira escrito pelo consultor.
 *
 * Serie: cada feedback e um fato novo na trajetoria do membro, e o valor esta em
 * ter todos. Vai para `0.Acompanhamento` porque e material de acompanhamento, e
 * nao resultado de instrumento.
 */
export async function syncCareerFeedbackToUserDrive(
  matricula: string,
  feedback: { title: string; content: string; author: string; createdAt: string }
): Promise<string> {
  try {
    const spreadsheetId = await appendToUserSeries({
      matricula,
      folder: DRIVE_FOLDERS.ACOMPANHAMENTO,
      fileName: "Feedbacks_Carreira",
      headers: ["Data", "Titulo", "Autor", "Conteudo"],
      rowData: [feedback.createdAt, feedback.title, feedback.author, feedback.content],
      skipIfFirstColumnMatches: feedback.createdAt,
    });

    console.log(`[DriveSync:CareerFeedback] Feedback registrado para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:CareerFeedback] Falha ao registrar feedback:`, err);
    throw err;
  }
}

/**
 * Chamados de suporte abertos pelo membro.
 *
 * E contato dele com a plataforma como qualquer outro: pergunta feita, resposta
 * esperada. Ficava so no banco. Serie em `0.Acompanhamento`, junto do restante
 * do historico de interacao.
 *
 * A planilha NAO leva uid nem e-mail: a pasta ja e do proprio membro, entao
 * repetir identificadores so aumentaria a superficie de PII sem informar nada.
 */
export async function syncSupportTicketToUserDrive(
  matricula: string,
  ticket: {
    createdAt: string;
    description: string;
    currentPage?: string | null;
    status: string;
    priority: string;
    attachment?: string | null;
  }
): Promise<string> {
  try {
    const spreadsheetId = await appendToUserSeries({
      matricula,
      folder: DRIVE_FOLDERS.ACOMPANHAMENTO,
      fileName: "Chamados_Suporte",
      headers: ["Data/Hora", "Descricao", "Pagina de origem", "Status", "Prioridade", "Anexo"],
      rowData: [
        ticket.createdAt,
        ticket.description,
        ticket.currentPage || "nao informada",
        ticket.status,
        ticket.priority,
        ticket.attachment || "sem anexo",
      ],
      skipIfFirstColumnMatches: ticket.createdAt,
    });

    console.log(`[DriveSync:Support] Chamado registrado para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:Support] Falha ao registrar chamado:`, err);
    throw err;
  }
}

/**
 * Transferencia de titularidade da conta.
 *
 * Ato com valor probatorio: muda quem e dono do acervo. Vai para
 * `5.Documentos`, ao lado dos contratos.
 *
 * `performedBy` passa pela mascara de identidade (regra 7 do CLAUDE.md): quem
 * executa a transferencia e da equipe interna, e esta planilha e visivel para o
 * membro. Sem a mascara, o e-mail do Master vazaria no acervo do cliente.
 */
export async function syncAccountTransferToUserDrive(
  matricula: string,
  transfer: {
    performedAt: string;
    targetEmail: string;
    orphanMatricula?: string | null;
    removedUids: number;
    performedBy: string;
  }
): Promise<string> {
  try {
    const { maskInternalContact } = await import("@/lib/identity-mask");

    const spreadsheetId = await appendToUserSeries({
      matricula,
      folder: DRIVE_FOLDERS.DOCUMENTOS,
      legacyFolders: LEGACY_FOLDERS.DOCUMENTOS,
      fileName: "Transferencias_de_Conta",
      headers: [
        "Data/Hora", "Novo acesso (e-mail)", "Matricula arquivada", "Acessos removidos", "Executado por",
      ],
      rowData: [
        transfer.performedAt,
        transfer.targetEmail,
        transfer.orphanMatricula || "nenhuma",
        transfer.removedUids,
        maskInternalContact(transfer.performedBy),
      ],
      skipIfFirstColumnMatches: transfer.performedAt,
    });

    console.log(`[DriveSync:Transfer] Transferencia registrada para: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:Transfer] Falha ao registrar transferencia:`, err);
    throw err;
  }
}

/**
 * Objetivos de carreira — SNAPSHOT, nao serie.
 *
 * Diferente de feedback ou acesso, objetivo e ESTADO: o status muda ("Em
 * Andamento" -> "Alcancado") e o que importa e a foto atual, nao cada transicao.
 * Mesmo tratamento da jornada, e um dos poucos casos em que sobrescrever e
 * correto (ver `WORKSPACE_GLOBAL.md`).
 */
export async function syncCareerObjectivesToUserDrive(
  matricula: string,
  objectives: {
    title: string;
    description?: string;
    status: string;
    targetDate?: string;
    createdAt: string;
    completedAt?: string;
    goals: { title: string; currentValue: number; targetValue: number; unit: string; completed: boolean }[];
  }[]
): Promise<string> {
  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    const userFolderId = await getUserRootFolder(matricula);

    const folderId = await getStandardFolderWithHealing(
      drive,
      userFolderId,
      DRIVE_FOLDERS.ACOMPANHAMENTO
    );

    const { id: spreadsheetId } = await getOrCreateSpreadsheet(
      drive,
      folderId,
      `Objetivos_Carreira - ${matricula}`
    );

    const headers = [
      "Objetivo", "Descricao", "Status", "Data alvo", "Criado em", "Concluido em", "Metas",
    ];
    const rowsData = objectives.map((objective) => [
      objective.title,
      objective.description || "",
      objective.status,
      objective.targetDate || "",
      objective.createdAt,
      objective.completedAt || "",
      objective.goals
        .map((goal) => `${goal.title}: ${goal.currentValue}/${goal.targetValue} ${goal.unit}${goal.completed ? " (concluida)" : ""}`)
        .join(" | "),
    ]);

    await syncDataToSheet(sheets, spreadsheetId, headers, rowsData);

    console.log(`[DriveSync:CareerObjectives] Snapshot de objetivos atualizado: ${matricula}`);
    return spreadsheetId;
  } catch (err) {
    console.error(`[DriveSync:CareerObjectives] Falha ao sincronizar objetivos:`, err);
    throw err;
  }
}


