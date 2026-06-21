"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { Product } from "@/types/products";
import { JourneyStep, SubStepConfig, JourneyProgress } from "@/types/journey";
import { surveys } from "@/config/surveys";
import { JOURNEY_STAGES } from "@/config/journey/steps-registry";
import { syncJourneyToUserDrive } from "@/lib/drive-sync";
import { normalizeString } from "@/lib/utils";


/**
 * BPlen HUB — Grouped Journey Engine (Server Side) 🧬
 * Busca produtos marcados como jornada e os AGRUPA por 'order'.
 * Isso permite que múltiplos serviços (ex: Carreira Individual e Grupo) 
 * apareçam sob um único ícone de etapa.
 */
export async function getJourneyStagesAction(): Promise<JourneyStep[]> {
  try {
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
        return isActive && hasOrder && Number(p.order) >= 0;
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
                id: `ss-${step.type}-${step.referenceId}`,
                title: step.title,
                type: step.type,
                referenceId: step.referenceId,
                description: step.description || "Atividade de desenvolvimento"
              });
            });
          } else {
            // 🛡️ Fallback de Retrocompatibilidade (Comportamento legatário agrupado)
            // 1. Gather all potential functional substeps
            // Surveys
            if (product.capabilities?.surveys) {
              product.capabilities.surveys.forEach(srvId => {
                const srv = (surveys as any)[srvId];
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
          workflow: main.workflow || []
        };
      })
      .sort((a, b) => a.order - b.order);

    console.log(`✅ [JourneyAction] Arquitetura consolidada para ${stages.length} estágios únicos.`);
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
    const db = getAdminDb();
    
    // 🧬 REGRA DE NORMALIZAÇÃO BPLEN (Soberania de Dados)
    // Convertemos underscores para hifens e tudo para minúsculo para bater com o ID do Firestore
    const normalizedSlug = slug.toLowerCase().replace(/_/g, '-');

    // 1. Busca Direta por ID Normalizado
    let productDoc: any = await db.collection("products").doc(normalizedSlug).get();
    
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
          description: step.description || "Atividade de desenvolvimento"
        });
      });
    } else {
      // Buscar substeps funcionais (Surveys, Forms, Meetings)
      if (product.capabilities?.surveys) {
        product.capabilities.surveys.forEach(srvId => {
          const srv = (surveys as any)[srvId];
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
      workflow: product.workflow || []
    };
  } catch (error) {
    console.error(`🚨 [JourneyAction] Erro ao buscar standalone stage (${slug}):`, error);
    return null;
  }
}

/**
 * Busca o progresso real do usuário no Firestore 🔐🧬
 */
export async function getJourneyProgressAction(uid: string): Promise<JourneyProgress | null> {
  try {
    const db = getAdminDb();
    
    // 1. Resolver Matrícula via UID
    const uidMapSnap = await db.collection("_AuthMap").doc(uid).get();
    if (!uidMapSnap.exists) return null;
    const matricula = uidMapSnap.data()?.matricula;
    if (!matricula) return null;

    // 2. Buscar Documentos de Progresso
    const progressRef = db.collection("User").doc(matricula).collection("User_Journey").doc("progress");
    const progressSnap = await progressRef.get();

    if (!progressSnap.exists) return null;

    const data = progressSnap.data();
    return {
      matricula,
      lastActiveStepId: data?.lastActiveStepId || "onboarding",
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
  completed: boolean
): Promise<{ success: boolean; progress?: JourneyProgress }> {
  try {
    const db = getAdminDb();
    
    // 1. Resolver Matrícula
    const uidMapSnap = await db.collection("_AuthMap").doc(uid).get();
    if (!uidMapSnap.exists) throw new Error("Usuário não mapeado.");
    const matricula = uidMapSnap.data()?.matricula;

    const progressRef = db.collection("User").doc(matricula).collection("User_Journey").doc("progress");
    
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
      let newCompletionDates = { ...(stepProgress.subStepCompletionDates || {}) };

      if (completed) {
        if (!newCompleted.includes(subStepId)) newCompleted.push(subStepId);
        newCompletionDates[subStepId] = new Date().toISOString();
      } else {
        newCompleted = newCompleted.filter(id => id !== subStepId);
        delete newCompletionDates[subStepId];
      }

      // Deteccao de conclusao robusta (Global & Standalone)
      const stages = await getJourneyStagesAction();
      let stage = stages.find(s => s.id === stepId || normalizeString(s.id) === normalizeString(stepId));
      
      // Fallback para estágios especiais (Step 00 / Standalone)
      if (!stage) {
        stage = await getStandaloneStageAction(stepId) || undefined;
      }

      const totalSubsteps = stage?.substeps.length || 0;
      const newStatus = (totalSubsteps > 0 && newCompleted.length >= totalSubsteps) ? "completed" : "current";

      const updatedSteps = {
        ...current?.steps,
        [matchedDbKey]: {
          ...stepProgress,
          completedSubSteps: newCompleted,
          subStepCompletionDates: newCompletionDates,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      };

      // 🛰️ LIBERAÇÃO AUTOMÁTICA EM CADEIA
      if (newStatus === "completed") {
         const currentIdx = stages.findIndex(s => s.id === stepId);
         if (currentIdx !== -1 && currentIdx < stages.length - 1) {
            const nextStageId = stages[currentIdx + 1].id;
            if (!updatedSteps[nextStageId]) {
               updatedSteps[nextStageId] = {
                  stepId: nextStageId,
                  status: "current",
                  completedSubSteps: []
               };
            } else if (updatedSteps[nextStageId].status === "locked") {
               updatedSteps[nextStageId].status = "current";
            }
         }
      }

      // 📈 CÁLCULO DE TELEMETRIA GLOBAL REAL
      // Incluímos todos os estágios conhecidos na conta do progresso total
      const totalAllSubsteps = stages.reduce((acc, s) => acc + s.substeps.length, 0);
      const completedAllSubsteps = stages.reduce((acc, s) => {
        const sProgress = updatedSteps[s.id];
        return acc + (sProgress?.completedSubSteps?.length || 0);
      }, 0);
      
      const overallProgress = totalAllSubsteps > 0 
        ? Math.round((completedAllSubsteps / totalAllSubsteps) * 100) 
        : 0;

      const finalProgress = {
        matricula,
        lastActiveStepId: stepId,
        steps: updatedSteps,
        overallProgress: overallProgress,
        updatedAt: new Date().toISOString()
      };

      transaction.set(progressRef, finalProgress, { merge: true });
      return finalProgress;
    });

    const finalProgressTyped = trxResult as unknown as JourneyProgress;

    // 📡 Sincronizar Snapshot com o Google Drive (Assíncrono para não travar a UI)
    try {
      getJourneyStagesAction().then(stages => {
        const updatedAtStr = new Date().toLocaleDateString('pt-BR');
        const rowsData: any[][] = [];

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
    console.error("❌ [JourneyAction] Erro ao atualizar subpasso:", error);
    return { success: false };
  }
}

