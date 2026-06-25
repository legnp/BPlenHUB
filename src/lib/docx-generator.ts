import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";
import { SurveyValue } from "@/types/survey";

/**
 * Utilitário para gerar e exportar o Master CV em formato Word (.docx).
 * Executado localmente (Client Side) via Lazy Loading para evitar impacto de bundle.
 */
export async function generateMasterCvDocx(responses: Record<string, SurveyValue>, userName: string) {
  
  // Helpers para extração
  const getStr = (id: string) => (responses[id] ? String(responses[id]) : "");
  const getArr = (id: string) => (Array.isArray(responses[id]) ? (responses[id] as any[]) : []);

  const experiencias = getArr("experiencias");
  const formacoes = getArr("formacoes");
  const certificacoes = getArr("certificacoes_projetos");
  const hardSkills = getArr("hard_skills").join(", ");
  const metodologias = getArr("metodologias").join(", ");

  const doc = new Document({
    creator: "BPlen HUB",
    title: `Master CV - ${userName}`,
    description: "Banco de Dados de Perfil Profissional",
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt = 22 half-points
            color: "000000",
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              before: 120,
              after: 120,
            },
          },
        },
        heading1: {
          run: { size: 36, bold: true, color: "000000" },
          paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER },
        },
        heading2: {
          run: { size: 28, bold: true, color: "000000" },
          paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.LEFT },
        },
        heading3: {
          run: { size: 24, bold: true, color: "000000" },
          paragraph: { spacing: { before: 120, after: 60 } },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // CABEÇALHO (IDENTIFICAÇÃO)
          new Paragraph({ text: getStr("nome_completo").toUpperCase(), heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun(`${getStr("localizacao")} | ${getStr("telefone")} | ${getStr("email_profissional")}`),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun(`LinkedIn: ${getStr("linkedin")}`),
              getStr("portfolio") ? new TextRun(` | Portfólio: ${getStr("portfolio")}`) : new TextRun(""),
            ],
          }),

          // RESUMO PROFISSIONAL
          new Paragraph({ text: "RESUMO PROFISSIONAL", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: getStr("resumo_profissional") }),

          // PALAVRAS CHAVE
          new Paragraph({ text: "COMPETÊNCIAS E METODOLOGIAS", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hard Skills e Ferramentas: ", bold: true }),
              new TextRun(hardSkills || "Não informado"),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Metodologias e Setor: ", bold: true }),
              new TextRun(metodologias || "Não informado"),
            ]
          }),

          // HISTÓRICO PROFISSIONAL
          new Paragraph({ text: "HISTÓRICO PROFISSIONAL", heading: HeadingLevel.HEADING_2 }),
          ...experiencias.flatMap((exp: any) => [
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: [
                new TextRun({ text: `${exp.cargo || ""} - ${exp.empresa || ""}`, bold: true }),
              ],
            }),
            new Paragraph({ text: `Período: ${exp.periodo || ""}` }),
            new Paragraph({
              children: [
                new TextRun({ text: "Contexto: ", bold: true }),
                new TextRun(exp.contexto || ""),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Conquistas: ", bold: true }),
                new TextRun(exp.conquistas || ""),
              ],
            }),
          ]),

          // EDUCAÇÃO FORMAL
          new Paragraph({ text: "FORMAÇÃO ACADÊMICA", heading: HeadingLevel.HEADING_2 }),
          ...formacoes.flatMap((form: any) => [
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: [
                new TextRun({ text: `${form.grau || ""} em ${form.curso || ""}`, bold: true }),
              ],
            }),
            new Paragraph({ text: `${form.instituicao || ""} | Conclusão: ${form.ano_conclusao || ""}` }),
            form.destaques ? new Paragraph({ text: `Destaques: ${form.destaques}` }) : new Paragraph(""),
          ]),

          // CERTIFICAÇÕES
          ...(certificacoes.length > 0 ? [
            new Paragraph({ text: "CERTIFICAÇÕES E PROJETOS EXTRAS", heading: HeadingLevel.HEADING_2 }),
            ...certificacoes.flatMap((cert: any) => [
              new Paragraph({
                heading: HeadingLevel.HEADING_3,
                children: [
                  new TextRun({ text: `${cert.nome || ""} - ${cert.instituicao || ""}`, bold: true }),
                ],
              }),
              new Paragraph({ text: `Data: ${cert.data || ""}` }),
              new Paragraph({ text: cert.objetivo || "" }),
              cert.conquistas ? new Paragraph({ text: `Conquistas: ${cert.conquistas}` }) : new Paragraph(""),
            ])
          ] : [])
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Master_CV_${userName.replace(/\s+/g, '_')}.docx`);
}

/**
 * Utilitário para gerar e exportar o Plano de Desenvolvimento Individual (PDI) em Word (.docx).
 * Executado Client-Side via Lazy Loading.
 */
export async function generatePdiDocx(responses: Record<string, SurveyValue>, userName: string) {
  const getStr = (id: string) => (responses[id] ? String(responses[id]) : "");

  const completionDate = new Date();
  const openingDate = new Date(completionDate);
  openingDate.setMonth(openingDate.getMonth() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const dateStr = formatDate(completionDate);
  const openingDateStr = formatDate(openingDate);

  // Tabelas de Metas e Ciclos
  const tempo = getStr("tempo_revisao") || "15 minutos";
  const freq = getStr("frequencia_revisao") || "A cada 7 dias";

  const rows = [
    // Header Row
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: "7C3AED" },
          children: [new Paragraph({ children: [new TextRun({ text: "Ciclo", bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })]
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: { fill: "7C3AED" },
          children: [new Paragraph({ children: [new TextRun({ text: "Meta Planejada e Ações", bold: true, color: "FFFFFF" })] })]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: "7C3AED" },
          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })]
        })
      ]
    }),
    // Ciclo 1 (preenchido com mini_meta_7_dias)
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Ciclo 1 (7 dias)", bold: true })], alignment: AlignmentType.CENTER })]
        }),
        new TableCell({
          children: [new Paragraph({ text: getStr("mini_meta_7_dias") || "Não informado" })]
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "[  ] Concluído" })], alignment: AlignmentType.CENTER })]
        })
      ]
    })
  ];

  // Adicionar ciclos vazios para preenchimento físico
  for (let i = 2; i <= 6; i++) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Ciclo ${i}`, bold: true })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ text: "Escreva à caneta: ___________________________________________________________" })]
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "[  ] Concluído" })], alignment: AlignmentType.CENTER })]
          })
        ]
      })
    );
  }

  const cycleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows
  });

  // Tabela Aceleradores / Freios
  const gridTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: "F5F3FF" }, // subtle purple background
            children: [
              new Paragraph({
                children: [new TextRun({ text: "MOTORES / COMBUSTÍVEIS", bold: true, size: 20, color: "7C3AED" })],
                spacing: { after: 120 }
              }),
              new Paragraph({
                children: [new TextRun({ text: `• ${getStr("combustivel_1") || "Não informado"}` })],
                spacing: { before: 60, after: 60 }
              }),
              new Paragraph({
                children: [new TextRun({ text: `• ${getStr("combustivel_2") || "Não informado"}` })],
                spacing: { before: 60, after: 60 }
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: "FFF1F2" }, // subtle red background for obstacles
            children: [
              new Paragraph({
                children: [new TextRun({ text: "BARREIRAS / FREIOS", bold: true, size: 20, color: "E11D48" })],
                spacing: { after: 120 }
              }),
              new Paragraph({
                children: [new TextRun({ text: `• ${getStr("freio_1") || "Não informado"}` })],
                spacing: { before: 60, after: 60 }
              }),
              new Paragraph({
                children: [new TextRun({ text: `• ${getStr("freio_2") || "Não informado"}` })],
                spacing: { before: 60, after: 60 }
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    creator: "BPlen HUB",
    title: `PDI - ${userName}`,
    description: "Plano de Desenvolvimento Individual",
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt = 22 half-points
            color: "111111",
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              before: 120,
              after: 120,
            },
          },
        },
        heading1: {
          run: { size: 36, bold: true, color: "111111" },
          paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER },
        },
        heading2: {
          run: { size: 26, bold: true, color: "7C3AED" },
          paragraph: { spacing: { before: 360, after: 120 }, alignment: AlignmentType.LEFT },
        },
        heading3: {
          run: { size: 22, bold: true, color: "444444" },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Capa
          new Paragraph({ text: "", spacing: { before: 1200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "BPlen HUB", bold: true, size: 28, color: "7C3AED" })]
          }),
          new Paragraph({ text: "", spacing: { before: 600 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "PLANO DE DESENVOLVIMENTO INDIVIDUAL (PDI)", bold: true, size: 34, color: "111111" })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Módulo Posicionamento de Carreira", size: 20, color: "666666" })]
          }),
          new Paragraph({ text: "", spacing: { before: 2400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "PROFISSIONAL: ", bold: true }),
              new TextRun({ text: userName.toUpperCase(), bold: true, color: "7C3AED" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Elaborado em: ${dateStr}` })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Validade do Plano: ${openingDateStr} (Ciclo de 6 meses)` })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Previsão de Abertura da Carta ao Futuro: ", bold: true }),
              new TextRun({ text: openingDateStr, bold: true, color: "E11D48" })
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // Página 2: Conteúdo
          new Paragraph({ text: "1. OBJETIVO ESTRATÉGICO", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Objetivo Central: ", bold: true, color: "7C3AED" }),
              new TextRun({ text: getStr("objetivo_frase"), bold: true, size: 24 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Detalhamento e Recursos: ", bold: true }),
              new TextRun({ text: getStr("objetivo_detalhes") })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Custo da Inação (Reflexão sobre desistir): ", bold: true }),
              new TextRun({ text: getStr("reflexao_desistir") })
            ]
          }),

          new Paragraph({ text: "2. ACELERADORES E FREIOS", heading: HeadingLevel.HEADING_2 }),
          gridTable,
          new Paragraph({ text: "", spacing: { after: 120 } }),

          new Paragraph({ text: "Plano de Contingência (O Dia Seguinte)", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Caso as maiores barreiras te vençam, qual o seu plano de recomeço: ", bold: true }),
              new TextRun({ text: getStr("pior_cenario_recomeco") })
            ]
          }),

          new Paragraph({ text: "Regras Inegociáveis do Dia a Dia", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. ", bold: true }),
              new TextRun({ text: getStr("regra_inegociavel_1") || "Não informado" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. ", bold: true }),
              new TextRun({ text: getStr("regra_inegociavel_2") || "Não informado" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. ", bold: true }),
              new TextRun({ text: getStr("regra_inegociavel_3") || "Não informado" })
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // Página 3: Rastreador de Ciclos
          new Paragraph({ text: "3. RASTREADOR DE CICLOS DE METAS", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Rotina de Acompanhamento: ", bold: true }),
              new TextRun({ text: `Este PDI será revisado a cada ` }),
              new TextRun({ text: tempo, bold: true, color: "7C3AED" }),
              new TextRun({ text: ` com duração de ` }),
              new TextRun({ text: freq, bold: true, color: "7C3AED" }),
              new TextRun({ text: ` por parada.` })
            ]
          }),
          new Paragraph({ text: "Utilize a tabela abaixo para acompanhar cada ciclo de revisão de metas:" }),
          cycleTable,
          new Paragraph({ text: "", spacing: { after: 120 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "* Dica de Engajamento: ", bold: true, size: 18, color: "666666" }),
              new TextRun({ text: "Imprima este documento e preencha as metas futuras e status à caneta para criar uma âncora física de execução diária.", size: 18, color: "666666" })
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // Página 4: Apoio e Compromisso
          new Paragraph({ text: "4. REDE DE APOIO E BLINDAGEM", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Parceiro de Apoio Designado: ", bold: true }),
              new TextRun({ text: getStr("nome_rede_apoio") || "Não informado", bold: true, color: "7C3AED" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Quando as maiores autossabotagens e freios começarem a atuar, seu parceiro de apoio está autorizado e convocado a te dizer/fazer o seguinte:", bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `"${getStr("mensagem_blindagem") || "Não informado"}"`, italics: true, color: "555555" })
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 240 } }),

          new Paragraph({ text: "Compromisso de Longo Prazo", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Previsão de Abertura da Carta ao Futuro: ", bold: true }),
              new TextRun({ text: `Sua Carta ao Futuro física, escrita a próprio punho, foi lacrada e guardada de forma segura. Ela deverá ser aberta exatamente em ` }),
              new TextRun({ text: openingDateStr, bold: true, color: "E11D48" }),
              new TextRun({ text: ` (exatamente 6 meses a partir da data de conclusão deste plano).` })
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 480 } }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "O desconforto da execução passa rápido, mas os resultados do planejamento consistente constroem uma carreira sólida e com propósito.", bold: true, size: 20, color: "7C3AED" })
            ]
          }),
          new Paragraph({ text: "", spacing: { before: 1200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "© BPlen — Todos os Direitos Reservados", size: 16, color: "999999" })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `PDI_${userName.replace(/\s+/g, '_')}.docx`);
}
