const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const fa = require("react-icons/fa");

const ICONS = {
  pessoas: "FaUser",
  empresas: "FaBuilding",
  parceiros: "FaHandshake",
  missao: "FaBullseye",
  move: "FaBolt",
  evidencia: "FaChartBar",
  transparencia: "FaCommentDots",
  educacao: "FaGraduationCap",
  cocriacao: "FaPuzzlePiece",
  acordos: "FaFileSignature",
  tecnico_humano: "FaBrain",
  dev_real: "FaSeedling",
  foco_real: "FaCrosshairs",
  adaptacao: "FaSyncAlt",
  cenario: "FaExclamationTriangle",
  trajetoria: "FaRoute",
  resultados: "FaTrophy",
  email: "FaEnvelope",
  whatsapp: "FaWhatsapp",
  linkedin: "FaLinkedin",
  instagram: "FaInstagram",
  site: "FaGlobe",
  seta: "FaArrowRight",
};

async function gerar(nome, componente, cor) {
  const Icon = fa[componente];
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color: cor, size: 256 })
  );
  const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${svg.replace(/<svg[^>]*>|<\/svg>/g, "")}</svg>`;
  await sharp(Buffer.from(svgFull)).png().toFile(`assets/icon-${nome}.png`);
}

(async () => {
  for (const [nome, componente] of Object.entries(ICONS)) {
    await gerar(nome, componente, "#FFFFFF");
  }
  console.log("icones gerados:", Object.keys(ICONS).length);
})();
