"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getServerSession } from "@/lib/server-session";
import { 
  CareerTask, 
  CareerTaskStatus, 
  CareerTaskComment, 
  CareerFeedback, 
  CareerAta, 
  CareerSharedDocument, 
  CareerObjective,
  CareerGoal
} from "@/types/career";
import * as admin from "firebase-admin";
import { getErrorMessage } from "@/lib/utils/errors";

export interface CareerPlanningData {
  isCareerPlanningReleased: boolean;
  backlog: CareerTask[];
  feedbacks: CareerFeedback[];
  atas: CareerAta[];
  sharedDocuments: CareerSharedDocument[];
  objectives: CareerObjective[];
}

/**
 * Serializador seguro para evitar quebras do Next.js ao trafegar objetos
 * complexos (como Timestamps do Firestore) de volta para o cliente.
 */
function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (
        value &&
        typeof value === "object" &&
        (value.seconds !== undefined || value._seconds !== undefined)
      ) {
        const seconds = value.seconds ?? value._seconds;
        return new Date(seconds * 1000).toISOString();
      }
      return value;
    })
  );
}

/**
 * Guarda de Segurança Unificado para a Gestão de Carreira.
 * Lança exceções se o usuário não for Administrador ou o próprio dono da matrícula ativa com o módulo liberado.
 */
async function checkAuthAndGetDb(matricula: string, idToken?: string) {
  const session = await getServerSession(idToken);
  if (!session) {
    throw new Error("Sessão inválida ou expirada. Autentique-se novamente.");
  }

  // 1. Administradores têm acesso total
  if (session.isAdmin) {
    return { db: getAdminDb(), is_admin: true, userEmail: session.email || "ADMIN" };
  }

  // 2. Se for o próprio usuário, exige que tenha a matrícula correspondente e o entitlement ativo
  if (session.matricula === matricula) {
    const isReleased = session.services?.career_planning === true;
    if (!isReleased) {
      throw new Error("Acesso Negado: A Gestão de Carreira ainda não está ativada para sua conta.");
    }
    return { db: getAdminDb(), is_admin: false, userEmail: session.email || "USER" };
  }

  throw new Error("Acesso Negado: Você não tem permissão para ler ou alterar dados desta conta.");
}

/**
 * toggleCareerPlanningAccessAction
 * Habilita ou desabilita o acesso do membro ao módulo de carreira (Exclusivo Admin).
 */
export async function toggleCareerPlanningAccessAction(
  matricula: string,
  currentStatus: boolean,
  adminToken?: string
): Promise<{ success: boolean; active?: boolean; error?: string }> {
  try {
    const session = await requireAdmin(adminToken);
    const db = getAdminDb();

    const accessRef = db.doc(`User/${matricula}/User_Permissions/access`);
    const nextStatus = !currentStatus;

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(accessRef);
      const data = snap.exists ? snap.data() || {} : {};
      
      const currentServices = data.services || {};
      const updatedServices = {
        ...currentServices,
        career_planning: nextStatus
      };

      transaction.set(accessRef, {
        ...data,
        services: updatedServices,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: `ADMIN:${session.email || session.uid}`
      }, { merge: true });
    });

    console.log(`✅ [Career Action] Modulo de carreira alterado para ${nextStatus} no usuario ${matricula}`);
    return { success: true, active: nextStatus };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao alternar acesso do usuario:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao salvar permissao no servidor.") };
  }
}

/**
 * getCareerPlanningDataAction
 * Busca e consolida todas as informações do módulo de carreira para exibição (Membro e Admin).
 */
export async function getCareerPlanningDataAction(
  matricula: string,
  idToken?: string
): Promise<{ success: boolean; data?: CareerPlanningData | null; error?: string }> {
  try {
    const { db } = await checkAuthAndGetDb(matricula, idToken);

    // Buscar dados em paralelo para otimizar tempo de carregamento (Lazy/Parallel loading)
    const snaps = await Promise.all([
      db.collection(`User/${matricula}/Career_Backlog`).get(),
      db.collection(`User/${matricula}/Feedbacks`).get(),
      db.collection(`User/${matricula}/Atas`).get(),
      db.collection(`User/${matricula}/Shared_Documents`).get(),
      db.collection(`User/${matricula}/Career_Objectives`).get(),
      db.doc(`User/${matricula}/User_Permissions/access`).get()
    ]);

    const backlogSnap = snaps[0];
    const feedbacksSnap = snaps[1];
    const atasSnap = snaps[2];
    const docsSnap = snaps[3];
    const objectivesSnap = snaps[4];
    const accessSnap = snaps[5];

    const accessData = accessSnap.exists ? accessSnap.data() || {} : {};
    const isCareerPlanningReleased = accessData.services?.career_planning === true;
    const legacySynced = accessData.legacySynced_v3 === true;

    // Se o plano de carreira está liberado mas nunca foi sincronizado retroativamente com v3, rodar o resgate!
    if (isCareerPlanningReleased && !legacySynced) {
      console.log(`[Career Retroactive Sync] Sincronizando dados legados para matricula ${matricula}...`);
      const bookingsSnap = await db.collection(`User/${matricula}/User_Bookings`).get();
      
      const accessRef = db.doc(`User/${matricula}/User_Permissions/access`);

      if (!bookingsSnap.empty) {
        const batch = db.batch();
        let operationsCount = 0;

        // Buscar todos os eventos agendados em lote para capturar os titulos reais
        const eventMap = new Map<string, any>();
        const eventIds = bookingsSnap.docs.map(doc => doc.data().eventId || doc.id).filter(Boolean);
        const eventRefs = Array.from(new Set(eventIds)).map(id => db.collection("Calendar_Events").doc(id));

        if (eventRefs.length > 0) {
          try {
            const eventSnaps = await db.getAll(...eventRefs);
            eventSnaps.forEach(snap => {
              if (snap.exists) {
                eventMap.set(snap.id, snap.data());
              }
            });
          } catch (err) {
            console.error("[Career Retroactive Sync] Erro ao carregar eventos em lote:", err);
          }
        }

        for (const doc of bookingsSnap.docs) {
          const bookingData = doc.data();
          const eventId = bookingData.eventId || doc.id;
          const eventData = eventMap.get(eventId) || {};
          const eventSummary = eventData.summary || "Sessão de Mentoria";

          // 1. Feedback qualitativo legado
          if (bookingData.participantFeedback && bookingData.participantFeedback.trim()) {
            const feedbackId = `booking-${eventId}`;
            const feedbackRef = db.collection("User").doc(matricula).collection("Feedbacks").doc(feedbackId);
            batch.set(feedbackRef, {
              title: `Feedback - ${eventSummary}`,
              content: bookingData.participantFeedback,
              author: "Consultor BPlen",
              createdAt: bookingData.postEventUpdatedAt ? (bookingData.postEventUpdatedAt.toDate ? bookingData.postEventUpdatedAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString()
            }, { merge: true });
            operationsCount++;
          }

          // 2. Tarefas do backlog legadas
          if (bookingData.participantTasks && bookingData.participantTasks.trim()) {
            const taskLines = bookingData.participantTasks
              .split(/\r?\n/)
              .map((line: string) => line.replace(/^[\s*\-\d\.)]+/, "").trim())
              .filter((line: string) => line.length > 0);

            taskLines.forEach((taskTitle: string, idx: number) => {
              const taskId = `booking-${eventId}-task-${idx}`;
              const taskRef = db.collection("User").doc(matricula).collection("Career_Backlog").doc(taskId);
              batch.set(taskRef, {
                title: taskTitle,
                status: "Sprint atual",
                createdAt: bookingData.postEventUpdatedAt ? (bookingData.postEventUpdatedAt.toDate ? bookingData.postEventUpdatedAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString(),
                statusHistory: [{ 
                  status: "Sprint atual", 
                  changedAt: bookingData.postEventUpdatedAt ? (bookingData.postEventUpdatedAt.toDate ? bookingData.postEventUpdatedAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString() 
                }],
                comments: []
              }, { merge: true });
              operationsCount++;
            });
          }

          // 3. Documentos compartilhados legados
          if (bookingData.participantDocs && Array.isArray(bookingData.participantDocs) && bookingData.participantDocs.length > 0) {
            bookingData.participantDocs.forEach((docItem: any, idx: number) => {
              const docId = `booking-${eventId}-doc-${idx}`;
              const docRef = db.collection("User").doc(matricula).collection("Shared_Documents").doc(docId);
              batch.set(docRef, {
                title: docItem.fileName || `Documento - ${eventSummary}`,
                fileUrl: docItem.url,
                fileName: docItem.fileName || "arquivo.pdf",
                category: eventSummary,
                createdAt: docItem.uploadedAt || new Date().toISOString()
              }, { merge: true });
              operationsCount++;
            });
          }

          // 4. Atas de reuniões legadas
          if (bookingData.meetingMinutesFile && bookingData.meetingMinutesFile.url) {
            const ataId = `booking-${eventId}-ata`;
            const ataRef = db.collection("User").doc(matricula).collection("Atas").doc(ataId);
            batch.set(ataRef, {
              title: `Ata de Reunião - ${eventSummary}`,
              meetingDate: bookingData.postEventUpdatedAt ? (bookingData.postEventUpdatedAt.toDate ? bookingData.postEventUpdatedAt.toDate().toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)) : new Date().toISOString().substring(0, 10),
              fileUrl: bookingData.meetingMinutesFile.url,
              contentSummary: bookingData.publicGeneralComment || "Ata de mentoria retroativa.",
              createdAt: bookingData.meetingMinutesFile.uploadedAt || new Date().toISOString()
            }, { merge: true });
            operationsCount++;
          }
        }

        batch.set(accessRef, { legacySynced_v3: true }, { merge: true });

        if (operationsCount > 0) {
          await batch.commit();
          console.log(`[Career Retroactive Sync] Sincronizacao retroativa concluida com sucesso para matricula ${matricula}. ${operationsCount} registros adicionados/atualizados.`);
          // Recarregar os dados de forma limpa usando recursao
          return getCareerPlanningDataAction(matricula, idToken);
        }
      } else {
        await accessRef.set({ legacySynced_v3: true }, { merge: true });
      }
    }

    // Se o documento disc-devolutiva ainda nao estiver em Shared_Documents mas existir em results/disc, resgatamos imediatamente (on-the-fly)
    const hasDiscInDocs = docsSnap.docs.some(doc => doc.id === "disc-devolutiva");
    if (!hasDiscInDocs) {
      try {
        const discSnap = await db.doc(`User/${matricula}/results/disc`).get();
        if (discSnap.exists) {
          const discData = discSnap.data() || {};
          if (discData.isReleased !== false && discData.file && discData.file.url) {
            const discDocRef = db.collection("User").doc(matricula).collection("Shared_Documents").doc("disc-devolutiva");
            await discDocRef.set({
              title: "Análise Comportamental DISC",
              fileUrl: discData.file.url,
              fileName: discData.file.originalName || discData.file.name || "devolutiva-disc.pdf",
              category: "Plano de Carreira",
              createdAt: discData.submittedAt ? (discData.submittedAt.toDate ? discData.submittedAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString()
            }, { merge: true });
            console.log(`[Career On-The-Fly Sync] DISC Devolutiva resgatada com sucesso para matricula ${matricula}`);
            // Recarregar os dados de forma limpa usando recursao
            return getCareerPlanningDataAction(matricula, idToken);
          }
        }
      } catch (discErr) {
        console.error("[Career On-The-Fly Sync] Erro ao buscar DISC legada:", discErr);
      }
    }

    const backlog: CareerTask[] = [];
    backlogSnap.forEach((doc) => {
      const data = doc.data();
      backlog.push({
        id: doc.id,
        title: data.title || "",
        status: data.status || "Backlog",
        createdAt: data.createdAt || new Date().toISOString(),
        statusHistory: data.statusHistory || [],
        comments: data.comments || []
      });
    });
    // Ordenar por data de criacao decrescente
    backlog.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const feedbacks: CareerFeedback[] = [];
    feedbacksSnap.forEach((doc) => {
      const data = doc.data();
      feedbacks.push({
        id: doc.id,
        title: data.title || "",
        content: data.content || "",
        author: data.author || "Consultor",
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    feedbacks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const atas: CareerAta[] = [];
    atasSnap.forEach((doc) => {
      const data = doc.data();
      atas.push({
        id: doc.id,
        title: data.title || "",
        meetingDate: data.meetingDate || "",
        fileUrl: data.fileUrl || "",
        contentSummary: data.contentSummary || "",
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    atas.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)); // Ordem cronologica

    const sharedDocuments: CareerSharedDocument[] = [];
    docsSnap.forEach((doc) => {
      const data = doc.data();
      sharedDocuments.push({
        id: doc.id,
        title: data.title || "",
        fileUrl: data.fileUrl || "",
        fileName: data.fileName || "",
        category: data.category || "Outros",
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    sharedDocuments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const objectives: CareerObjective[] = [];
    objectivesSnap.forEach((doc) => {
      const data = doc.data();
      objectives.push({
        id: doc.id,
        title: data.title || "",
        description: data.description || "",
        status: data.status || "Não Iniciado",
        targetDate: data.targetDate || "",
        goals: data.goals || [],
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    objectives.sort((a, b) => b.createdAt.localeCompare(a.createdAt));



    return {
      success: true,
      data: serializeData({
        isCareerPlanningReleased,
        backlog,
        feedbacks,
        atas,
        sharedDocuments,
        objectives
      })
    };
  } catch (error: unknown) {
    console.error(`❌ [Career Action] Falha ao carregar dados para matricula ${matricula}:`, error);
    return { success: false, error: getErrorMessage(error, "Erro de autorizacao ou conexao com o banco.") };
  }
}

/**
 * addCareerTaskAction
 * Adiciona uma nova tarefa ao backlog de carreira do usuário.
 */
export async function addCareerTaskAction(
  matricula: string,
  title: string,
  idToken?: string
): Promise<{ success: boolean; task?: CareerTask; error?: string }> {
  try {
    const { db } = await checkAuthAndGetDb(matricula, idToken);
    
    if (!title || !title.trim()) {
      throw new Error("O titulo da tarefa nao pode estar em branco.");
    }

    const colRef = db.collection(`User/${matricula}/Career_Backlog`);
    const newTaskRef = colRef.doc(); // Auto-generates ID

    const now = new Date().toISOString();
    const newTask: Omit<CareerTask, "id"> = {
      title: title.trim(),
      status: "Backlog",
      createdAt: now,
      statusHistory: [
        {
          status: "Backlog",
          changedAt: now
        }
      ],
      comments: []
    };

    await newTaskRef.set(newTask);

    return {
      success: true,
      task: serializeData({
        id: newTaskRef.id,
        ...newTask
      })
    };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao adicionar tarefa:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao gravar tarefa no Firestore.") };
  }
}

/**
 * updateCareerTaskStatusAction
 * Altera o status de uma tarefa e registra a alteração no histórico de timestamps.
 */
export async function updateCareerTaskStatusAction(
  matricula: string,
  taskId: string,
  newStatus: CareerTaskStatus,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await checkAuthAndGetDb(matricula, idToken);

    if (!taskId) throw new Error("ID da tarefa nao fornecido.");

    const taskRef = db.doc(`User/${matricula}/Career_Backlog/${taskId}`);
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(taskRef);
      if (!snap.exists) {
        throw new Error("Tarefa nao encontrada.");
      }

      const currentData = snap.data() || {};
      const currentHistory = currentData.statusHistory || [];

      const updatedHistory = [
        ...currentHistory,
        {
          status: newStatus,
          changedAt: now
        }
      ];

      transaction.update(taskRef, {
        status: newStatus,
        statusHistory: updatedHistory,
        updatedAt: now
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao atualizar status da tarefa:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao salvar novo status.") };
  }
}

/**
 * addCareerTaskCommentAction
 * Adiciona um comentário atômico à lista de observações da tarefa.
 */
export async function addCareerTaskCommentAction(
  matricula: string,
  taskId: string,
  commentText: string,
  idToken?: string
): Promise<{ success: boolean; comment?: CareerTaskComment; error?: string }> {
  try {
    const { db, is_admin } = await checkAuthAndGetDb(matricula, idToken);

    if (!taskId) throw new Error("ID da tarefa nao fornecido.");
    if (!commentText || !commentText.trim()) {
      throw new Error("O comentario nao pode estar em branco.");
    }

    const taskRef = db.doc(`User/${matricula}/Career_Backlog/${taskId}`);
    const commentId = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    const newComment: CareerTaskComment = {
      id: commentId,
      text: commentText.trim(),
      author: is_admin ? "admin" : "user",
      createdAt: now
    };

    await taskRef.update({
      comments: admin.firestore.FieldValue.arrayUnion(newComment),
      updatedAt: now
    });

    return {
      success: true,
      comment: serializeData(newComment)
    };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao adicionar comentario:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao gravar comentario.") };
  }
}

/**
 * deleteCareerTaskAction
 * Remove permanentemente uma tarefa do backlog (Exclusivo Membro/Admin).
 */
export async function deleteCareerTaskAction(
  matricula: string,
  taskId: string,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await checkAuthAndGetDb(matricula, idToken);

    if (!taskId) throw new Error("ID da tarefa nao fornecido.");

    const taskRef = db.doc(`User/${matricula}/Career_Backlog/${taskId}`);
    await taskRef.delete();

    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao deletar tarefa:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao remover tarefa.") };
  }
}

/**
 * saveCareerObjectiveAction
 * Cria ou atualiza um objetivo de carreira e suas metas.
 */
export async function saveCareerObjectiveAction(
  matricula: string,
  id: string | null,
  title: string,
  description: string,
  status: "Não Iniciado" | "Em Andamento" | "Alcançado" | "Pausado",
  targetDate: string,
  goals: CareerGoal[],
  idToken?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { db } = await checkAuthAndGetDb(matricula, idToken);

    if (!title || !title.trim()) {
      throw new Error("O titulo do objetivo nao pode estar vazio.");
    }

    const colRef = db.collection(`User/${matricula}/Career_Objectives`);
    const objRef = id ? colRef.doc(id) : colRef.doc();

    const now = new Date().toISOString();
    const payload: Omit<CareerObjective, "id"> = {
      title: title.trim(),
      description: description ? description.trim() : "",
      status,
      targetDate: targetDate || "",
      goals: goals || [],
      createdAt: now
    };

    if (id) {
      // Se for atualizacao, nao substituimos a data de criacao original
      await objRef.set(payload, { merge: true });
    } else {
      await objRef.set(payload);
    }

    return {
      success: true,
      id: objRef.id
    };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao salvar objetivo:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao gravar objetivo.") };
  }
}

/**
 * updateCareerGoalProgressAction
 * Atualiza o progresso real de uma meta específica dentro de um objetivo e recalcula o seu status.
 */
export async function updateCareerGoalProgressAction(
  matricula: string,
  objectiveId: string,
  goalId: string,
  currentValue: number,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await checkAuthAndGetDb(matricula, idToken);

    if (!objectiveId || !goalId) {
      throw new Error("IDs de objetivo e meta sao obrigatorios.");
    }

    const objRef = db.doc(`User/${matricula}/Career_Objectives/${objectiveId}`);

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(objRef);
      if (!snap.exists) {
        throw new Error("Objetivo nao encontrado.");
      }

      const data = snap.data() as CareerObjective;
      const goals = data.goals || [];

      const updatedGoals = goals.map((goal) => {
        if (docMatchId(goal.id, goalId)) {
          const completed = currentValue >= goal.targetValue;
          return {
            ...goal,
            currentValue,
            completed
          };
        }
        return goal;
      });

      // Recalcular status do objetivo geral
      let nextStatus = data.status;
      const totalGoals = updatedGoals.length;
      const completedGoals = updatedGoals.filter(g => g.completed).length;

      if (totalGoals > 0) {
        if (completedGoals === totalGoals) {
          nextStatus = "Alcançado";
        } else if (completedGoals > 0 || currentValue > 0) {
          nextStatus = "Em Andamento";
        } else {
          nextStatus = "Não Iniciado";
        }
      }

      transaction.update(objRef, {
        goals: updatedGoals,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao atualizar progresso da meta:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao salvar progresso.") };
  }
}

// Helper robusto para comparar IDs (comporta numeros ou strings)
function docMatchId(id1: any, id2: any): boolean {
  return String(id1) === String(id2);
}

/**
 * addCareerFeedbackAction (Exclusivo Admin)
 * Insere uma recomendação / feedback qualitativo no histórico do usuário.
 */
export async function addCareerFeedbackAction(
  matricula: string,
  title: string,
  content: string,
  author: string,
  adminToken?: string
): Promise<{ success: boolean; feedback?: CareerFeedback; error?: string }> {
  try {
    const session = await requireAdmin(adminToken);
    const db = getAdminDb();

    if (!title || !title.trim() || !content || !content.trim()) {
      throw new Error("Titulo e conteudo sao obrigatorios para o feedback.");
    }

    const ref = db.collection(`User/${matricula}/Feedbacks`).doc();
    const now = new Date().toISOString();

    const newFeedback: Omit<CareerFeedback, "id"> = {
      title: title.trim(),
      content: content.trim(),
      author: author || session.email || "Consultor BPlen",
      createdAt: now
    };

    await ref.set(newFeedback);

    return {
      success: true,
      feedback: serializeData({
        id: ref.id,
        ...newFeedback
      })
    };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao cadastrar feedback:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao gravar feedback.") };
  }
}

/**
 * addCareerAtaAction (Exclusivo Admin)
 * Vincula uma Ata de reunião (Google Drive URL) à matrícula do usuário.
 */
export async function addCareerAtaAction(
  matricula: string,
  title: string,
  meetingDate: string,
  fileUrl: string,
  contentSummary?: string,
  adminToken?: string
): Promise<{ success: boolean; ata?: CareerAta; error?: string }> {
  try {
    await requireAdmin(adminToken);
    const db = getAdminDb();

    if (!title || !title.trim() || !meetingDate || !fileUrl) {
      throw new Error("Titulo, data de reuniao e link do Google Drive sao obrigatorios.");
    }

    const ref = db.collection(`User/${matricula}/Atas`).doc();
    const now = new Date().toISOString();

    const newAta: Omit<CareerAta, "id"> = {
      title: title.trim(),
      meetingDate,
      fileUrl: fileUrl.trim(),
      contentSummary: contentSummary ? contentSummary.trim() : "",
      createdAt: now
    };

    await ref.set(newAta);

    return {
      success: true,
      ata: serializeData({
        id: ref.id,
        ...newAta
      })
    };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao cadastrar ata:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao gravar ata.") };
  }
}

/**
 * addCareerSharedDocumentAction (Exclusivo Admin)
 * Vincula um documento genérico (Google Drive URL) à matrícula do usuário.
 */
export async function addCareerSharedDocumentAction(
  matricula: string,
  title: string,
  fileUrl: string,
  fileName: string,
  category: "Plano de Carreira" | "Relatório" | "Outros",
  adminToken?: string
): Promise<{ success: boolean; doc?: CareerSharedDocument; error?: string }> {
  try {
    await requireAdmin(adminToken);
    const db = getAdminDb();

    if (!title || !title.trim() || !fileUrl || !fileName) {
      throw new Error("Titulo, link do arquivo e nome do arquivo sao obrigatorios.");
    }

    const ref = db.collection(`User/${matricula}/Shared_Documents`).doc();
    const now = new Date().toISOString();

    const newDoc: Omit<CareerSharedDocument, "id"> = {
      title: title.trim(),
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim(),
      category: category || "Outros",
      createdAt: now
    };

    await ref.set(newDoc);

    return {
      success: true,
      doc: serializeData({
        id: ref.id,
        ...newDoc
      })
    };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao cadastrar documento compartilhado:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao gravar documento.") };
  }
}

/**
 * saveCustomResourcesAction (Exclusivo Admin)
 * Salva combustíveis e barreiras customizadas no metadado do usuário.
 */
export async function saveCustomResourcesAction(
  matricula: string,
  combustiveis: string[],
  barreiras: string[],
  adminToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin(adminToken);
    const db = getAdminDb();

    const accessRef = db.doc(`User/${matricula}/User_Permissions/access`);

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(accessRef);
      const data = snap.exists ? snap.data() || {} : {};
      
      const currentMetadata = data.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        combustiveis_custom: combustiveis,
        barreiras_custom: barreiras
      };

      transaction.set(accessRef, {
        ...data,
        metadata: updatedMetadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: `ADMIN:${session.email || session.uid}`
      }, { merge: true });
    });

    console.log(`✅ [Career Action] Recursos customizados salvos para o usuário ${matricula}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [Career Action] Erro ao salvar recursos customizados:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao salvar recursos customizados no servidor.") };
  }
}

