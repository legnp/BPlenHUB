import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { LANDING_TOKENS } from "@/constants/landing-tokens";
import { DonutRing } from "./DonutRing";

const stats = [
  {
    value: 62,
    suffix: "%",
    label: "Falta de mão de obra qualificada compromete o crescimento",
    source: "CNN Brasil",
    sourceUrl: "https://www.cnnbrasil.com.br/branded-content/nacional/o-impacto-do-custo-brasil-na-economia-nacional/",
    color: "#ff0080",
  },
  {
    value: 68,
    suffix: "%",
    label: "Aumento de licenças no INSS por saúde mental em 10 anos",
    source: "G1",
    sourceUrl: "https://g1.globo.com/trabalho-e-carreira/noticia/2025/03/10/crise-de-saude-mental-brasil-tem-maior-numero-de-afastamentos-por-ansiedade-e-depressao-em-10-anos.ghtml",
    color: "#c026d3",
  },
  {
    value: 50,
    suffix: "%",
    label: "Acreditam no autodesenvolvimento, mas <1% conta com o RH",
    source: "DHO360",
    sourceUrl: "https://lisdho.github.io/DHO360/",
    color: "#9333ea",
  },
  {
    value: 30,
    suffix: "%",
    label: "Dos negócios reconhecem: as barreiras são pessoas e comunicação",
    source: "DHO360",
    sourceUrl: "https://lisdho.github.io/DHO360/",
    color: "#7928ca",
  },
];

/**
 * ScenarioSection — Seção 5: O Cenário Atual (Desafios)
 * 4 gráficos de rosca interativos lado a lado com animação ao scroll.
 */
export function ScenarioSection() {
  return (
    <section className={LANDING_TOKENS.section}>
      {/* 🔮 Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff0080] rounded-full blur-[200px] opacity-[0.03] pointer-events-none -z-10" />

      <div className={LANDING_TOKENS.container}>
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          duration={1.2}
          className={LANDING_TOKENS.header.centered}
        >
          <span className={LANDING_TOKENS.header.kicker}>
            O Cenário Atual
          </span>
          <h2 className={`${LANDING_TOKENS.header.title} max-w-3xl mx-auto mb-6`}>
            O desafio do{" "}
            <span className="text-gray-400">cenário atual</span>
          </h2>
          <p className={LANDING_TOKENS.header.descriptionCentered}>
            O futuro do trabalho é complexo porque a maioria das dores não é técnica, é humana. O desafio é cuidar do invisível: expectativas, confiança e coerência.
          </p>
        </ScrollReveal>

        {/* Donut Charts Row */}
        <ScrollReveal
          animation="fade-up"
          duration={1.0}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.value}
              className={LANDING_TOKENS.card.container + " flex-col items-center text-center gap-5 p-6"}
            >
              {/* Donut */}
              <DonutRing
                value={stat.value}
                color={stat.color}
                suffix={stat.suffix}
                delay={index * 0.25}
              />

              {/* Label */}
              <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                {stat.label}
              </p>

              {/* Source */}
              {stat.source && (
                <a
                  href={stat.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-medium tracking-widest uppercase text-gray-600 hover:text-[#ff0080] transition-colors mt-auto"
                >
                  Fonte: {stat.source} ↗
                </a>
              )}
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}

