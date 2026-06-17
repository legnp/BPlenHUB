"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { Product } from "@/types/products";
import { PRODUCTS_COLLECTION } from "@/config/collections";

/**
 * SEED: Cadastro de Serviços PF (Junior, Pleno, Senior, Líder) 🧬
 * Cadastra ou mescla os produtos estruturados na coleção principal do Firestore.
 */
export async function seedComparisonProductsAction() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const pfProducts: Product[] = [
      {
        id: "junior",
        slug: "junior",
        serviceCode: "BPL-JR-01",
        title: "Junior",
        kicker: "Plano Self-Service",
        targetAudiences: ["people"],
        price: 0,
        isStepJourney: false,
        order: 10,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sheet: {
          description: "Solução de entrada focada em autoaplicação para profissionais em início de carreira estruturarem seus primeiros passos com ferramentas autônomas.",
          coverImage: "/images/products/junior-cover.jpg",
          paymentConditions: "Acesso gratuito / Autoaplicável.",
          faq: [
            { question: "O que é o plano Junior?", answer: "É uma modalidade self-service gratuita onde você estrutura seu currículo e PDI de forma independente." },
            { question: "Como funciona a entrega?", answer: "Você receberá acesso imediato à plataforma de autoavaliação e guias para estruturar seu currículo e plano de desenvolvimento." }
          ],
          termsAndConditions: "Uso individual e autônomo de acordo com os termos da plataforma.",
          seo: {
            title: "Plano Junior - BPlen HUB",
            description: "Estruturação autônoma de carreira e currículo.",
            keywords: ["self-service", "curriculo", "pdi"]
          },
          deliverables: ["Duração Média: 1 semana", "Revisão e elaboração de CV", "PDI Básico", "Preparação para Entrevista"]
        },
        capabilities: { surveys: [], forms: [], allowedEventTypes: [] },
        grantedQuotas: {},
        workflow: [
          { id: "jr-1", title: "Setup Inicial", type: "task", description: "Configuração do perfil no HUB" },
          { id: "jr-2", title: "Elaboração de CV", type: "task", description: "Criação do currículo guiado" }
        ]
      },
      {
        id: "pleno",
        slug: "pleno",
        serviceCode: "BPL-PL-02",
        title: "Pleno",
        kicker: "Mentoria & Crescimento",
        targetAudiences: ["people"],
        price: 826.72,
        isStepJourney: false,
        order: 11,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sheet: {
          description: "Aceleração de carreira com mentoria consultiva e suporte de especialistas para sua consolidação profissional.",
          coverImage: "/images/products/pleno-cover.jpg",
          paymentConditions: "Parcelado em até 5x de R$ 165,34 sem juros ou com 5% de desconto à vista.",
          faq: [
            { question: "O que inclui a consultoria?", answer: "Sessões de devolutiva e acompanhamento profissional estratégico com mentores especialistas." }
          ],
          termsAndConditions: "Suporte consultivo completo por 2 semanas.",
          seo: {
            title: "Plano Pleno - BPlen HUB",
            description: "Aceleração profissional com mentoria personalizada.",
            keywords: ["mentoria", "carreira", "pleno"]
          },
          deliverables: ["Duração Média: 2 semanas", "Revisão e elaboração de CV", "PDI Básico", "Preparação para Entrevista", "Análise Comportamental", "Consultoria (Horas)", "Acesso à Área de Membro BPlen"]
        },
        capabilities: { surveys: ["disc"], forms: [], allowedEventTypes: ["devolutiva"] },
        grantedQuotas: { "devolutiva": 1 },
        workflow: [
          { id: "pl-1", title: "Mapeamento Comportamental", type: "milestone", description: "Avaliação completa DISC" },
          { id: "pl-2", title: "Devolutiva Individual", type: "task", description: "Sessão de mentoria especializada com entrega de relatório" }
        ]
      },
      {
        id: "senior",
        slug: "senior",
        serviceCode: "BPL-SR-03",
        title: "Senior",
        kicker: "Liderança e Alta Performance",
        targetAudiences: ["people"],
        price: 1628.08,
        isStepJourney: false,
        order: 12,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sheet: {
          description: "Mapeamento comportamental de elite, plano de carreira avançado e mentoria individualizada para seniores e líderes.",
          coverImage: "/images/products/senior-cover.jpg",
          paymentConditions: "Parcelado em até 5x de R$ 325,62 sem juros ou com 5% de desconto à vista.",
          faq: [
            { question: "Como funciona o PDI Avançado?", answer: "É uma mentoria estratégica dedicada para desenho de metas personalizadas e planos de ação de curto e médio prazo." }
          ],
          termsAndConditions: "Consultoria dedicada exclusiva com acompanhamento.",
          seo: {
            title: "Plano Senior - BPlen HUB",
            description: "Mentoria individual de liderança e alta performance.",
            keywords: ["liderança", "senior", "pdi avançado"]
          },
          deliverables: ["Duração Média: 1 mês", "Revisão e elaboração de CV", "PDI Básico", "Preparação para Entrevista", "Análise Comportamental", "Plano de Carreira com PDI Avançado", "Consultoria dedicada", "1to1 de Acompanhamento", "Acesso à Área de Membro BPlen"]
        },
        capabilities: { surveys: ["disc", "welcome_survey"], forms: [], allowedEventTypes: ["devolutiva", "oneToOne"] },
        grantedQuotas: { "devolutiva": 1, "oneToOne": 1 },
        workflow: [
          { id: "sr-1", title: "DISC & Alinhamento", type: "milestone", description: "Mapeamento inicial de liderança" },
          { id: "sr-2", title: "Plano Estratégico", type: "task", description: "Construção guiada do Plano de Carreira" }
        ]
      },
      {
        id: "lider",
        slug: "lider",
        serviceCode: "BPL-LD-04",
        title: "Líder",
        kicker: "Elite Executiva & Conselhos",
        targetAudiences: ["people"],
        price: 5915.35,
        isStepJourney: false,
        order: 13,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sheet: {
          description: "Assessoria executiva de alta fidelidade com mentoria contínua, assessoria personalizada e acesso ao ecossistema de Networking BPlen.",
          coverImage: "/images/products/lider-cover.jpg",
          paymentConditions: "Parcelado em até 5x de R$ 1.183,07 sem juros ou com 5% de desconto à vista.",
          faq: [
            { question: "Como funciona o Networking BPlen?", answer: "Acesso restrito e convites para eventos exclusivos com mentores, investidores e diretores do ecossistema BPlen." }
          ],
          termsAndConditions: "Assessoria sob medida com atendimento prioritário por 4 meses.",
          seo: {
            title: "Plano Líder - BPlen HUB",
            description: "Assessoria executiva e de carreira sob medida para diretores e líderes de conselho.",
            keywords: ["diretoria", "networking", "assessoria personalizada"]
          },
          deliverables: ["Duração Média: 4 meses", "Revisão e elaboração de CV", "PDI Básico", "Preparação para Entrevista", "Análise Comportamental", "Plano de Carreira com PDI Avançado", "Gestão e Desenvolvimento de Carreira", "Assessoria de Carreira Personalizada", "1to1 de Acompanhamento", "Acesso à Área de Membro BPlen", "Acesso ao Networking BPlen"]
        },
        capabilities: { surveys: ["disc"], forms: [], allowedEventTypes: ["devolutiva", "oneToOne"] },
        grantedQuotas: { "devolutiva": 1, "oneToOne": 4 },
        workflow: [
          { id: "ld-1", title: "Mapeamento Executivo", type: "milestone", description: "DISC avançado e diagnóstico situacional de liderança" },
          { id: "ld-2", title: "Assessoria Mensal", type: "task", description: "Encontros recorrentes de alinhamento estratégico e networking corporativo" }
        ]
      }
    ];

    for (const product of pfProducts) {
      const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.id);
      batch.set(docRef, product, { merge: true });
    }

    await batch.commit();
    return { success: true, message: "Serviços PF semeados com sucesso no Firestore." };
  } catch (error) {
    console.error("Erro ao semear serviços PF:", error);
    return { success: false, message: error instanceof Error ? error.message : "Erro desconhecido." };
  }
}
