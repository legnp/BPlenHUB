const pptxgen = require("pptxgenjs");

// ============================================================
// BPlen — Apresentação Institucional
// Identidade: a mesma do site público (bg-black.tsx / HeroHeadline.tsx)
// preto + gradiente magenta->roxo. Nao usa a paleta petroleo/ametista
// do kit de documentos nem o rosa do HUB logado — aquelas sao para
// outros contextos (documento impresso, produto logado).
// ============================================================

const C = {
  bg: "0A0A0A",
  card: "161616",
  card2: "1E1E1E",
  white: "FFFFFF",
  text: "D8D8DC",
  muted: "8A8A90",
  faint: "5A5A60",
  magenta: "FF0080",
  purple: "7928CA",
  mid: "C026D3",
};

const FONT = "Arial";
const A = "assets/";

function novaApresentacao() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5 in
  p.author = "BPlen";
  p.company = "BPlen";
  p.title = "Apresentação Institucional BPlen";
  return p;
}

const W = 13.333, H = 7.5;

// ---------- helpers ----------

function bg(slide, cor) {
  slide.background = { color: cor };
}

function bgGlow(slide) {
  slide.addImage({ path: A + "glow-bg.png", x: 0, y: 0, w: W, h: H });
}

function logo(slide, opts = {}) {
  const { x = 0.55, y = 0.4, w = 1.35 } = opts;
  slide.addImage({ path: A + "logo-branco.png", x, y, w, h: w * (1908 / 4575) });
}

function marcaCanto(slide) {
  slide.addImage({ path: A + "favicon.png", x: W - 0.62, y: H - 0.62, w: 0.34, h: 0.34, transparency: 15 });
}

function rodapeFolio(slide, n, secao) {
  slide.addText(secao.toUpperCase(), {
    x: 0.55, y: H - 0.55, w: 6, h: 0.3, fontFace: FONT, fontSize: 8, bold: true,
    color: C.faint, charSpacing: 2, align: "left", margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: W - 1.3, y: H - 0.55, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 8, bold: true,
    color: C.faint, align: "right", margin: 0,
  });
}

function eyebrow(slide, texto, opts = {}) {
  const { x = 0.55, y = 0.55, w = 8, cor = C.magenta } = opts;
  slide.addText(texto.toUpperCase(), {
    x, y, w, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, color: cor,
    charSpacing: 3, align: "left", margin: 0,
  });
}

function titulo(slide, texto, opts = {}) {
  const { x = 0.55, y = 0.95, w = 11.5, size = 34, cor = C.white } = opts;
  slide.addText(texto, {
    x, y, w, h: 1.1, fontFace: FONT, fontSize: size, bold: true, color: cor,
    charSpacing: -0.5, align: "left", margin: 0, lineSpacingMultiple: 1.02,
  });
}

// icone dentro de um circulo — motivo repetido da apresentacao
function iconeCirculo(slide, icone, opts = {}) {
  const { x, y, d = 0.62, corFundo = C.card2, corBorda = C.magenta, padIcone = 0.16 } = opts;
  slide.addShape("ellipse", {
    x, y, w: d, h: d, fill: { color: corFundo }, line: { color: corBorda, width: 1.25 },
  });
  const iw = d - padIcone * 2;
  slide.addImage({ path: A + `icon-${icone}.png`, x: x + padIcone, y: y + padIcone, w: iw, h: iw });
}

function cartao(slide, opts = {}) {
  const { x, y, w, h, cor = C.card, radius = 0.12 } = opts;
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: radius, fill: { color: cor }, line: { type: "none" },
  });
}

function corpo(slide, texto, opts = {}) {
  const { x, y, w, h, size = 14, cor = C.text, align = "left", bold = false } = opts;
  slide.addText(texto, {
    x, y, w, h, fontFace: FONT, fontSize: size, color: cor, align, bold, margin: 0,
    lineSpacingMultiple: 1.28, valign: "top",
  });
}

// slide de transicao / abertura de secao — full bleed escuro com glow
function slideTransicao(p, { eyebrowTxt, tituloTxt, corpoTxt, n }) {
  const s = p.addSlide();
  bg(s, C.bg);
  bgGlow(s);
  logo(s, { w: 1.2 });
  eyebrow(s, eyebrowTxt, { x: 1.0, y: 2.55, w: 10 });
  s.addText(tituloTxt, {
    x: 1.0, y: 3.0, w: 10.8, h: 2.1, fontFace: FONT, fontSize: 40, bold: true,
    color: C.white, charSpacing: -0.5, align: "left", margin: 0, lineSpacingMultiple: 1.04,
  });
  if (corpoTxt) {
    corpo(s, corpoTxt, { x: 1.0, y: 5.3, w: 8.2, h: 1.3, size: 15, cor: C.text });
  }
  rodapeFolio(s, n, eyebrowTxt);
  return s;
}

// ============================================================
// MONTAGEM
// ============================================================
const p = novaApresentacao();
let n = 0;
const N = () => ++n;

// ---------- 01. CAPA ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  bgGlow(s);
  logo(s, { x: 0.9, y: 0.75, w: 1.9 });
  s.addText("CONSULTORIA DE DESENVOLVIMENTO HUMANO", {
    x: 0.9, y: 3.35, w: 10, h: 0.4, fontFace: FONT, fontSize: 13, bold: true,
    color: C.magenta, charSpacing: 3, margin: 0,
  });
  s.addText("Descomplicando o desenvolvimento\nhumano no trabalho", {
    x: 0.9, y: 3.8, w: 11, h: 2.1, fontFace: FONT, fontSize: 42, bold: true,
    color: C.white, charSpacing: -0.5, lineSpacingMultiple: 1.05, margin: 0,
  });
  s.addText("Apresentação Institucional", {
    x: 0.9, y: 6.15, w: 8, h: 0.4, fontFace: FONT, fontSize: 15, italic: true,
    color: C.muted, margin: 0,
  });
  s.addText("bplen.com", {
    x: 0.9, y: H - 0.62, w: 4, h: 0.35, fontFace: FONT, fontSize: 10, bold: true,
    color: C.faint, charSpacing: 2, margin: 0,
  });
}
N();

// ---------- 02. QUEM SOMOS ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Quem Somos");
  titulo(s, "Somos o seu HRBP que ajuda a descomplicar o desenvolvimento humano no trabalho.", { size: 30, w: 11.6 });
  cartao(s, { x: 0.55, y: 3.15, w: 7.55, h: 3.3, cor: C.card });
  corpo(s, "Somos uma consultoria de negócios com foco em Desenvolvimento Humano, nascida da experiência holística de sua fundadora em grandes multinacionais e no empreendedorismo.", {
    x: 1.0, y: 3.5, w: 6.7, h: 2.6, size: 17, cor: C.white,
  });
  // coluna lateral: selo "para quem" resumido
  cartao(s, { x: 8.35, y: 3.15, w: 4.45, h: 3.3, cor: C.card2 });
  corpo(s, "Não fazemos consultoria genérica. Atuamos onde o técnico encontra o humano — com método, dados e proximidade real.", {
    x: 8.7, y: 3.5, w: 3.8, h: 2.6, size: 13.5, cor: C.text,
  });
  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Quem Somos");
}

// ---------- 03. MISSAO + O QUE NOS MOVE ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Propósito");
  titulo(s, "O que nos guia", { size: 32 });

  const colW = 5.75;
  // card missao
  cartao(s, { x: 0.55, y: 2.15, w: colW, h: 4.3, cor: C.card });
  iconeCirculo(s, "missao", { x: 0.95, y: 2.55, corBorda: C.magenta });
  s.addText("Nossa Missão", { x: 0.95, y: 3.35, w: 5, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.white, margin: 0 });
  corpo(s, "Ajudar pessoas e negócios a alinhar objetivos através do desenvolvimento humano prático, aplicado à realidade com clareza, método e execução, para gerar resultados sustentáveis.", {
    x: 0.95, y: 3.85, w: colW - 0.8, h: 2.4, size: 14.5, cor: C.text,
  });

  // card o que nos move
  cartao(s, { x: 6.95, y: 2.15, w: colW, h: 4.3, cor: C.card });
  iconeCirculo(s, "move", { x: 7.35, y: 2.55, corBorda: C.purple });
  s.addText("O Que Nos Move", { x: 7.35, y: 3.35, w: 5, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.white, margin: 0 });
  corpo(s, "Integramos dados, métodos e desenvolvimento humano para transformar contextos em oportunidades e potencializar a performance sustentável.", {
    x: 7.35, y: 3.85, w: colW - 0.8, h: 2.4, size: 14.5, cor: C.text,
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Propósito");
}

// ---------- 04. PARA QUEM ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Para Quem");
  titulo(s, "Três frentes, um mesmo método", { size: 32 });

  const itens = [
    { icone: "pessoas", tag: "Pessoas", txt: "Gestão de Carreira Completa", cor: C.magenta },
    { icone: "empresas", tag: "Empresas", txt: "HRBP como um serviço", cor: C.mid },
    { icone: "parceiros", tag: "Parceiros", txt: "Projetos e ativações de negócio em conjunto", cor: C.purple },
  ];
  const colW = 3.95, gap = 0.35, startX = 0.55;
  itens.forEach((it, i) => {
    const x = startX + i * (colW + gap);
    cartao(s, { x, y: 2.35, w: colW, h: 3.9, cor: C.card });
    iconeCirculo(s, it.icone, { x: x + 0.4, y: 2.75, corBorda: it.cor });
    s.addText(it.tag, { x: x + 0.4, y: 3.55, w: colW - 0.8, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.white, margin: 0 });
    corpo(s, it.txt, { x: x + 0.4, y: 4.05, w: colW - 0.8, h: 1.9, size: 14, cor: C.text });
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Para Quem");
}

// ---------- 05. TRANSICAO — CENARIO ATUAL ----------
slideTransicao(p, {
  eyebrowTxt: "O Cenário Atual",
  tituloTxt: "O futuro do trabalho é complexo porque a maioria das dores não é técnica — é humana.",
  corpoTxt: "O desafio é cuidar do invisível: expectativas, confiança e coerência.",
  n: N(),
});

// ---------- 06. ESTATISTICAS DO CENARIO ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "O Cenário Atual — Em Números");
  titulo(s, "Quatro sintomas de um mesmo problema", { size: 28, w: 11.6 });

  const stats = [
    { num: "62%", txt: "Falta de mão de obra qualificada compromete o crescimento", fonte: "CNN Brasil" },
    { num: "68%", txt: "Aumento de licenças no INSS por saúde mental em 10 anos", fonte: "G1" },
    { num: "50%", txt: "Acreditam no autodesenvolvimento — menos de 1% conta com o RH", fonte: "DHO360" },
    { num: "30%", txt: "Dos negócios reconhecem: as barreiras são pessoas e comunicação", fonte: "DHO360" },
  ];
  const colW = 5.75, rowH = 1.95, gapX = 0.35, gapY = 0.3, startX = 0.55, startY = 2.15;
  stats.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX);
    const y = startY + row * (rowH + gapY);
    cartao(s, { x, y, w: colW, h: rowH, cor: C.card });
    s.addText(st.num, {
      x: x + 0.4, y: y + 0.18, w: 2.2, h: 1.0, fontFace: FONT, fontSize: 44, bold: true,
      color: C.magenta, margin: 0,
    });
    corpo(s, st.txt, { x: x + 2.5, y: y + 0.25, w: colW - 2.9, h: 1.15, size: 12.5, cor: C.text });
    s.addText(st.fonte.toUpperCase(), {
      x: x + 2.5, y: y + rowH - 0.42, w: colW - 2.9, h: 0.3, fontFace: FONT, fontSize: 9, bold: true,
      color: C.faint, charSpacing: 1.5, margin: 0,
    });
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Cenário Atual");
}

// ---------- 07. TRANSICAO — COMO AJUDAMOS ----------
slideTransicao(p, {
  eyebrowTxt: "Como Ajudamos",
  tituloTxt: "Atuamos em três frentes que vão do técnico ao humano, dos dados às pessoas.",
  corpoTxt: "Com foco no desenvolvimento real — não em fórmulas prontas.",
  n: N(),
});

// ---------- 08-10. OS TRES PILARES ----------
{
  const pilares = [
    {
      tag: "Para Pessoas", icone: "pessoas", cor: C.magenta,
      nome: "Desenvolvimento de Carreira",
      txt: "Consultoria e gestão de carreira com métodos práticos, através de trilhas de desenvolvimento e posicionamento para profissionais que querem elevar sua performance e relevância.",
    },
    {
      tag: "Para Empresas", icone: "empresas", cor: C.mid,
      nome: "Estratégia, Analytics e Cultura",
      txt: "Consultoria e serviços de HRBP nos pilares de Employee Experience, People Analytics e Clima e Cultura para impulsionar a performance organizacional.",
    },
    {
      tag: "Para Parceiros", icone: "parceiros", cor: C.purple,
      nome: "Parcerias de Negócio",
      txt: "Parcerias estratégicas através de projetos e ativações em conjunto para ampliar escala e impulsionar o empreendedorismo.",
    },
  ];
  pilares.forEach((pl, i) => {
    const s = p.addSlide();
    bg(s, C.bg);
    eyebrow(s, `Como Ajudamos — Pilar ${i + 1} de 3`);
    // numeral grande de fundo, decorativo, baixo contraste
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 8.7, y: 1.3, w: 4.2, h: 4.2, fontFace: FONT, fontSize: 220, bold: true,
      color: C.card2, align: "right", margin: 0,
    });
    iconeCirculo(s, pl.icone, { x: 0.55, y: 2.35, d: 0.9, corBorda: pl.cor, padIcone: 0.24 });
    s.addText(pl.tag.toUpperCase(), {
      x: 0.55, y: 3.4, w: 8, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, color: pl.cor,
      charSpacing: 2.5, margin: 0,
    });
    s.addText(pl.nome, {
      x: 0.55, y: 3.75, w: 8, h: 1.1, fontFace: FONT, fontSize: 32, bold: true, color: C.white,
      charSpacing: -0.5, margin: 0, lineSpacingMultiple: 1.05,
    });
    corpo(s, pl.txt, { x: 0.55, y: 4.95, w: 7.6, h: 1.7, size: 15.5, cor: C.text });
    logo(s, { w: 1.0 });
    rodapeFolio(s, N(), "Como Ajudamos");
  });
}

// ---------- 11. TRANSICAO — POSICIONAMENTO ----------
slideTransicao(p, {
  eyebrowTxt: "Nosso Posicionamento",
  tituloTxt: "Quatro pilares que transformam a consultoria tradicional em parceria estratégica.",
  n: N(),
});

// ---------- 12-15. AS QUATRO FORCAS ----------
{
  const forcas = [
    { icone: "tecnico_humano", nome: "Do técnico ao humano", tagline: "A harmonia entre números e empatia.", txt: "Cruzamento inteligente de dados robustos com sensibilidade humana para decisões que fazem sentido para o negócio e para a vida." },
    { icone: "dev_real", nome: "Desenvolvimento real", tagline: "Em cada interação, uma evolução.", txt: "Não acreditamos em treinamentos isolados. O desenvolvimento acontece no dia a dia, em cada reunião, feedback e decisão estratégica." },
    { icone: "foco_real", nome: "Foco em demanda real", tagline: "Sem abstrações ou fórmulas prontas.", txt: "Atuamos diretamente na dor que o cenário apresenta. Soluções práticas, aplicáveis agora, focadas em resolver demandas complexas." },
    { icone: "adaptacao", nome: "Adaptação contínua", tagline: "Resiliência perante o cenário mutável.", txt: "O mercado muda rápido. Nossa metodologia se adapta continuamente ao contexto para garantir que a estratégia de pessoas nunca fique obsoleta." },
  ];
  const cores = [C.magenta, C.mid, C.purple, C.magenta];
  // duas por slide, 2 slides
  for (let pagina = 0; pagina < 2; pagina++) {
    const s = p.addSlide();
    bg(s, C.bg);
    eyebrow(s, `A Força do Nosso Posicionamento — ${pagina + 1} de 2`);
    titulo(s, pagina === 0 ? "Forças 1 e 2" : "Forças 3 e 4", { size: 26 });
    for (let col = 0; col < 2; col++) {
      const f = forcas[pagina * 2 + col];
      const x = 0.55 + col * 6.15;
      cartao(s, { x, y: 2.15, w: 5.85, h: 4.4, cor: C.card });
      iconeCirculo(s, f.icone, { x: x + 0.4, y: 2.55, corBorda: cores[pagina * 2 + col] });
      s.addText(f.nome, { x: x + 0.4, y: 3.35, w: 5.1, h: 0.7, fontFace: FONT, fontSize: 19, bold: true, color: C.white, margin: 0, lineSpacingMultiple: 1.05 });
      s.addText(f.tagline, { x: x + 0.4, y: 4.0, w: 5.1, h: 0.4, fontFace: FONT, fontSize: 12.5, italic: true, color: cores[pagina * 2 + col], margin: 0 });
      corpo(s, f.txt, { x: x + 0.4, y: 4.5, w: 5.1, h: 1.9, size: 12.5, cor: C.text });
    }
    logo(s, { w: 1.0 });
    rodapeFolio(s, N(), "Posicionamento");
  }
}

// ---------- 16. NOSSOS VALORES ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Nossos Valores");
  titulo(s, "Desenvolvimento através de atitudes coerentes", { size: 27, w: 11.8 });

  const valores = [
    { icone: "acordos", nome: "Acordos", txt: "Cada objetivo precisa fazer sentido para todos. Combinar antes, ajustar depois." },
    { icone: "evidencia", nome: "Evidência como base", txt: "Priorizar dados e comportamentos reais. Decidir com método, não apenas opinião." },
    { icone: "transparencia", nome: "Transparência", txt: "Feedback honesto e comunicação direta. Falar o que precisa ser dito com respeito." },
    { icone: "educacao", nome: "Educação", txt: "Desenvolvimento contínuo para autonomia e inovação. Aprender sempre, transmitir aprendizado." },
    { icone: "cocriacao", nome: "Co-criação", txt: "Planos feitos com e não para o cliente. Construir junto, nunca sozinho." },
  ];
  const colW = 2.34, gap = 0.14, startX = 0.55, startY = 2.35;
  valores.forEach((v, i) => {
    const x = startX + i * (colW + gap);
    iconeCirculo(s, v.icone, { x: x + (colW - 0.62) / 2, y: startY, d: 0.62, corBorda: C.magenta });
    s.addText(v.nome, {
      x, y: startY + 0.82, w: colW, h: 0.65, fontFace: FONT, fontSize: 13.5, bold: true,
      color: C.white, align: "center", margin: 0, lineSpacingMultiple: 1.05,
    });
    corpo(s, v.txt, { x, y: startY + 1.5, w: colW, h: 2.3, size: 10.5, cor: C.text, align: "center" });
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Valores");
}

// ---------- 17. FUNDADORA ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Quem Conduz");
  titulo(s, "Lisandra Lencina", { size: 34 });
  s.addText("Fundadora da BPlen", {
    x: 0.55, y: 1.75, w: 8, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: C.magenta,
    charSpacing: 1, margin: 0,
  });
  corpo(s, "Vive o empreendedorismo desde a juventude e há 10 anos ajuda pessoas e negócios a alinharem seus interesses e resultados.", {
    x: 0.55, y: 2.35, w: 7.4, h: 1.1, size: 15, cor: C.text,
  });

  cartao(s, { x: 0.55, y: 3.65, w: 7.4, h: 2.9, cor: C.card });
  s.addText("FORMAÇÃO", { x: 0.9, y: 3.9, w: 6.7, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: C.faint, charSpacing: 2, margin: 0 });
  corpo(s, "Administração de Empresas · MBA em Gestão de Negócios · Especialização em RH e Coaching", {
    x: 0.9, y: 4.25, w: 6.7, h: 0.7, size: 13.5, cor: C.white,
  });
  s.addText("PRINCIPAIS RESULTADOS (2019—2024)", { x: 0.9, y: 5.05, w: 6.7, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: C.faint, charSpacing: 2, margin: 0 });
  corpo(s, "Contribuição para o selo GPTW com eNPS acima de 80% · estruturação de frentes estratégicas de RH · +50% de ganho em agilidade de processos · NPS acima de 4.8", {
    x: 0.9, y: 5.4, w: 6.7, h: 1.05, size: 12.5, cor: C.text,
  });

  // coluna lateral direita: selo timeline resumido em texto vertical
  cartao(s, { x: 8.35, y: 1.75, w: 4.45, h: 4.8, cor: C.card2 });
  s.addText("Acer · Samsung · Smart Beauty · Governo-SP · Itaú", {
    x: 8.7, y: 2.1, w: 3.75, h: 1.0, fontFace: FONT, fontSize: 13, bold: true, italic: true, color: C.white, margin: 0, lineSpacingMultiple: 1.3,
  });
  corpo(s, "Passagem por multinacionais e grandes marcas, em projetos educacionais, inteligência de mercado e Desenvolvimento Humano Organizacional (DHO), antes de fundar a BPlen.", {
    x: 8.7, y: 3.2, w: 3.75, h: 3.1, size: 12.5, cor: C.text,
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Quem Conduz");
}

// ---------- 18. TRAJETORIA ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Trajetória");
  titulo(s, "De onde viemos até aqui", { size: 30 });

  const marcos = [
    { ano: "2008", txt: "Empreendedorismo\n(familiar)" },
    { ano: "2013", txt: "Projetos educacionais\n(Gov-SP, Hertft, Itaú)" },
    { ano: "2016", txt: "Inteligência de mercado\n(IDC, H. Strattner)" },
    { ano: "2019", txt: "RH e DHO\n(Acer, Samsung, Smart Beauty)" },
    { ano: "2025+", txt: "BPlen\nConsultoria" },
  ];
  const y = 3.6, colW = 2.35, gap = 0.14, startX = 0.55;
  // linha conectora
  s.addShape("line", {
    x: startX + 0.2, y: y + 0.18, w: W - 1.1 - 0.4, h: 0,
    line: { color: C.card2, width: 2 },
  });
  marcos.forEach((m, i) => {
    const x = startX + i * (colW + gap);
    const corPonto = i === marcos.length - 1 ? C.magenta : C.faint;
    s.addShape("ellipse", { x: x + 0.2 - 0.09, y: y + 0.09, w: 0.18, h: 0.18, fill: { color: corPonto }, line: { type: "none" } });
    s.addText(m.ano, {
      x, y: y + 0.5, w: colW, h: 0.4, fontFace: FONT, fontSize: 16, bold: true,
      color: i === marcos.length - 1 ? C.magenta : C.white, margin: 0,
    });
    corpo(s, m.txt, { x, y: y + 0.95, w: colW - 0.1, h: 1.3, size: 11.5, cor: C.text });
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Trajetória");
}

// ---------- 19. RESULTADOS ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  eyebrow(s, "Track Record");
  titulo(s, "O que essa trajetória já entregou", { size: 28, w: 11.6 });

  const stats = [
    { num: "10", suf: "anos", txt: "de experiência ajudando pessoas e negócios a alinhar interesses e resultados" },
    { num: "80%+", suf: "", txt: "de eNPS em contribuição para o selo GPTW em projetos conduzidos" },
    { num: "50%+", suf: "", txt: "de ganho em agilidade a partir de melhoria de processos de RH" },
    { num: "4.8+", suf: "", txt: "de NPS médio nos projetos e frentes estratégicas estruturadas" },
  ];
  const colW = 2.85, gap = 0.24, startX = 0.55, y = 2.5;
  stats.forEach((st, i) => {
    const x = startX + i * (colW + gap);
    cartao(s, { x, y, w: colW, h: 3.6, cor: C.card });
    s.addText(st.num, {
      x: x + 0.25, y: y + 0.35, w: colW - 0.5, h: 1.0, fontFace: FONT, fontSize: 38, bold: true,
      color: C.magenta, margin: 0,
    });
    corpo(s, st.txt, { x: x + 0.25, y: y + 1.5, w: colW - 0.5, h: 1.9, size: 12, cor: C.text });
  });

  logo(s, { w: 1.0 });
  rodapeFolio(s, N(), "Track Record");
}

// ---------- 20. CTA / CONTATO ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  bgGlow(s);
  logo(s, { w: 1.2 });
  eyebrow(s, "Próximos Passos", { y: 2.4 });
  s.addText("Vamos conversar sobre o seu contexto?", {
    x: 0.55, y: 2.8, w: 10.5, h: 1.2, fontFace: FONT, fontSize: 38, bold: true, color: C.white,
    charSpacing: -0.5, margin: 0, lineSpacingMultiple: 1.05,
  });
  corpo(s, "Uma conversa inicial, sem custo, para entender seu cenário e avaliar como o desenvolvimento humano pode se aplicar a ele.", {
    x: 0.55, y: 3.85, w: 8.5, h: 0.8, size: 15, cor: C.text,
  });

  const contatos = [
    { icone: "email", txt: "lisandra.lencina@bplen.com" },
    { icone: "whatsapp", txt: "+55 11 94515-2088" },
    { icone: "site", txt: "bplen.com" },
    { icone: "linkedin", txt: "linkedin.com/in/lisandralencina" },
  ];
  const colW = 5.6, rowH = 0.68, startX = 0.55, startY = 4.95;
  contatos.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + 0.3);
    const y = startY + row * (rowH + 0.15);
    iconeCirculo(s, c.icone, { x, y, d: 0.5, padIcone: 0.13, corBorda: C.magenta });
    s.addText(c.txt, {
      x: x + 0.65, y: y + 0.02, w: colW - 0.7, h: 0.5, fontFace: FONT, fontSize: 13.5, bold: true,
      color: C.white, valign: "middle", margin: 0,
    });
  });

  rodapeFolio(s, N(), "Próximos Passos");
}

// ---------- 21. ENCERRAMENTO ----------
{
  const s = p.addSlide();
  bg(s, C.bg);
  bgGlow(s);
  logo(s, { x: 5.2, y: 3.0, w: 2.9 });
  s.addText("Obrigada pelo seu tempo.", {
    x: 0, y: 4.55, w: W, h: 0.6, fontFace: FONT, fontSize: 20, italic: true, color: C.text,
    align: "center", margin: 0,
  });
  s.addText("bplen.com  ·  lisandra.lencina@bplen.com  ·  +55 11 94515-2088", {
    x: 0, y: H - 0.85, w: W, h: 0.4, fontFace: FONT, fontSize: 11, bold: true, color: C.faint,
    align: "center", charSpacing: 1.5, margin: 0,
  });
}

p.writeFile({ fileName: "BPlen-Apresentacao-Institucional.pptx" }).then(() => {
  console.log(`Gerado com ${n} slides.`);
});
