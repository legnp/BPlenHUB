import { Product, ProductSheet } from "@/types/products";

/**
 * Fonte ÚNICA do conteúdo do contrato de prestação de serviço (CT-3a, ver
 * docs/system-audit/CONTRACTS-DESIGN.md §10). Usada pelo gerador de PDF
 * (`createContractBuffer`) E pela tela de assinatura (via action de preview),
 * para que o cliente leia exatamente o que vai assinar e os dois nunca divirjam.
 *
 * Função PURA (sem I/O). O texto jurídico é preservado verbatim do gerador antigo.
 */

// `product.sheet` no Firestore carrega campos além do schema atual de ProductSheet.
type ProductSheetWithLegacyFields = ProductSheet & {
  rules?: string;
  methodologyLink?: string;
};

export interface ContractContentData {
  product: Product;
  dados: { fullName?: string; cpf?: string; address?: string };
  matricula: string;
  orderAmount: string;
  orderMethod: string;
}

export interface ContractClause {
  heading: string;
  body: string;
}

export interface ContractContent {
  documentTitle: string;
  /** Data de referência (pt-BR curta) usada na Cláusula 1. */
  dateStr: string;
  clauses: ContractClause[];
  footer: string;
}

export function buildContractClauses(data: ContractContentData): ContractContent {
  const { product, dados, matricula, orderAmount, orderMethod } = data;
  const sheet = product.sheet as ProductSheetWithLegacyFields | undefined;
  const grantedQuotas = product.grantedQuotas;

  const dateStr = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date());

  let sessionsText = "- Acesso contínuo à plataforma HUB\n";
  if (grantedQuotas) {
    sessionsText += Object.entries(grantedQuotas)
      .filter(([, qty]) => (qty as number) > 0)
      .map(([k, qty]) => `- ${qty}x ${k.replace(/-/g, " ")}`)
      .join("\n");
  }

  const clauses: ContractClause[] = [
    {
      heading: "Cláusula 1 - Das Partes e do Objeto",
      body:
        `O presente documento formaliza a contratação do serviço denominado ${product.title || "Pacote BPlen"}, doravante referido como 'Serviço', adquirido através da plataforma BPlen HUB na data de ${dateStr}.\n\n` +
        `CONTRATADA: BPlen Desenvolvimento Humano LTDA, inscrita no CNPJ 40.540.093/0001-44, com sede em Porto Alegre/RS.\n` +
        `CONTRATANTE: ${dados.fullName || "Cliente não identificado"}, portador(a) do CPF ${dados.cpf || "não informado"}, residente em ${dados.address || "endereço cadastrado na plataforma"}, identificado(a) na plataforma pelo código ${matricula}.`,
    },
    {
      heading: "Cláusula 2 - Do Escopo e Entregáveis (Ficha Técnica Integrada)",
      body:
        `O Serviço compreende as seguintes etapas, objetivos e entregáveis metodológicos:\n\n` +
        `${sheet?.description || "Descrição padrão do serviço."}\n\nEtapas da Jornada:\n` +
        (product.workflow?.map((w) => `- ${w.title}`).join("\n") || "- Etapas detalhadas na plataforma."),
    },
    {
      heading: "Cláusula 3 - Das Regras Operacionais e Eventos",
      body:
        `A prestação do Serviço obedecerá aos seguintes limites e tipos de sessão/eventos (conforme cadastro do produto):\n` +
        sessionsText +
        `\n\n${sheet?.rules || "Regras de reagendamento regidas pelos Termos de Uso gerais da plataforma."}`,
    },
    {
      heading: "Cláusula 4 - Do Valor e Condições de Pagamento",
      body: `Pela prestação dos Serviços ora pactuados, o CONTRATANTE compromete-se a pagar à CONTRATADA o valor líquido total de ${orderAmount}, cuja quitação e aprovação ocorreu na modalidade [${orderMethod}] no momento do checkout pela plataforma. A emissão da respectiva Nota Fiscal obedecerá às normas tributárias vigentes.`,
    },
    {
      heading: "Cláusula 5 - Da Política de Cancelamento e Reembolso",
      body: "Em estrita observância ao Código de Defesa do Consumidor (Lei nº 8.078/1990), o CONTRATANTE detém o direito de arrependimento, podendo solicitar o cancelamento do serviço com restituição integral dos valores pagos no prazo improrrogável de 7 (sete) dias corridos a contar da data de contratação. Ultrapassado este período, a solicitação de cancelamento imotivado por parte do CONTRATANTE ensejará a restituição de 50% (cinquenta por cento) do valor proporcional referente estritamente às sessões, etapas ou horas não consumidas do pacote. Os 50% restantes serão retidos pela CONTRATADA a título de multa rescisória e cobertura de custos operacionais e de agenda já provisionados.",
    },
    {
      heading: "Cláusula 6 - Da Metodologia Aplicada",
      body: `A metodologia e as ferramentas aplicadas pela BPlen fundamentam-se em referenciais bibliográficos consolidados nas áreas de psicologia, gestão e comportamento organizacional, cujas diretrizes teóricas podem ser livremente consultadas no endereço eletrônico ${sheet?.methodologyLink || "disponibilizado na plataforma institucional"}. Ao formalizar este contrato, o CONTRATANTE declara ter plena consciência da natureza científica e estrutural dos métodos, submetendo-se voluntariamente às suas dinâmicas propostas.`,
    },
    {
      heading: "Cláusula 7 - Da Natureza do Serviço e Delimitação de Responsabilidades (Obrigação de Meio)",
      body: "O Serviço prestado pela CONTRATADA caracteriza-se juridicamente como uma obrigação de meio, fornecendo conhecimentos, estratégias, métodos, espaços estruturados para prática e facilitação na formulação de planos de ação. O atingimento de resultados específicos (como recolocação, promoções ou metas) dependerá exclusivamente do engajamento, aplicação e execução prática por parte do CONTRATANTE. Adicionalmente, reitera-se que os serviços possuem cunho estritamente voltado ao desenvolvimento de carreira e profissional, não caracterizando, nem substituindo, em qualquer hipótese, diagnósticos, tratamentos clínicos ou o devido acompanhamento com especialistas médicos e de saúde mental.",
    },
    {
      heading: "Cláusula 8 - Da Evolução do Sistema (Trava de Versão V01.01)",
      body: "O CONTRATANTE reconhece de forma expressa que o ecossistema BPlen HUB encontra-se em sua versão V01.01. Todas as funcionalidades, painéis digitais, integrações e fluxos sistêmicos atualmente disponibilizados são fornecidos no estado técnico em que se encontram (as-is). Modificações, adições de novos recursos, interrupções sistêmicas temporárias para manutenção ou descontinuidade de funcionalidades de software em versões futuras da plataforma não caracterizam falha na prestação do Serviço, não constituem quebra do escopo base ora contratado e não geram obrigação de reembolso.",
    },
    {
      heading: "Cláusula 9 - Do Aceite Conjunto e Finalização",
      body: `Ao formalizar este termo via plataforma digital (Clickwrap), mediante registro e carimbo de tempo (Timestamp) atual, o CONTRATANTE reafirma seu consentimento integral com os Termos de Uso da Plataforma e a Política de Privacidade da BPlen. O presente aceite possui validade jurídica conforme a legislação brasileira em vigor (MP 2.200-2/2001).`,
    },
  ];

  return {
    documentTitle: "TERMO E FORMALIZAÇÃO DE PRESTAÇÃO DE SERVIÇO",
    dateStr,
    clauses,
    footer:
      "Documento gerado eletronicamente pelo Sistema BPlen HUB.\nAceite logado e rastreado nos servidores de segurança Firebase.",
  };
}
