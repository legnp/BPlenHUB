"use server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive } from "@/lib/drive-utils";
import { serverEnv } from "@/env";
import PDFDocument from "pdfkit";
import path from "path";
import crypto from "crypto";

export async function getPendingContracts(userId: string) {
  try {
    const db = getAdminDb();
    const ordersSnap = await db.collection("User").doc(userId).collection("Orders").where("status", "in", ["paid", "active", "completed"]).get();
    const auditsSnap = await db.collection("User").doc(userId).collection("Legal_Audits").get();
    
    const signedProductIds = new Set(auditsSnap.docs.map(d => d.data().productId));
    const pendingProducts: { productId: string, orderId: string, title: string }[] = [];
    
    for (const doc of ordersSnap.docs) {
      const order = doc.data() as any;
      const pId = order.productId;
      if (pId && !signedProductIds.has(pId)) {
         // Check if product exists and if it requires SLA (we can just assume yes for now if it's an order)
         const pDoc = await db.collection("Products").doc(pId).get();
         if (pDoc.exists) {
            const pData = pDoc.data() as any;
            if (pData.price !== 0) { // Or any logic to determine SLA
               pendingProducts.push({
                 productId: pId,
                 orderId: doc.id,
                 title: pData.title || pId
               });
            }
         }
      }
    }
    
    return { success: true, pendingProducts };
  } catch (error: any) {
    console.error("❌ [Pending Contracts] Erro:", error);
    return { success: false, pendingProducts: [] };
  }
}

export async function getUserLegalAudits(userId: string) {
  try {
    const db = getAdminDb();
    const auditsSnap = await db.collection("User").doc(userId).collection("Legal_Audits").orderBy("timestamp", "desc").get();
    const audits = auditsSnap.docs.map(d => d.data());
    return { success: true, audits };
  } catch (e: any) {
    return { success: false, audits: [] };
  }
}

export async function generateContractPdf(userId: string, productId: string, orderId?: string) {
  try {
    const db = getAdminDb();
    
    // Fetch Product
    const productDoc = await db.collection("Products").doc(productId).get();
    if (!productDoc.exists) throw new Error("Produto não encontrado.");
    const product = productDoc.data() as any;
    
    // Fetch User
    const userDoc = await db.collection("User").doc(userId).get();
    if (!userDoc.exists) throw new Error("Usuário não encontrado.");
    const user = userDoc.data() as any;
    const matricula = user.User_Nickname || userId;
    
    // Fetch Dados Cadastrais
    const dadosCadastraisDoc = await db.collection("User").doc(userId).collection("forms").doc("dados-cadastrais").get();
    const dados = dadosCadastraisDoc.exists ? dadosCadastraisDoc.data() : { fullName: user.User_Name || "", cpf: "", address: "" };
    
    // Fetch Order (if provided)
    let orderAmount = "Valor registrado na contratação";
    let orderMethod = "Gateway Digital";
    if (orderId) {
      const orderDoc = await db.collection("User").doc(userId).collection("Orders").doc(orderId).get();
      if (orderDoc.exists) {
         const order = orderDoc.data() as any;
         if (order.totalAmount !== undefined) {
            orderAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.totalAmount);
         }
         if (order.paymentMethod) {
            orderMethod = order.paymentMethod;
         }
      }
    }
    
    // Build PDF Buffer
    const buffer = await createContractBuffer({
      product,
      dados,
      matricula,
      orderAmount,
      orderMethod
    });
    
    // Generate Hash
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    
    // Upload to Drive
    const drive = await getDriveClient();
    const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;
    
    // Caminho Hierárquico: Categoria (B2B/B2C) -> Matrícula -> 2.Documentos
    const isPJ = matricula.includes("-PJ-");
    const categoryFolderId = await ensureFolder(drive, baseFolderId, isPJ ? "2.3.B2B" : "2.2.B2C");
    const userFolderId = await ensureFolder(drive, categoryFolderId, matricula);
    const docsFolderId = await ensureFolder(drive, userFolderId, "2.Documentos");
    
    const dateStr = new Date().toISOString().split("T")[0];
    const cleanProductName = (product.title || "Contrato").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `CONTRATO_${dateStr}_${cleanProductName}.pdf`;
    
    const result = await uploadFileToDrive(
      drive,
      docsFolderId,
      fileName,
      "application/pdf",
      buffer
    );
    
    // Save Audit Log
    const auditId = db.collection("User").doc(userId).collection("Legal_Audits").doc().id;
    const now = new Date();
    
    await db.collection("User").doc(userId).collection("Legal_Audits").doc(auditId).set({
      auditId,
      userId,
      productId,
      orderId: orderId || null,
      timestamp: now.toISOString(),
      ipAddress: "Registrado pelo Gateway", 
      documentUrl: result.webViewLink,
      documentHash: hash
    });
    
    return { success: true, url: result.webViewLink, hash };
    
  } catch (error: any) {
    console.error("❌ [Contract Generator] Erro:", error);
    return { success: false, error: error.message };
  }
}

function createContractBuffer(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const { product, dados, matricula, orderAmount, orderMethod } = data;
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const primaryColor = "#ff2c8d";
      const textColor = "#333333";
      
      const logoPath = path.join(process.cwd(), "public", "logo_bplen", "logo.png");
      
      if (require("fs").existsSync(logoPath)) {
        doc.image(logoPath, { width: 150 });
        doc.moveDown(1);
      } else {
        doc.fontSize(24).font("Helvetica-Bold").fillColor(primaryColor).text("BPlen", { align: "left", continued: true }).fillColor("#333333").text(" HUB");
        doc.moveDown(1);
      }

      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111111").text("TERMO E FORMALIZAÇÃO DE PRESTAÇÃO DE SERVIÇO", { align: "center" });
      doc.moveDown(1.5);

      const dateStr = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date());

      // Clause 1
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 1 - Das Partes e do Objeto");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        `O presente documento formaliza a contratação do serviço denominado ${product.title || "Pacote BPlen"}, doravante referido como 'Serviço', adquirido através da plataforma BPlen HUB na data de ${dateStr}.\n\n` +
        `CONTRATADA: BPlen Desenvolvimento Humano LTDA, inscrita no CNPJ 40.540.093/0001-44, com sede em Porto Alegre/RS.\n` +
        `CONTRATANTE: ${dados.fullName || "Cliente não identificado"}, portador(a) do CPF ${dados.cpf || "não informado"}, residente em ${dados.address || "endereço cadastrado na plataforma"}, identificado(a) na plataforma pelo código ${matricula}.`
      );
      doc.moveDown(1);

      // Clause 2
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 2 - Do Escopo e Entregáveis (Ficha Técnica Integrada)");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        `O Serviço compreende as seguintes etapas, objetivos e entregáveis metodológicos:\n\n` +
        `${product.sheet?.description || "Descrição padrão do serviço."}\n\nEtapas da Jornada:\n` +
        (product.workflow?.map((w: any) => `- ${w.title}`).join("\n") || "- Etapas detalhadas na plataforma.")
      );
      doc.moveDown(1);

      // Clause 3
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 3 - Das Regras Operacionais e Eventos");
      doc.moveDown(0.5);
      
      let sessionsText = "- Acesso contínuo à plataforma HUB\n";
      if (product.quotas) {
         sessionsText += Object.entries(product.quotas).map(([k, v]: any) => `- ${v.total}x ${k.replace(/-/g, " ")}`).join("\n");
      }

      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        `A prestação do Serviço obedecerá aos seguintes limites e tipos de sessão/eventos (conforme cadastro do produto):\n` +
        sessionsText +
        `\n\n${product.sheet?.rules || "Regras de reagendamento regidas pelos Termos de Uso gerais da plataforma."}`
      );
      doc.moveDown(1);

      // Clause 4
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 4 - Do Valor e Condições de Pagamento");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        `Pela prestação dos Serviços ora pactuados, o CONTRATANTE compromete-se a pagar à CONTRATADA o valor líquido total de ${orderAmount}, cuja quitação e aprovação ocorreu na modalidade [${orderMethod}] no momento do checkout pela plataforma. A emissão da respectiva Nota Fiscal obedecerá às normas tributárias vigentes.`
      );
      doc.moveDown(1);

      // Clause 5
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 5 - Da Política de Cancelamento e Reembolso");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        "Em estrita observância ao Código de Defesa do Consumidor (Lei nº 8.078/1990), o CONTRATANTE detém o direito de arrependimento, podendo solicitar o cancelamento do serviço com restituição integral dos valores pagos no prazo improrrogável de 7 (sete) dias corridos a contar da data de contratação. Ultrapassado este período, a solicitação de cancelamento imotivado por parte do CONTRATANTE ensejará a restituição de 50% (cinquenta por cento) do valor proporcional referente estritamente às sessões, etapas ou horas não consumidas do pacote. Os 50% restantes serão retidos pela CONTRATADA a título de multa rescisória e cobertura de custos operacionais e de agenda já provisionados."
      );
      doc.moveDown(1);

      // Clause 6
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 6 - Da Metodologia Aplicada");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        `A metodologia e as ferramentas aplicadas pela BPlen fundamentam-se em referenciais bibliográficos consolidados nas áreas de psicologia, gestão e comportamento organizacional, cujas diretrizes teóricas podem ser livremente consultadas no endereço eletrônico ${product.sheet?.methodologyLink || "disponibilizado na plataforma institucional"}. Ao formalizar este contrato, o CONTRATANTE declara ter plena consciência da natureza científica e estrutural dos métodos, submetendo-se voluntariamente às suas dinâmicas propostas.`
      );
      doc.moveDown(1);

      // Clause 7
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 7 - Da Natureza do Serviço e Delimitação de Responsabilidades (Obrigação de Meio)");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        "O Serviço prestado pela CONTRATADA caracteriza-se juridicamente como uma obrigação de meio, fornecendo conhecimentos, estratégias, métodos, espaços estruturados para prática e facilitação na formulação de planos de ação. O atingimento de resultados específicos (como recolocação, promoções ou metas) dependerá exclusivamente do engajamento, aplicação e execução prática por parte do CONTRATANTE. Adicionalmente, reitera-se que os serviços possuem cunho estritamente voltado ao desenvolvimento de carreira e profissional, não caracterizando, nem substituindo, em qualquer hipótese, diagnósticos, tratamentos clínicos ou o devido acompanhamento com especialistas médicos e de saúde mental."
      );
      doc.moveDown(1);

      // Clause 8
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 8 - Da Evolução do Sistema (Trava de Versão V01.01)");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        "O CONTRATANTE reconhece de forma expressa que o ecossistema BPlen HUB encontra-se em sua versão V01.01. Todas as funcionalidades, painéis digitais, integrações e fluxos sistêmicos atualmente disponibilizados são fornecidos no estado técnico em que se encontram (as-is). Modificações, adições de novos recursos, interrupções sistêmicas temporárias para manutenção ou descontinuidade de funcionalidades de software em versões futuras da plataforma não caracterizam falha na prestação do Serviço, não constituem quebra do escopo base ora contratado e não geram obrigação de reembolso."
      );
      doc.moveDown(1);

      // Clause 9
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text("Cláusula 9 - Do Aceite Conjunto e Finalização");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(textColor).text(
        `Ao formalizar este termo via plataforma digital (Clickwrap), mediante registro e carimbo de tempo (Timestamp) atual, o CONTRATANTE reafirma seu consentimento integral com os Termos de Uso da Plataforma e a Política de Privacidade da BPlen. O presente aceite possui validade jurídica conforme a legislação brasileira em vigor (MP 2.200-2/2001).`
      );
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).font("Helvetica-Oblique").fillColor("#666666").text("Documento gerado eletronicamente pelo Sistema BPlen HUB.\nAceite logado e rastreado nos servidores de segurança Firebase.", { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
