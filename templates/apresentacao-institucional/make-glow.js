const sharp = require("sharp");

// Replica o glow real do HeroSection.tsx do site (bg-[#ff0080] blur-[150px]
// opacity-[0.08]) como PNG, ja que pptxgenjs nao suporta gradiente em shape.
const W = 2400, H = 1350; // proporcao 16:9

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="72%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#FF0080" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#C026D3" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#0A0A0A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="18%" cy="82%" r="45%">
      <stop offset="0%" stop-color="#7928CA" stop-opacity="0.40"/>
      <stop offset="100%" stop-color="#0A0A0A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0A0A0A"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
</svg>`;

sharp(Buffer.from(svg))
  .blur(60)
  .png()
  .toFile("assets/glow-bg.png")
  .then(() => console.log("glow-bg.png gerado"))
  .catch((e) => { console.error(e); process.exit(1); });
