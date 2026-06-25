import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
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
