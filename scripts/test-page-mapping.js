const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[match[1]] = value.replace(/\\n/g, '\n');
    }
  });
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    })
  });
}

const db = admin.firestore();

function normalizeStr(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, "-");
}

function isAtaOrFeedbackMatch(activityTitle, refId, itemTitle) {
  const aTitle = normalizeStr(activityTitle);
  const iTitle = normalizeStr(itemTitle);
  const rId = normalizeStr(refId);

  if (aTitle === iTitle) return true;
  if (aTitle.includes(iTitle) || iTitle.includes(aTitle)) return true;

  // Keyword exceptions
  if (rId.includes("onboarding") && iTitle.includes("onboarding")) return true;
  if (rId.includes("devolutiva-analise") && (iTitle.includes("devolutiva") || iTitle.includes("perfil"))) return true;
  if (rId.includes("devolutiva-plano") && (iTitle.includes("plano") || iTitle.includes("pdi"))) return true;
  if (rId.includes("mentocoach") && iTitle.includes("mentocoach")) return true;
  if (rId.includes("offboarding") && iTitle.includes("offboarding")) return true;

  return false;
}

function getActivityName(type, refId, defaultTitle) {
  const normalizedRefId = (refId || "").toLowerCase().replace(/-/g, "_");
  
  if (type === "survey") {
    switch (normalizedRefId) {
      case "desmistificando_candidaturas": return "Diagnostico de Oportunidades e Mercado Oculto";
      case "master_cv": return "Preenchimento do Master CV";
      case "cv_focado": return "Customizacao do CV Focado";
      case "perfil_profissional_publico": return "Otimizacao do Perfil Profissional Publico (LinkedIn)";
      case "preparacao_entrevistas_networking": return "Preparacao para Entrevistas e Networking";
      case "pre_analise_comportamental": return "Pre-Analise de Inteligencia Comportamental";
      case "feedback_posicionamento_profissional": return "Feedback de Posicionamento Profissional";
      case "check_in": return "Formulario de Check-in Metodologico";
      case "disc": return "Mapeamento do Perfil Comportamental (DISC)";
      case "preferencias_reconhecimento": return "Avaliacao de Preferencias de Reconhecimento";
      case "preferencias_aprendizado": return "Avaliacao de Preferencias de Aprendizado";
      case "gestao_tempo": return "Mapeamento de Gestao de Tempo";
      case "survey_plano_acordos": return "Avisos e Acordos do Plano de Carreira";
      case "survey_plano_fase1": return "Definicao de Objetivos do Plano de Carreira";
      case "survey_plano_fase2": return "Selecao de Recursos do Plano de Carreira";
      case "survey_plano_fase3": return "Plano de Acao de Carreira";
      case "survey_plano_fase4": return "Consolidacao do Plano de Carreira";
      case "survey_agendamento_devolutiva": return "Agendamento de Devolutiva do Plano de Carreira";
      case "offboarding_survey": return "Avaliacao de Fechamento de Ciclo";
      default: return defaultTitle;
    }
  }

  if (type === "meeting") {
    switch (normalizedRefId) {
      case "onboarding": return "Mentoria Individual de Onboarding";
      case "devolutiva_analise_comportamental": return "Mentoria Individual de Devolutiva de Perfil";
      case "devolutiva_plano_carreira": return "Mentoria Individual de Alinhamento de PDI";
      case "sessao_mentocoach": return "Sessao Individual de MentoCoach";
      case "offboarding": return "Mentoria Individual de Fechamento";
      default: return defaultTitle;
    }
  }

  return defaultTitle;
}

async function run() {
  const matricula = "BP-005-PF-260523";
  
  // Fetch stages
  const snapshot = await db.collection("products").where("isStepJourney", "==", true).get();
  const journeyProducts = snapshot.docs.map(doc => {
    const data = doc.data();
    const substeps = [];
    if (data.deliverySteps) {
      data.deliverySteps.forEach(step => {
        substeps.push({
          id: `ss-${step.type}-${step.referenceId}`,
          title: step.title,
          type: step.type,
          referenceId: step.referenceId,
          description: step.description || "Atividade de desenvolvimento",
          order: step.order ? String(step.order) : ""
        });
      });
    }
    return {
      id: doc.id,
      title: data.title,
      order: data.order,
      substeps
    };
  });
  
  const progressDoc = await db.collection("User").doc(matricula).collection("User_Journey").doc("progress").get();
  const progress = progressDoc.data();

  // Fetch career data
  const backlogSnap = await db.collection(`User/${matricula}/Career_Backlog`).get();
  const feedbacksSnap = await db.collection(`User/${matricula}/Feedbacks`).get();
  const atasSnap = await db.collection(`User/${matricula}/Atas`).get();
  const docsSnap = await db.collection(`User/${matricula}/Shared_Documents`).get();
  
  const careerData = {
    backlog: backlogSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    feedbacks: feedbacksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    atas: atasSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    sharedDocuments: docsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  };

  const list = [];
  
  journeyProducts.forEach(stage => {
    if (stage.id === "primeiros-passos" || stage.id === "primeiros_passos" || stage.order === 0) return;
    
    const completedIds = progress?.steps[stage.id]?.completedSubSteps || [];

    stage.substeps.forEach((sub) => {
      const isCompleted = completedIds.includes(sub.id);
      
      let documentUrl = "";
      let hasFeedback = false;
      let feedbackText = "";

      const friendlyTitle = getActivityName(sub.type, sub.referenceId, sub.title);

      if (isCompleted) {
        if (sub.referenceId === "master_cv" || sub.referenceId === "cv_focado") {
          documentUrl = `/hub/membro/journey/${stage.id}`;
        } else if (sub.referenceId === "disc") {
          documentUrl = `/hub/membro/journey/${stage.id}`;
        } else if (sub.referenceId === "survey_plano_fase4") {
          documentUrl = `/hub/membro/journey/${stage.id}`;
        }
      }

      // Se houver atas de reunioes
      if (sub.type === "meeting" && careerData.atas) {
        const matchedAta = careerData.atas.find((a) => 
          isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, a.title)
        );
        if (matchedAta) {
          documentUrl = matchedAta.fileUrl;
          hasFeedback = true;
          feedbackText = matchedAta.contentSummary || "Sessao realizada com sucesso.";
        }
      }

      // Se houver feedbacks cadastrados
      if (careerData.feedbacks) {
        const matchedFb = careerData.feedbacks.find((f) => 
          isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, f.sessionTitle || f.title)
        );
        if (matchedFb) {
          hasFeedback = true;
          // Notice: using content because feedbackText does not exist in document
          feedbackText = matchedFb.content || matchedFb.feedbackText || feedbackText;
        }
      }

      // Se houver documentos compartilhados
      if (careerData.sharedDocuments) {
        const matchedDoc = careerData.sharedDocuments.find((d) => 
          isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, d.name || d.title)
        );
        if (matchedDoc && matchedDoc.fileUrl) {
          documentUrl = matchedDoc.fileUrl;
        }
      }

      if (isCompleted) {
        list.push({
          id: sub.id,
          title: friendlyTitle,
          stageName: stage.title,
          documentUrl,
          hasFeedback,
          feedbackText
        });
      }
    });
  });

  console.log("Mapped Completed Activities:");
  console.log(JSON.stringify(list, null, 2));
}

run().catch(console.error);
