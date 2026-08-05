import { PartnerTermsDocument, PartnerTermsSection } from "@/types/partners";

/**
 * Montagem do termo de parceria para UM parceiro especifico.
 *
 * O documento juridico da BPlen tem duas caracteristicas que nao podem virar
 * "alguem lembra de editar na hora": blocos condicionais ("EXIBIDO APENAS SE ...") e
 * campos a preencher ("[nome completo ou razao social]", "[matricula/ID do parceiro]").
 *
 * Aqui os dois viram DADO: a condicao e' um campo do bloco, e os campos a preencher sao
 * marcadores resolvidos com o cadastro do proprio parceiro. Regra pura, testada sem
 * banco — e' o texto que a pessoa assina.
 */

export interface PartnerTermsContext {
  partnerName: string;
  /** CPF ou CNPJ, conforme o tipo de parceria. */
  partnerDocument: string;
  partnerAddress: string;
  partnerMatricula: string;
  commissionPercent: number;
  /** Parceria remunerada — libera o bloco de comissionamento. */
  isCommercial: boolean;
  /** Direito a vitrine publica — libera o bloco da vitrine. */
  hasPublicShowcase: boolean;
}

/** Marcador nao preenchido aparece assim, em vez de sumir em silencio. */
const PENDENTE = "[a preencher]";

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

/** Substitui os marcadores do texto pelos dados do parceiro. */
export function fillTermsTokens(text: string, context: PartnerTermsContext): string {
  const valores: Record<string, string> = {
    partnerName: context.partnerName?.trim() || PENDENTE,
    partnerDocument: context.partnerDocument?.trim() || PENDENTE,
    partnerAddress: context.partnerAddress?.trim() || PENDENTE,
    partnerMatricula: context.partnerMatricula?.trim() || PENDENTE,
    commissionPercent: String(context.commissionPercent ?? 0),
  };

  return text.replace(TOKEN_PATTERN, (original, chave: string) =>
    Object.prototype.hasOwnProperty.call(valores, chave) ? valores[chave] : original
  );
}

/** O bloco deve aparecer para este parceiro? */
export function sectionApplies(section: PartnerTermsSection, context: PartnerTermsContext): boolean {
  switch (section.condition) {
    case "commercial":
      return context.isCommercial;
    case "public_showcase":
      return context.hasPublicShowcase;
    default:
      return true;
  }
}

/**
 * Documento pronto para exibicao: so os blocos que se aplicam, com os marcadores ja
 * preenchidos. O titulo e a introducao tambem passam pelos marcadores.
 */
export function resolveTermsForPartner(
  document: PartnerTermsDocument,
  context: PartnerTermsContext
): PartnerTermsDocument {
  return {
    ...document,
    title: fillTermsTokens(document.title, context),
    intro: document.intro ? fillTermsTokens(document.intro, context) : document.intro,
    sections: document.sections
      .filter((section) => sectionApplies(section, context))
      .map((section) => ({
        ...section,
        title: section.title ? fillTermsTokens(section.title, context) : section.title,
        body: fillTermsTokens(section.body, context),
      })),
    acceptances: document.acceptances.map((acceptance) => ({
      ...acceptance,
      label: fillTermsTokens(acceptance.label, context),
    })),
  };
}

/**
 * Modelo oficial — "Termo de Alianca e Parceria Estrategica" (documento juridico da
 * BPlen, entregue pela Gestora em 2026-08-05).
 *
 * Fica no codigo apenas como MODELO carregavel pela tela de admin: o documento vigente
 * vive no banco e e' editavel sem passar por deploy. Publicar continua sendo ato dela.
 *
 * Dois pontos de atencao ao revisar:
 * - A clausula 2.3 do original fixa "10%"; aqui ela usa o marcador da taxa real do
 *   parceiro, para o texto assinado nunca divergir do que o sistema calcula.
 * - Os dois blocos condicionais do original viraram condicao de dado (`commercial` e
 *   `public_showcase`), em vez de instrucao em texto.
 */
export const PARTNER_TERMS_TEMPLATE: PartnerTermsDocument = {
  version: "1.0",
  title: "BPlen HUB | Termo de Aliança e Parceria Estratégica",
  intro:
    "Leia o termo integralmente. Ao assinar, você declara ter lido e concordado com todas as cláusulas, com validade jurídica reconhecida (MP 2.200-2/2001).",
  published: false,
  sections: [
    {
      condition: "always",
      title: "DAS PARTES E DA NATUREZA DA PARCERIA",
      body: `CONTRATADA (BPlen): LENCINA ESTRATÉGIA E GESTÃO DE NEGÓCIOS E PESSOAS LTDA, inscrita no CNPJ 62.857.668/0001-07, com sede em São Paulo/SP.

PARCEIRO: {{partnerName}}, inscrito no {{partnerDocument}}, residente/sediado em {{partnerAddress}}, identificado na plataforma pelo código {{partnerMatricula}}.

Cláusula 1.1 - Do Objeto: O presente Termo estabelece as regras, os direitos e os deveres para a atuação do PARCEIRO na indicação e captação de novos clientes para os serviços de desenvolvimento profissional e ecossistema digital da BPlen HUB.

Cláusula 1.2 - Independência das Relações: Fica expressamente estabelecido que a figura do "Parceiro" não se confunde com a de "Cliente" ou "Embaixador". O fato de o PARCEIRO ser ou já ter sido um cliente da BPlen em jornadas de desenvolvimento não altera a natureza comercial deste instrumento.

Cláusula 1.3 - Ausência de Vínculo Trabalhista: A relação ora estabelecida é de natureza estritamente civil e comercial. O PARCEIRO atuará com total autonomia, sem exclusividade, sem controle de jornada, sem metas obrigatórias de vendas e sem qualquer subordinação jurídica, administrativa ou técnica, restando expressamente afastado qualquer vínculo empregatício com a BPlen.`,
    },
    {
      condition: "commercial",
      title: "DA JORNADA, COMISSIONAMENTO E REGRAS FINANCEIRAS",
      body: `Cláusula 2.1 - A Jornada do Parceiro: A atuação comercial do PARCEIRO seguirá uma trilha de autonomia estruturada em 3 (três) etapas:

Conexão: Ativação do cadastro e alinhamento com as diretrizes e valores da marca BPlen;

Tração: Inclusão do nome do PARCEIRO na lista oficial de indicações da plataforma BPlen HUB, com liberdade total para captação de clientes;

Escala: Acompanhamento do ciclo de vida dos clientes indicados, estimulando o consumo de novos pacotes (upsell) para a geração de receitas recorrentes.

Cláusula 2.2 - Da Propriedade do Cliente (Regra de First-Touch): Para que uma indicação seja considerada válida, o cliente final deverá, no ato do seu cadastro ou compra na BPlen, selecionar o PARCEIRO na lista de indicações.

§1º - Exclusividade de Primeira Origem: A indicação só será validada se for o primeiro contato do cliente com a BPlen. Clientes que já possuam cadastro prévio na base de dados da BPlen, provenientes de outras fontes, não serão contabilizados para o PARCEIRO, mesmo que este tenha influenciado em uma nova compra ou upsell.

§2º - Ciclo de Vida: Respeitada a regra do §1º, o cliente pertencerá à carteira do PARCEIRO por tempo indeterminado. O PARCEIRO será comissionado sobre todas as aquisições de serviços, pacotes ou upsells realizados por este cliente enquanto este contrato estiver vigente.

Cláusula 2.3 - Do Comissionamento: A BPlen repassará ao PARCEIRO o percentual fixo de {{commissionPercent}}% sobre o valor líquido efetivamente pago pelo cliente final na contratação de qualquer pacote ou serviço.

§ Único: Entende-se por "valor líquido" o montante final pago após a aplicação de eventuais descontos promocionais, cupons ou abatimentos concedidos no momento da venda.

Cláusula 2.4 - Do Fluxo Operacional e SLA de Pagamento: O processo de apuração e repasse financeiro obedecerá ao seguinte ciclo mensal:

I. Apuração: Ao final de cada ciclo de faturamento, a BPlen disponibilizará ao PARCEIRO um relatório transparente com a listagem dos clientes convertidos no período e o respectivo cálculo da comissão gerada.

II. Faturamento: Após a conferência do relatório, o PARCEIRO deverá emitir e enviar à BPlen a respectiva Nota Fiscal de Prestação de Serviços (ou Recibo/RPA em caso de Pessoa Física).

III. Pagamento: Mediante a entrega da documentação fiscal, a BPlen realizará a transferência bancária do valor da comissão até o dia 15 (quinze) do mês subsequente ao pagamento efetuado pelo cliente final.

Cláusula 2.5 - Proteção contra Inadimplência e Cancelamentos (Chargeback): O comissionamento é devido exclusivamente sobre valores efetivamente recebidos pela BPlen.

§ Único: Na ocorrência de cancelamento do serviço por parte do cliente final (seja pelo direito de arrependimento legal do CDC ou rescisão proporcional) que obrigue a BPlen a realizar reembolso de valores, a comissão do PARCEIRO sobre o montante devolvido será automaticamente cancelada. Caso a comissão já tenha sido paga ao PARCEIRO, o respectivo valor será descontado/compensado no ciclo de pagamento do mês subsequente.`,
    },
    {
      condition: "always",
      title: "GOVERNANÇA E REGRAS INEGOCIÁVEIS",
      body: `Cláusula 3.1 - Confidencialidade e Sigilo (NDA): O PARCEIRO compromete-se a manter em absoluto sigilo todas as informações comerciais, financeiras, metodológicas, listas de preços e estratégias de negócios da BPlen a que tiver acesso em virtude desta parceria, sendo vedada a divulgação a terceiros sob pena de responsabilização civil e criminal, além da rescisão imediata do contrato.

Cláusula 3.2 - Uso da Marca: O PARCEIRO está autorizado a utilizar o nome e os materiais de divulgação fornecidos pela BPlen estritamente para o propósito de captação de clientes. É terminantemente proibido modificar logos, criar promessas enganosas sobre os serviços ou apresentar-se como sócio, funcionário ou representante legal da BPlen.

Cláusula 3.3 - Proteção de Dados (LGPD): O PARCEIRO declara possuir base legal válida (preferencialmente consentimento) para o compartilhamento de dados de potenciais clientes com a BPlen, comprometendo-se a, mediante solicitação, comprovar a origem lícita desses dados. A BPlen reserva-se o direito de recusar ou excluir indicações cuja origem dos dados não possa ser comprovada, sem prejuízo de outras medidas cabíveis.

Cláusula 3.4 - Modificação e Rescisão: A BPlen reserva-se o direito de alterar o portfólio de serviços, valores e a presente política de parceria mediante aviso prévio. Este instrumento poderá ser rescindido por qualquer uma das partes, a qualquer momento, sem incidência de multas, mediante comunicação prévia, resguardado o direito de recebimento de comissões por vendas já integralmente concluídas até a data do encerramento.

Cláusula 3.5 - Do Foro: Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas decorrentes deste instrumento.

Cláusula 3.6 - Aceite Eletrônico: Ao prosseguir e formalizar este termo via plataforma digital (Clickwrap), mediante registro sistêmico e Timestamp, o PARCEIRO declara ter lido e concordado com todas as cláusulas, com validade jurídica reconhecida (MP 2.200-2/2001).`,
    },
    {
      condition: "always",
      title: "DOS BENEFÍCIOS DE VISIBILIDADE E ECOSSISTEMA BPLEN",
      body: `Cláusula 4.1 - Do Diretório de Networking Interno (BPlen HUB): A BPlen disponibiliza aos seus clientes a página de ecossistema "Networking BPlen". O PARCEIRO terá a oportunidade de criar um perfil de destaque neste diretório interno para gerar conexões, parcerias e negócios com outros membros e clientes da plataforma.

§ 1º - Do Compartilhamento de Dados Peer-to-Peer: O PARCEIRO declara-se ciente de que a inclusão no Diretório de Networking pressupõe a exibição mútua e voluntária de dados profissionais para outros usuários logados no ecossistema (tratamento de dados na modalidade de compartilhamento entre pares). Os dados visíveis incluirão, limitadamente: nome profissional, foto de perfil, minibiografia, especialidades de atuação e links diretos para contatos profissionais ou redes sociais por ele cadastrados.

§ 2º - Do Controle de Privacidade pelo Titular: Em estrita observância à autodeterminação informativa da LGPD, a ativação e exibição do perfil no diretório de networking não ocorrerá de forma automática. Caberá única e exclusivamente ao PARCEIRO, por meio de ato inequívoco em sua área logada na plataforma BPlen HUB: ativar voluntariamente a visibilidade de sua conta para ingressar no ecossistema; e gerenciar, modificar ou desativar a exibição de seus dados a qualquer tempo, bastando alterar suas preferências no menu de configurações de privacidade, o que resultará na ocultação imediata do seu perfil para os demais usuários.

§ 3º - Da Limitação de Responsabilidade nas Interações: A BPlen atua meramente como provedora da infraestrutura tecnológica do ecossistema digital (obrigação de meio). As negociações, troca de mensagens, contratos ou parcerias comerciais firmadas diretamente entre o PARCEIRO e terceiros dentro da Área de Networking são de responsabilidade exclusiva dos transacionantes, não gerando qualquer vínculo de solidariedade jurídica ou financeira por parte da BPlen.`,
    },
    {
      condition: "public_showcase",
      title: "DA VITRINE PÚBLICA DE PARCEIROS OFICIAIS",
      body: `Cláusula 4.2 - Da Vitrine Pública de Parceiros Oficiais: Como reconhecimento pelo seu engajamento e alinhamento estratégico, a BPlen concede ao PARCEIRO o status de "Parceiro Destaque".

§1º - Exposição de Marca: O PARCEIRO terá o seu nome, logotipo (se aplicável) e um link de contato ou portfólio exibidos na página pública oficial de parceiros da BPlen.

§2º - Licença de Uso: Para a efetivação deste benefício, o PARCEIRO concede à BPlen uma licença gratuita, revogável a qualquer momento mediante solicitação ao Encarregado de Dados, comprometendo-se a BPlen a remover o perfil da página pública em até 15 (quinze) dias corridos a contar do pedido de revogação.

§3º - Manutenção do Benefício: A BPlen reserva-se o direito de remover o perfil do PARCEIRO da página pública a qualquer momento, seja por inatividade comercial, por solicitação do próprio parceiro, ou por desalinhamento com o Código de Conduta da marca.`,
    },
  ],
  acceptances: [
    {
      id: "termo_integral",
      label: "Li e concordo integralmente com o Termo de Aliança e Parceria Estratégica.",
      required: true,
    },
    {
      id: "first_touch",
      label:
        "Estou ciente de que a indicação só é válida quando o cliente me seleciona no primeiro contato dele com a BPlen (regra de primeira origem).",
      required: true,
    },
    {
      id: "sigilo_e_marca",
      label:
        "Comprometo-me com o sigilo das informações da BPlen e com o uso da marca apenas na forma autorizada.",
      required: true,
    },
    {
      id: "lgpd_origem_dados",
      label:
        "Declaro possuir base legal válida para compartilhar dados de potenciais clientes com a BPlen.",
      required: true,
    },
  ],
};
