"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, requireAdmin, AuthorizationError } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { JourneyStep, SubStepConfig, JourneyProgress, UserStepProgress, ClientJourneyInstruments } from "@/types/journey";
import { SurveyConfig } from "@/types/survey";
import { surveys } from "@/config/surveys";
import { JOURNEY_STAGES } from "@/config/journey/steps-registry";
import { syncJourneyToUserDrive } from "@/lib/drive-sync";
import { normalizeString } from "@/lib/utils";
import { getErrorMessage } from "@/lib/utils/errors";
import { nextDynamicSubstepOrder } from "@/lib/journey/dynamic-substep-order";
import { activityKeyOf, isCrossCompletable, repeatedActivityKeys } from "@/lib/journey/cross-completion";
import { JourneyAudience, JOURNEY_PROGRESS_DOC, productServesJourneyAudience } from "@/lib/journey/audience";

// `surveys` é indexado por IDs literais conhecidos, mas `capabilities.surveys`
// vem de dados dinâmicos do Firestore (podem não corresponder a uma chave real).
const surveyRegistry = surveys as Record<string, SurveyConfig | undefined>;


/**
 * BPlen HUB — Journey Server Actions 🧬
 * Última atualização: Sincronização de nomenclaturas e limpeza de ordem da jornada (Sprint 6.4)
 * 
 * BPlen HUB — Grouped Journey Engine (Server Side) 🧬
 * Busca produtos marcados como jornada e os AGRUPA por 'order'.
 * Isso permite que múltiplos serviços (ex: Carreira Individual e Grupo) 
 * apareçam sob um único ícone de etapa.
 */
export async function getJourneyStagesAction(
  audience: JourneyAudience = "member"
): Promise<JourneyStep[]> {
  try {
    await requireAuth();
    const db = getAdminDb();
    console.log("🔍 [JourneyAction] Iniciando busca agrupada no Firestore...");
    
    // 1. Fetch all candidate products
    const snapshot = await db.collection("products")
      .where("isStepJourney", "==", true)
      .get();

    if (snapshot.empty) {
      console.warn("⚠️ [JourneyAction] Nenhum produto de jornada encontrado.");
      return [];
    }

    // 2. Map and Filter active products
    // 🛡️ Filtro Resiliente: Aceita 'active', 'Ativo' ou ausência de status (v3.1 default)
    const journeyProducts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Product))
      .filter(p => {
        const status = p.status?.toLowerCase();
        const isActive = !status || status === "active" || status === "ativo";
        const hasOrder = p.order !== undefined && p.order !== null;
        // Filtro de audiencia (Fase 1 da Area de Parceiros): sem ele, os checkpoints
        // do parceiro apareceriam na jornada de todos os membros. A regra e' pura e
        // testada em __tests__/lib/journey-audience.test.ts — o membro nao perde
        // nenhuma etapa que ja via.
        return isActive && hasOrder && Number(p.order) >= 0 && productServesJourneyAudience(p, audience);
      });

    // 3. GROUP BY ORDER 📦
    const groupedStages: Record<number, { main: Product, products: Product[] }> = {};

    journeyProducts.forEach(p => {
      const order = Number(p.order);
      if (!groupedStages[order]) {
        groupedStages[order] = { main: p, products: [p] };
      } else {
        groupedStages[order].products.push(p);
        // O produto "main" é preferencialmente o que tem a slug mais curta/limpa (ex: 'coaching-e-mentoria' vs 'coaching')
        if (p.slug && p.slug.length < (groupedStages[order].main.slug?.length || 999)) {
          groupedStages[order].main = p;
        }
      }
    });

    // 4. Transform Groups into JourneySteps
    const stages: JourneyStep[] = Object.entries(groupedStages)
      .map(([orderStr, group]) => {
        const order = Number(orderStr);
        const { main, products } = group;
        const allSubsteps: SubStepConfig[] = [];

        // Consolidar substeps de todos os produtos do grupo
        products.forEach(product => {
          const productSubsteps: SubStepConfig[] = [];

          if (product.deliverySteps && product.deliverySteps.length > 0) {
            // 🚀 Modo Dinâmico Premium: Respeita rigorosamente a ordem e títulos da Esteira de Entrega
            product.deliverySteps.forEach(step => {
              productSubsteps.push({
                // O id vem do dado (`deliverySteps[].id`, gerado pelo parser do
                // portfolio). Recalcular aqui a partir de type+referenceId
                // colapsava todas as paradas que repetem o mesmo referenceId num
                // id so — e como a conclusao e gravada por id, concluir uma
                // marcava todas as irmas (MentoCoach: 10 sessoes; GDC: 10
                // orientacoes). O fallback cobre produto legado sem id no dado.
                id: step.id || `ss-${step.type}-${step.referenceId}`,
                title: step.title,
                type: step.type,
                referenceId: step.referenceId,
                description: step.description || "Atividade de desenvolvimento",
                order: step.order ? String(step.order) : ""
              });
            });
          } else {
            // 🛡️ Fallback de Retrocompatibilidade (Comportamento legatário agrupado)
            // 1. Gather all potential functional substeps
            // Surveys
            if (product.capabilities?.surveys) {
              product.capabilities.surveys.forEach(srvId => {
                const srv = surveyRegistry[srvId];
                productSubsteps.push({
                  id: `ss-srv-${srvId}`,
                  title: srv?.title || `Pesquisa: ${srvId}`,
                  type: "survey",
                  referenceId: srvId,
                  description: srv?.description || "Análise e avaliação"
                });
              });
            }
            // Forms
            if (product.capabilities?.forms) {
              product.capabilities.forms.forEach(frmId => {
                productSubsteps.push({
                  id: `ss-frm-${frmId}`,
                  title: `Formulário: ${frmId}`,
                  type: "form",
                  referenceId: frmId
                });
              });
            }
            // Meetings
            if (product.capabilities?.allowedEventTypes) {
              product.capabilities.allowedEventTypes.forEach(evtId => {
                productSubsteps.push({
                  id: `ss-mtg-${evtId}`,
                  title: products.length > 1 ? `Agendar: ${product.title}` : `Agendar Sessão`,
                  type: "meeting",
                  referenceId: evtId,
                  description: product.sheet?.description || "Sessão individual"
                });
              });
            }

            // 2. 🧠 Sincronizar nomes com o Workflow de Entrega (Definido no Admin)
            // Se houver um workflow definido, usamos os títulos por índice.
            if (product.workflow && product.workflow.length > 0) {
              productSubsteps.forEach((ss, idx) => {
                const workflowStep = product.workflow[idx];
                if (workflowStep) {
                  // Sobrescrevemos o título técnico pelo título definido na jornada estratégica
                  ss.title = workflowStep.title;
                  // Se o workflow tiver descrição, também atualizamos para ser mais humano
                  if (workflowStep.description) {
                    ss.description = workflowStep.description;
                  }
                }
              });

              // Garante que a jornada respeite o tamanho do workflow configurado (Soberania do Admin) 🛡️
              while (productSubsteps.length > product.workflow.length) {
                productSubsteps.pop();
              }
            }
          }

          allSubsteps.push(...productSubsteps);
        });

        // 🔮 Mapeamento de Ícones Inteligente (Baseado em Ordem/Slug)
        const getIconName = (order: number, slug?: string) => {
          if (order === 0) return "Search";
          if (slug === 'onboarding') return "Rocket";
          if (slug?.includes('analise-comportamental')) return "Fingerprint";
          if (order === 2) return "Compass";
          if (order === 4) return "Map";
          if (order === 5) return "TrendingUp";
          if (order === 6) return "MessageSquareHeart";
          if (order === 7) return "Award";
          return "Target";
        };

        // 🛡️ Soberania Híbrida: Garante que etapas core (como Onboarding) usem a tipagem rigorosa
        // do nosso registro estático para evitar que um survey seja renderizado no lugar de um vídeo.
        let finalSubsteps = allSubsteps;
        const staticStageMatch = JOURNEY_STAGES.find(s => s.id === main.slug);
        if (staticStageMatch && staticStageMatch.substeps.length > 0) {
           finalSubsteps = staticStageMatch.substeps;
        }

        return {
          id: main.slug || main.id,
          order: order,
          title: main.title,
          subtitle: main.sheet?.description?.slice(0, 60) + "..." || "",
          icon: getIconName(order, main.slug),
          description: main.sheet?.description || "",
          substeps: finalSubsteps,
          kicker: main.kicker,
          workflow: main.workflow || [],
          // Atributos do modelo de acesso (Fase B2) — vem do produto principal
          serviceCode: main.serviceCode,
          escopo: main.escopo,
          preRequisitos: main.preRequisitos
        };
      })
      .sort((a, b) => a.order - b.order);

    console.log(`✅ [JourneyAction] Arquitetura consolidada para ${stages.length} estágios únicos (audiencia: ${audience}).`);
    return stages;

  } catch (error) {
    console.error("🚨 [JourneyAction] Erro fatal no agrupamento:", error);
    return [];
  }
}

/**
 * BPlen HUB — Standalone Stage Loader 🛰️🧬
 * Busca um único produto por slug e o formata como um JourneyStep isolado.
 * Útil para Primeiros Passos e outras trilhas fora da jornada core do membro.
 */
export async function getStandaloneStageAction(slug: string): Promise<JourneyStep | null> {
  try {
    await requireAuth();
    const db = getAdminDb();

    // 🧬 REGRA DE NORMALIZAÇÃO BPLEN (Soberania de Dados)
    // Convertemos underscores para hifens e tudo para minúsculo para bater com o ID do Firestore
    const normalizedSlug = slug.toLowerCase().replace(/_/g, '-');

    // 1. Busca Direta por ID Normalizado
    let productDoc: FirebaseFirestore.DocumentSnapshot = await db.collection("products").doc(normalizedSlug).get();
    
    // 2. Fallback: Slug ID Original (se for diferente)
    if (!productDoc.exists && normalizedSlug !== slug) {
      productDoc = await db.collection("products").doc(slug).get();
    }

    // 3. Fallback: Query por campo 'slug' exato
    if (!productDoc.exists) {
      const snapshot = await db.collection("products")
        .where("slug", "==", normalizedSlug) // Tenta slug normalizado no campo
        .limit(1)
        .get();
      if (!snapshot.empty) productDoc = snapshot.docs[0];
      
      // Segundo Fallback: Query por campo 'slug' original
      if (!productDoc.exists && normalizedSlug !== slug) {
        const snapshot2 = await db.collection("products")
          .where("slug", "==", slug)
          .limit(1)
          .get();
        if (!snapshot2.empty) productDoc = snapshot2.docs[0];
      }
    }

    if (!productDoc || (productDoc.exists === false)) {
      console.warn(`⚠️ [JourneyAction] Standalone stage não encontrado: ${slug}`);
      return null;
    }

    const productData = productDoc.data();
    if (!productData) return null;

    const product = { id: productDoc.id, ...productData } as Product;


    const substeps: SubStepConfig[] = [];
    
    if (product.deliverySteps && product.deliverySteps.length > 0) {
      product.deliverySteps.forEach(step => {
        substeps.push({
          id: `ss-${step.type}-${step.referenceId}`,
          title: step.title,
          type: step.type,
          referenceId: step.referenceId,
          description: step.description || "Atividade de desenvolvimento",
          order: step.order ? String(step.order) : ""
        });
      });
    } else {
      // Buscar substeps funcionais (Surveys, Forms, Meetings)
      if (product.capabilities?.surveys) {
        product.capabilities.surveys.forEach(srvId => {
          const srv = surveyRegistry[srvId];
          substeps.push({
            id: `ss-srv-${srvId}`,
            title: srv?.title || `Pesquisa: ${srvId}`,
            type: "survey",
            referenceId: srvId,
            description: srv?.description || "Análise e avaliação"
          });
        });
      }

      // Mesclar com workflow do Admin se disponível (Soberania do Workflow)
      if (product.workflow && product.workflow.length > 0) {
        substeps.forEach((ss, idx) => {
          const workflowStep = product.workflow[idx];
          if (workflowStep) {
            ss.title = workflowStep.title;
            if (workflowStep.description) ss.description = workflowStep.description;
          }
        });
        while (substeps.length > product.workflow.length) substeps.pop();
      }
    }

    return {
      id: product.slug || product.id,
      order: product.order || 0,
      title: product.title,
      description: product.sheet?.description || "",
      icon: "Rocket", // Default para standalone
      substeps: substeps,
      kicker: product.kicker,
      workflow: product.workflow || [],
      serviceCode: product.serviceCode,
      escopo: product.escopo,
      preRequisitos: product.preRequisitos
    };
  } catch (error) {
    console.error(`🚨 [JourneyAction] Erro ao buscar standalone stage (${slug}):`, error);
    return null;
  }
}

/**
 * Busca o progresso real do usuário no Firestore 🔐🧬
 */
export async function getJourneyProgressAction(
  uid: string,
  audience: JourneyAudience = "member"
): Promise<JourneyProgress | null> {
  try {
    const session = await requireAuth();
    if (session.uid !== uid && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode acessar a jornada de outro membro.");
    }
    const db = getAdminDb();

    // 1. Resolver Matrícula via UID
    const uidMapSnap = await db.collection("_AuthMap").doc(uid).get();
    if (!uidMapSnap.exists) return null;
    const matricula = uidMapSnap.data()?.matricula;
    if (!matricula) return null;

    // 2. Buscar Documentos de Progresso (doc irmao por audiencia — ver
    // src/lib/journey/audience.ts; a trilha de parceiro nunca escreve no doc do membro)
    const progressRef = db.collection("User").doc(matricula).collection("User_Journey").doc(JOURNEY_PROGRESS_DOC[audience]);
    const progressSnap = await progressRef.get();

    if (!progressSnap.exists) return null;

    let data = progressSnap.data() as JourneyProgress;

    // NOVO: Lazy Sync on Read (Sincronizacao Retroativa Cross-Service)
    const stages = await getJourneyStagesAction(audience);
    const { updatedSteps, hasChanges } = applyCrossCompletionSweep(data?.steps || {}, stages);

    if (hasChanges) {
      let totalAllSubsteps = 0;
      let completedAllSubsteps = 0;
      stages.forEach(s => {
         const sKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(s.id)) || s.id;
         const sProgress = updatedSteps[sKey];
         const baseCount = s.substeps.length;
         const dynamicCount = sProgress?.dynamicSubSteps?.length || 0;
         totalAllSubsteps += baseCount + dynamicCount;
         completedAllSubsteps += sProgress?.completedSubSteps?.length || 0;
      });
      const overallProgress = totalAllSubsteps > 0 ? Math.round((completedAllSubsteps / totalAllSubsteps) * 100) : 0;
      
      data = {
         ...data,
         steps: updatedSteps,
         overallProgress
      };
      
      await progressRef.set(data, { merge: true });
      console.log(`[JourneyAction] Sincronizacao Retroativa Cross-Service aplicada para ${matricula}.`);
    }

    return {
      matricula,
      // "onboarding" e' a primeira parada da trilha de membro; a de parceiro resolve a
      // primeira etapa pelo proprio catalogo (as etapas ja chegam ordenadas).
      lastActiveStepId: data?.lastActiveStepId || (audience === "partner" ? (stages[0]?.id || "") : "onboarding"),
      steps: data?.steps || {},
      overallProgress: data?.overallProgress || 0
    };
  } catch (error) {
    console.error("❌ [JourneyAction] Erro ao buscar progresso:", error);
    return null;
  }
}

/**
 * Atualiza o progresso de um substep (Parada) no Firebase 🛰️✨
 */
export async function updateJourneySubStepAction(
  uid: string,
  stepId: string,
  subStepId: string,
  completed: boolean,
  audience: JourneyAudience = "member"
): Promise<{ success: boolean; progress?: JourneyProgress }> {
  try {
    const session = await requireAuth();
    if (session.uid !== uid && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode alterar a jornada de outro membro.");
    }
    const db = getAdminDb();

    // 1. Resolver Matrícula
    const uidMapSnap = await db.collection("_AuthMap").doc(uid).get();
    if (!uidMapSnap.exists) throw new Error("Usuário não mapeado.");
    const matricula = uidMapSnap.data()?.matricula;

    const progressRef = db.collection("User").doc(matricula).collection("User_Journey").doc(JOURNEY_PROGRESS_DOC[audience]);

    const trxResult = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(progressRef);
      const current = snap.exists ? snap.data() : { steps: {}, lastActiveStepId: stepId };
      
      // Resolve matched database key based on normalized stepId comparison
      let matchedDbKey = stepId;
      if (current?.steps) {
        const stepIdNormalized = normalizeString(stepId);
        for (const key of Object.keys(current.steps)) {
          if (normalizeString(key) === stepIdNormalized) {
            matchedDbKey = key;
            break;
          }
        }
      }

      const stepProgress = current?.steps[matchedDbKey] || {
        stepId: matchedDbKey,
        status: "current",
        completedSubSteps: []
      };

      let newCompleted = [...(stepProgress.completedSubSteps || [])];
      const newCompletionDates = { ...(stepProgress.subStepCompletionDates || {}) };

      if (completed) {
        if (!newCompleted.includes(subStepId)) newCompleted.push(subStepId);
        newCompletionDates[subStepId] = new Date().toISOString();
      } else {
        newCompleted = newCompleted.filter(id => id !== subStepId);
        delete newCompletionDates[subStepId];
      }

      // Deteccao de conclusao robusta (Global & Standalone)
      const stages = await getJourneyStagesAction(audience);
      let stage = stages.find(s => s.id === stepId || normalizeString(s.id) === normalizeString(stepId));
      
      // Fallback para estagios especiais (Step 00 / Standalone)
      if (!stage) {
        stage = await getStandaloneStageAction(stepId) || undefined;
      }

      const allTargetSubsteps = [...(stage?.substeps || []), ...(stepProgress.dynamicSubSteps || [])];
      const targetSubstepConfig = allTargetSubsteps.find(s => s.id === subStepId);
      const forceRemoveKey = (!completed && targetSubstepConfig && targetSubstepConfig.referenceId) 
        ? `${targetSubstepConfig.type}:${targetSubstepConfig.referenceId}` 
        : undefined;

      const totalSubsteps = (stage?.substeps.length || 0) + (stepProgress.dynamicSubSteps?.length || 0);
      const newStatus = (totalSubsteps > 0 && newCompleted.length >= totalSubsteps) ? "completed" : "current";

      const localUpdatedSteps = {
        ...current?.steps,
        [matchedDbKey]: {
          ...stepProgress,
          completedSubSteps: newCompleted,
          subStepCompletionDates: newCompletionDates,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      };

      // NOVO: MOTOR DE CONCLUSAO CRUZADA E CASCATA
      const { updatedSteps } = applyCrossCompletionSweep(localUpdatedSteps, stages, forceRemoveKey);

      // CALCULO DE TELEMETRIA GLOBAL REAL
      // Incluimos todos os estagios conhecidos na conta do progresso total, somando base e dynamic subcheckpoints
      let totalAllSubsteps = 0;
      let completedAllSubsteps = 0;

      stages.forEach(s => {
        const sKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(s.id)) || s.id;
        const sProgress = updatedSteps[sKey];
        const baseCount = s.substeps.length;
        const dynamicCount = sProgress?.dynamicSubSteps?.length || 0;
        
        totalAllSubsteps += baseCount + dynamicCount;
        completedAllSubsteps += sProgress?.completedSubSteps?.length || 0;
      });
      
      const overallProgress = totalAllSubsteps > 0 
        ? Math.round((completedAllSubsteps / totalAllSubsteps) * 100) 
        : 0;

      const finalProgress = {
        matricula,
        lastActiveStepId: stepId,
        steps: updatedSteps,
        overallProgress: overallProgress
      };

      transaction.set(progressRef, finalProgress, { merge: true });
      return finalProgress;
    });

    const finalProgressTyped = trxResult as unknown as JourneyProgress;

    // 📡 Sincronizar Snapshot com o Google Drive (Assíncrono para não travar a UI)
    try {
      getJourneyStagesAction(audience).then(stages => {
        const updatedAtStr = new Date().toLocaleDateString('pt-BR');
        const rowsData: (string | number | boolean | null)[][] = [];

        stages.forEach(stage => {
          const stageProgress = finalProgressTyped.steps[stage.id];
          const isStageLocked = stageProgress?.status === "locked" || !stageProgress;

          stage.substeps.forEach(sub => {
            let statusLabel = "Bloqueado";
            let completionDate = "N/A";

            if (!isStageLocked) {
               const isCompleted = stageProgress?.completedSubSteps?.includes(sub.id);
               if (isCompleted) {
                   statusLabel = "Concluído";
                   const cDate = stageProgress?.subStepCompletionDates?.[sub.id];
                   completionDate = cDate ? new Date(cDate).toLocaleDateString('pt-BR') : updatedAtStr;
               }
               else {
                   statusLabel = "Pendente";
               }
            }
            
            rowsData.push([
               stage.title,
               sub.title,
               statusLabel,
               completionDate,
               updatedAtStr,
               `${finalProgressTyped.overallProgress}%`
            ]);
          });
        });

        if (rowsData.length > 0) {
          syncJourneyToUserDrive(matricula, rowsData).catch(err => console.error("🚨 [DriveSync:Journey] Erro na background task:", err));
        }
      }).catch(err => console.error("🚨 [DriveSync:Journey] Erro buscando estágios:", err));
    } catch (e) {
      console.error("🚨 [DriveSync:Journey] Erro ao engatilhar sync:", e);
    }

    return { success: true, progress: finalProgressTyped };
  } catch (error) {
    console.error("[JourneyAction] Erro ao atualizar subpasso:", error);
    return { success: false };
  }
}

export async function assignDynamicSubstepAction(
  targetMatricula: string,
  stepId: string,
  parentSubStepId: string,
  subStepConfig: {
    title: string;
    type: "survey" | "form" | "meeting" | "content";
    referenceId: string;
    description?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const subStepId = `ss-dynamic-${subStepConfig.type}-${subStepConfig.referenceId}-${Date.now()}`;
    const progressRef = db.collection("User").doc(targetMatricula).collection("User_Journey").doc("progress");

    // Etapas lidas ANTES da transacao: `getJourneyStagesAction` faz leituras proprias
    // no Firestore e chamar isso de dentro do callback transacional mistura os dois
    // contextos. A ordem do instrumento depende do checkpoint pai (ver BUG-117).
    const stages = await getJourneyStagesAction();

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(progressRef);
      if (!snap.exists) {
        throw new Error("Jornada do usuario nao encontrada. Pecao para o usuario acessar a area de membros primeiro.");
      }
      
      const progressData = snap.data() || {};
      const steps = progressData.steps || {};
      
      let matchedDbKey = stepId;
      const stepIdNormalized = normalizeString(stepId);
      for (const key of Object.keys(steps)) {
        if (normalizeString(key) === stepIdNormalized) {
          matchedDbKey = key;
          break;
        }
      }
      
      const stepProgress = steps[matchedDbKey] || {
        stepId: matchedDbKey,
        status: "current",
        completedSubSteps: [],
        dynamicSubSteps: []
      };
      
      const dynamicSubSteps = [...(stepProgress.dynamicSubSteps || [])];
      
      const alreadyExists = dynamicSubSteps.some(
        (ds) => ds.referenceId === subStepConfig.referenceId && ds.parentId === parentSubStepId
      );
      
      if (!alreadyExists) {
        // A ordem tem que ser o decimal da parada do pai (`5` -> `5.1`), senao o
        // instrumento nao agrupa sob ele na trilha e o rotulo sai malformado (BUG-117).
        const stage = stages.find(s => normalizeString(s.id) === normalizeString(matchedDbKey));
        const parentOrder = stage?.substeps.find(ss => ss.id === parentSubStepId)?.order;
        const siblingOrders = [
          ...(stage?.substeps || []).map(ss => ss.order),
          ...dynamicSubSteps.map(ds => ds.order)
        ];

        dynamicSubSteps.push({
          id: subStepId,
          parentId: parentSubStepId,
          title: subStepConfig.title,
          type: subStepConfig.type,
          referenceId: subStepConfig.referenceId,
          description: subStepConfig.description || "Subcheckpoint dinamico atribuido",
          order: nextDynamicSubstepOrder(parentOrder, siblingOrders)
        });
      }

      // `status: "current"` e deliberado: o instrumento soma ao total da etapa, entao
      // uma etapa ja concluida volta a ficar em aberto — e, pela regra global de
      // sequencia, as etapas seguintes voltam a travar ate a conclusao. Decisao da
      // Gestora (2026-08-03).
      const updatedSteps = {
        ...steps,
        [matchedDbKey]: {
          ...stepProgress,
          dynamicSubSteps,
          status: "current"
        }
      };

      let totalAllSubsteps = 0;
      let completedAllSubsteps = 0;

      stages.forEach(s => {
        const sProgress = updatedSteps[s.id];
        const baseCount = s.substeps.length;
        const dynamicCount = sProgress?.dynamicSubSteps?.length || 0;
        
        totalAllSubsteps += baseCount + dynamicCount;
        completedAllSubsteps += sProgress?.completedSubSteps?.length || 0;
      });
      
      const overallProgress = totalAllSubsteps > 0 
        ? Math.round((completedAllSubsteps / totalAllSubsteps) * 100) 
        : 0;
        
      const finalProgress = {
        ...progressData,
        steps: updatedSteps,
        overallProgress,
        updatedAt: new Date().toISOString()
      };
      
      transaction.set(progressRef, finalProgress, { merge: true });
    });
    
    return { success: true, message: "Subcheckpoint atribuido com sucesso." };
  } catch (error: unknown) {
    console.error("Erro ao atribuir subcheckpoint:", error);
    return { success: false, message: getErrorMessage(error, "Erro desconhecido") };
  }
}

/**
 * Remove um instrumento modular (subcheckpoint dinamico) da jornada de um cliente.
 *
 * E o inverso exato do `assignDynamicSubstepAction`: alem de tirar o item da lista,
 * limpa a conclusao dele (`completedSubSteps` + data) — deixar o id concluido para tras
 * inflaria a contagem da etapa e ela nunca mais fecharia em 100%. Depois refaz o mesmo
 * recalculo: status da etapa e `overallProgress`.
 *
 * So mexe no dinamico: checkpoint fixo do produto nao pode ser removido por aqui.
 */
export async function removeDynamicSubstepAction(
  targetMatricula: string,
  stepId: string,
  subStepId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const progressRef = db.collection("User").doc(targetMatricula).collection("User_Journey").doc("progress");

    const stages = await getJourneyStagesAction();

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(progressRef);
      if (!snap.exists) {
        throw new Error("Jornada do usuario nao encontrada.");
      }

      const progressData = snap.data() || {};
      const steps = progressData.steps || {};

      let matchedDbKey = stepId;
      const stepIdNormalized = normalizeString(stepId);
      for (const key of Object.keys(steps)) {
        if (normalizeString(key) === stepIdNormalized) {
          matchedDbKey = key;
          break;
        }
      }

      const stepProgress = steps[matchedDbKey];
      if (!stepProgress) {
        throw new Error("Etapa nao encontrada na jornada deste cliente.");
      }

      const dynamicSubSteps = (stepProgress.dynamicSubSteps || []).filter(
        (ds: SubStepConfig) => ds.id !== subStepId
      );
      if (dynamicSubSteps.length === (stepProgress.dynamicSubSteps || []).length) {
        throw new Error("Instrumento nao encontrado nesta etapa.");
      }

      const completedSubSteps = (stepProgress.completedSubSteps || []).filter(
        (id: string) => id !== subStepId
      );
      const subStepCompletionDates = { ...(stepProgress.subStepCompletionDates || {}) };
      delete subStepCompletionDates[subStepId];

      // Com um item a menos, a etapa pode ter voltado a fechar 100%.
      const stage = stages.find(s => normalizeString(s.id) === normalizeString(matchedDbKey));
      const totalSubsteps = (stage?.substeps.length || 0) + dynamicSubSteps.length;
      const status = stepProgress.status === "locked"
        ? "locked"
        : (totalSubsteps > 0 && completedSubSteps.length >= totalSubsteps ? "completed" : "current");

      const updatedSteps = {
        ...steps,
        [matchedDbKey]: {
          ...stepProgress,
          dynamicSubSteps,
          completedSubSteps,
          subStepCompletionDates,
          status
        }
      };

      let totalAllSubsteps = 0;
      let completedAllSubsteps = 0;

      stages.forEach(s => {
        const sKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(s.id)) || s.id;
        const sProgress = updatedSteps[sKey];
        const baseCount = s.substeps.length;
        const dynamicCount = sProgress?.dynamicSubSteps?.length || 0;

        totalAllSubsteps += baseCount + dynamicCount;
        completedAllSubsteps += sProgress?.completedSubSteps?.length || 0;
      });

      const overallProgress = totalAllSubsteps > 0
        ? Math.round((completedAllSubsteps / totalAllSubsteps) * 100)
        : 0;

      // Sem `merge` de proposito (o resto do arquivo usa merge porque so ADICIONA):
      // merge nao apaga chave de mapa, entao a data de conclusao do instrumento
      // removido sobreviveria. O payload ja e o documento inteiro (`...progressData`
      // lido nesta mesma transacao), entao a escrita cheia e equivalente e correta.
      transaction.set(progressRef, {
        ...progressData,
        steps: updatedSteps,
        overallProgress,
        updatedAt: new Date().toISOString()
      });
    });

    return { success: true, message: "Instrumento removido da jornada." };
  } catch (error: unknown) {
    console.error("Erro ao remover subcheckpoint:", error);
    return { success: false, message: getErrorMessage(error, "Erro desconhecido") };
  }
}

/**
 * Leitura administrativa: a jornada de UM cliente, etapa a etapa, com os checkpoints
 * fixos (candidatos a pai) e os instrumentos modulares ja atribuidos a ele.
 *
 * Devolve TODAS as etapas da jornada, inclusive as que o cliente ainda nao tocou —
 * atribuir um instrumento a uma etapa futura e um caso de uso valido. Sem documento de
 * progresso, as listas de instrumentos vem vazias.
 */
export async function getClientJourneyInstrumentsAction(
  targetMatricula: string
): Promise<{ success: boolean; message?: string; data?: ClientJourneyInstruments[] }> {
  try {
    await requireAdmin();
    const db = getAdminDb();

    const stages = await getJourneyStagesAction();
    const progressSnap = await db
      .collection("User").doc(targetMatricula)
      .collection("User_Journey").doc("progress")
      .get();

    const steps = (progressSnap.data()?.steps || {}) as Record<string, UserStepProgress>;

    const data: ClientJourneyInstruments[] = stages.map(stage => {
      const stepKey = Object.keys(steps).find(
        k => normalizeString(k) === normalizeString(stage.id)
      );
      const stepProgress = stepKey ? steps[stepKey] : undefined;
      const completedIds = stepProgress?.completedSubSteps || [];

      return {
        stageId: stage.id,
        title: stage.title,
        order: stage.order,
        checkpoints: stage.substeps,
        instruments: (stepProgress?.dynamicSubSteps || []).map(ds => ({
          ...ds,
          completed: completedIds.includes(ds.id)
        }))
      };
    });

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Erro ao carregar instrumentos da jornada do cliente:", error);
    return { success: false, message: getErrorMessage(error, "Erro desconhecido") };
  }
}

export async function assignDynamicSubstepToPresentAttendeesAction(
  eventId: string,
  subStepConfig: {
    title: string;
    type: "survey" | "form" | "meeting" | "content";
    referenceId: string;
    description?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) throw new Error("Evento nao encontrado.");
    
    const eventData = eventSnap.data() || {};
    const eventTheme = eventData.theme || "";
    const eventType = eventData.slug || "";
    
    const stages = await getJourneyStagesAction();
    
    // Resolve dynamically which stage allows this eventType or match by keywords
    let matchedStage = stages.find(s => s.id === "gestao-e-desenvolvimento");
    const typeLower = eventType.toLowerCase();
    if (typeLower.includes("onboarding")) {
      matchedStage = stages.find(s => s.id === "onboarding");
    } else if (typeLower.includes("analise") || typeLower.includes("devolutiva-analise")) {
      matchedStage = stages.find(s => s.id === "analise-comportamental");
    } else if (typeLower.includes("plano") || typeLower.includes("devolutiva-plano")) {
      matchedStage = stages.find(s => s.id === "plano-de-carreira");
    } else if (typeLower.includes("grupo") || typeLower.includes("orientacao-em-grupo")) {
      matchedStage = stages.find(s => s.id === "gestao-e-desenvolvimento");
    } else if (typeLower.includes("coaching") || typeLower.includes("mentoria") || typeLower.includes("1-to-1")) {
      matchedStage = stages.find(s => s.id === "coaching-e-mentoria");
    }
    
    if (!matchedStage) throw new Error("Estagio nao localizado para este tipo de evento.");
    
    const parentCheckpoint = matchedStage.substeps.find(
      ss => normalizeString(ss.title) === normalizeString(eventTheme)
    );
    
    const parentSubStepId = parentCheckpoint?.id || matchedStage.substeps[0]?.id;
    if (!parentSubStepId) throw new Error("Nenhum checkpoint pai localizado.");
    
    const attendeesSnap = await eventRef.collection("attendees").get();
    const presentAttendees = attendeesSnap.docs
      .map(doc => doc.data())
      .filter(att => att.attendanceStatus === "present" && att.matricula && att.matricula !== "PENDING");
      
    if (presentAttendees.length === 0) {
      return { success: true, message: "Nenhum participante com presenca confirmada para atribuir." };
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const att of presentAttendees) {
      const res = await assignDynamicSubstepAction(
        att.matricula,
        matchedStage.id,
        parentSubStepId,
        subStepConfig
      );
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }
    
    return {
      success: true,
      message: `Subcheckpoint atribuido com sucesso a ${successCount} participantes. Falhas: ${failedCount}.`
    };
  } catch (error: unknown) {
    console.error("Erro ao atribuir subcheckpoints em lote:", error);
    return { success: false, message: getErrorMessage(error, "Erro desconhecido") };
  }
}

/**
 * Motor de Auto-Conclusao Cruzada (Cross-Service Auto-Completion)
 * Varre o progresso e as etapas da jornada para garantir que atividades identicas
 * (mesmo type e referenceId) compartilhem o mesmo status de conclusao em toda a plataforma.
 *
 * BUG-118: "identicas" nao vale para SESSAO. As 10 paradas do MentoCoach (e as 10 do GDC)
 * compartilham o mesmo `referenceId` de proposito, entao concluir a 1a marcava as dez.
 * Quem participa da conclusao cruzada e decidido por `isCrossCompletable` — nos DOIS
 * sentidos, propagar e receber, e tambem na remocao.
 */
function applyCrossCompletionSweep(
  currentSteps: Record<string, import("@/types/journey").UserStepProgress>,
  stages: JourneyStep[],
  forceRemoveActivityKey?: string
): { updatedSteps: Record<string, import("@/types/journey").UserStepProgress>; hasChanges: boolean } {
  let hasChanges = false;
  const updatedSteps = JSON.parse(JSON.stringify(currentSteps)) as Record<string, import("@/types/journey").UserStepProgress>;

  // 1. Extrair todas as atividades concluidas unicas (type:referenceId)
  const completedActivities = new Set<string>();
  
  stages.forEach(stage => {
    const sKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(stage.id)) || stage.id;
    const progress = updatedSteps[sKey];
    if (!progress || !progress.completedSubSteps) return;

    const allSubsteps = [...(stage.substeps || []), ...(progress.dynamicSubSteps || [])];
    const repeatedKeys = repeatedActivityKeys(allSubsteps);

    progress.completedSubSteps.forEach(subId => {
      const config = allSubsteps.find(s => s.id === subId);
      if (config && isCrossCompletable(config, repeatedKeys)) {
        const key = activityKeyOf(config);
        if (key !== forceRemoveActivityKey) {
          completedActivities.add(key);
        }
      }
    });
  });

  // 2. Aplicar conclusoes cruzadas (sincronizando adicoes e remocoes)
  stages.forEach(stage => {
    const sKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(stage.id)) || stage.id;
    const progress = updatedSteps[sKey] || {
      stepId: sKey,
      status: "locked",
      completedSubSteps: []
    };

    const allSubsteps = [...(stage.substeps || []), ...(progress.dynamicSubSteps || [])];
    const repeatedKeys = repeatedActivityKeys(allSubsteps);
    let stageChanged = false;
    let newCompleted = [...(progress.completedSubSteps || [])];
    const newDates = { ...(progress.subStepCompletionDates || {}) };

    allSubsteps.forEach(sub => {
      // Sessao (e qualquer ocorrencia repetida) fica de fora nos dois sentidos: nao
      // recebe conclusao de uma irma nem e desmarcada junto com ela (BUG-118).
      if (isCrossCompletable(sub, repeatedKeys)) {
        const activityKey = activityKeyOf(sub);

        // Ativar se estiver globalmente concluido
        if (completedActivities.has(activityKey) && !newCompleted.includes(sub.id)) {
          newCompleted.push(sub.id);
          newDates[sub.id] = new Date().toISOString();
          stageChanged = true;
          hasChanges = true;
        } 
        // Forcar remocao se estiver marcado para remocao global
        else if (forceRemoveActivityKey === activityKey && newCompleted.includes(sub.id)) {
          newCompleted = newCompleted.filter(id => id !== sub.id);
          delete newDates[sub.id];
          stageChanged = true;
          hasChanges = true;
        }
      }
    });

    if (stageChanged) {
      // Reavaliar status da etapa
      const totalSubsteps = allSubsteps.length;
      const newStatus = (totalSubsteps > 0 && newCompleted.length >= totalSubsteps) 
        ? "completed" 
        : (progress.status === "locked" ? "locked" : "current");

      updatedSteps[sKey] = {
        ...progress,
        completedSubSteps: newCompleted,
        subStepCompletionDates: newDates,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
    }
  });

  // 3. Varredura em Cascata (Chain Unlocking)
  stages.forEach((stage, idx) => {
    const sKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(stage.id)) || stage.id;
    const progress = updatedSteps[sKey];
    
    if (progress?.status === "completed" && idx < stages.length - 1) {
      const nextStageId = stages[idx + 1].id;
      const nextKey = Object.keys(updatedSteps).find(k => normalizeString(k) === normalizeString(nextStageId)) || nextStageId;
      
      if (!updatedSteps[nextKey]) {
        updatedSteps[nextKey] = {
          stepId: nextKey,
          status: "current",
          completedSubSteps: []
        };
        hasChanges = true;
      } else if (updatedSteps[nextKey].status === "locked") {
        updatedSteps[nextKey].status = "current";
        hasChanges = true;
      }
    }
  });

  return { updatedSteps, hasChanges };
}

