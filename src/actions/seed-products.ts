"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { Product } from "@/types/products";

const PRODUCTS_COLLECTION = "products";

/**
 * SEED: Produtos Iniciais (Milestone 1) 🧬
 * Configura os primeiros serviços reais baseados na ficha técnica do BPlen HUB.
 */
export async function seedInitialProductsAction() {
  const products: Omit<Product, 'id'>[] = [
    {
      title: "Onboarding Estratégico",
      slug: "onboarding",
      serviceCode: "BPL-000",
      targetAudiences: ["internal"],
      price: 0,
      isStepJourney: true,
      order: 1,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheet: {
        description: "Bem-vindo ao ecossistema BPlen. Nesta etapa inicial, alinhamos expectativas e preparamos seu ambiente para o sucesso.",
        coverImage: "/images/products/onboarding-cover.jpg",
        paymentConditions: "Gratuito para novos membros.",
        faq: [
          { question: "O que é o Onboarding?", answer: "É o seu rito de passagem para a plataforma." }
        ],
        termsAndConditions: "Aceite os termos globais da plataforma.",
        seo: {
          title: "Onboarding BPlen - Início da Jornada",
          description: "Comece sua evolução estratégica aqui.",
          keywords: ["onboarding", "carreira", "bplen"]
        }
      },
      capabilities: {
        surveys: ["welcome_survey"],
        forms: ["user_onboarding_form"],
        allowedEventTypes: ["onboarding"]
      },
      grantedQuotas: {
        "onboarding": 1
      },
      workflow: [
        { id: "wf-1", title: "Boas-vindas", type: "milestone", description: "Conhecer a visão BPlen" },
        { id: "wf-2", title: "Setup de Perfil", type: "task", description: "Completar dados básicos" }
      ]
    },
    {
      title: "Análise Comportamental (DISC)",
      slug: "analise-comportamental",
      serviceCode: "BPL-001",
      targetAudiences: ["people", "companies"],
      price: 497,
      isStepJourney: true,
      order: 2,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheet: {
        description: "Mapeamento completo do seu perfil através da metodologia DISC. Identifique seus motivadores e talentos naturais.",
        coverImage: "/images/products/disc-cover.jpg",
        paymentConditions: "Cartão de Crédito ou PIX.",
        faq: [
          { question: "É preciso ser especialista?", answer: "Não, a análise é intuitiva e guiada." }
        ],
        termsAndConditions: "Uso confidencial dos dados.",
        seo: {
          title: "Análise DISC - BPlen HUB",
          description: "Mapeamento comportamental de alta precisão.",
          keywords: ["disc", "comportamento", "liderança"]
        }
      },
      capabilities: {
        surveys: ["pre_analise_comportamental", "disc"],
        forms: ["devolutiva-disc"],
        allowedEventTypes: ["devolutiva-analise-comportamental"]
      },
      grantedQuotas: {
        "devolutiva-analise-comportamental": 1
      },
      workflow: [
        { id: "wf-d1", title: "Pré-análise", type: "milestone", description: "Alinhamento de expectativas" },
        { id: "wf-d2", title: "Assessment DISC", type: "task", description: "Execução da avaliação" },
        { id: "wf-d3", title: "Reunião de Devolutiva", type: "milestone", description: "Com mentor especialista" }
      ]
    }
  ];

  try {
    const db = getAdminDb();
    const batch = db.batch();

    for (const p of products) {
      const docRef = db.collection(PRODUCTS_COLLECTION).doc(p.slug);
      batch.set(docRef, p);
    }

    await batch.commit();
    return { success: true, message: "Produtos iniciais semeados com sucesso!" };
  } catch (error) {
    console.error("Erro no seed de produtos:", error);
    throw error;
  }
}
