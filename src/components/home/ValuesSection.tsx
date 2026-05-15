import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Handshake, BarChart3, MessageCircle, BookOpen, Users } from "lucide-react";
import { LANDING_TOKENS } from "@/constants/landing-tokens";

const values = [
  {
    icon: Handshake,
    title: "Acordos",
    description: "Cada objetivo precisa fazer sentido para todos. Combinar antes, ajustar depois.",
    accent: "#ff0080",
  },
  {
    icon: BarChart3,
    title: "Evidência como base",
    description: "Priorizar dados e comportamentos reais. Decidir com método, não apenas opinião.",
    accent: "#c026d3",
  },
  {
    icon: MessageCircle,
    title: "Transparência",
    description: "Feedback honesto e comunicação direta. Falar o que precisa ser dito com respeito.",
    accent: "#9333ea",
  },
  {
    icon: BookOpen,
    title: "Educação",
    description: "Desenvolvimento contínuo para autonomia e inovação. Aprender sempre, transmitir aprendizado.",
    accent: "#7928ca",
  },
  {
    icon: Users,
    title: "Co-criação",
    description: "Planos feitos com e não para o cliente. Construir junto, nunca sozinho.",
    accent: "#ff0080",
  },
];

/**
 * ValuesSection — Seção 4: Nossos Valores (Pilares de Atuação)
 * 5 cartões de vidro com ícones, animação Scroll Reveal e degradê rosa/roxo.
 */
export function ValuesSection() {
  return (
    <section className={LANDING_TOKENS.section}>

      {/* 🔮 Glow Ambient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#7928ca] rounded-full blur-[200px] opacity-[0.04] pointer-events-none -z-10" />

      <div className={LANDING_TOKENS.container}>

        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          duration={1.2}
          className={LANDING_TOKENS.header.centered}
        >
          <span className={LANDING_TOKENS.header.kicker}>
            Nossos Valores
          </span>
          <h2 className={`${LANDING_TOKENS.header.title} max-w-3xl mx-auto`}>
            Desenvolvimento através de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0080] to-[#7928ca] bg-[size:200%_auto] animate-gradient-flow">
              atitudes coerentes
            </span>
          </h2>
        </ScrollReveal>

        {/* Cards Grid — 2 colunas, última linha full-width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-full sm:max-w-[70%] mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <ScrollReveal
                key={value.title}
                animation="fade-up"
                duration={1.0}
                delay={index * 0.12}
                className={`${LANDING_TOKENS.card.container} ${index === 4 ? "sm:col-span-2" : ""}`}
              >
                <div className="flex items-start gap-6">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0"
                    style={{ backgroundColor: `${value.accent}15` }}
                  >
                    <Icon size={22} style={{ color: value.accent }} />
                  </div>

                  <div>
                    {/* Title */}
                    <h3 className={LANDING_TOKENS.card.title + " group-hover:text-white transition-colors duration-300"}>
                      {value.title}
                    </h3>

                    {/* Description */}
                    <p className={LANDING_TOKENS.card.description + " group-hover:text-gray-300 transition-colors duration-300"}>
                      {value.description}
                    </p>
                  </div>
                </div>

                {/* Accent line on hover */}
                <div
                  className="absolute bottom-0 left-8 right-8 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${value.accent}, transparent)`,
                  }}
                />
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}

