import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Database, Zap, Target, RefreshCw } from "lucide-react";
import { LANDING_TOKENS } from "@/constants/landing-tokens";

const forces = [
  {
    title: "Do técnico ao humano",
    subtitle: "A harmonia entre números e empatia.",
    description: "Cruzamento inteligente de dados robustos com sensibilidade humana para decisões que fazem sentido para o negócio e para a vida.",
    icon: Database,
    color: "from-[#ff0080] to-[#c026d3]",
    delay: 0.1,
  },
  {
    title: "Desenvolvimento real",
    subtitle: "Em cada interação, uma evolução.",
    description: "Não acreditamos em treinamentos isolados. O desenvolvimento acontece no dia a dia, em cada reunião, feedback e decisão estratégica.",
    icon: Zap,
    color: "from-[#c026d3] to-[#9333ea]",
    delay: 0.2,
  },
  {
    title: "Foco em demanda real",
    subtitle: "Sem abstrações ou fórmulas prontas.",
    description: "Atuamos diretamente na dor que o cenário apresenta. Soluções práticas, aplicáveis agora, focadas em resolver demandas complexas.",
    icon: Target,
    color: "from-[#9333ea] to-[#7928ca]",
    delay: 0.3,
  },
  {
    title: "Adaptação contínua",
    subtitle: "Resiliência perante o cenário mutável.",
    description: "O mercado muda rápido. Nossa metodologia se adapta continuamente ao contexto para garantir que a estratégia de pessoas nunca fique obsoleta.",
    icon: RefreshCw,
    color: "from-[#7928ca] to-[#ff0080]",
    delay: 0.4,
  }
];

/**
 * FeaturesSection — Seção 7: Diferenciais (Por que escolher a BPlen?)
 * Apresentação Ultra-Premium das "4 Forças" com bordas animadas e profundidade.
 */
export function FeaturesSection() {
  return (
    <section className={`${LANDING_TOKENS.section} overflow-hidden`}>

      {/* 🌌 Atmospheric Accents */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#9333ea] rounded-full blur-[300px] opacity-[0.02] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-[#ff0080] rounded-full blur-[300px] opacity-[0.02] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">

        {/* Header — Empilhado Verticalmente */}
        <div className={LANDING_TOKENS.header.left}>
          <ScrollReveal
            animation="slide-left"
            duration={1.2}
          >
            <span className={LANDING_TOKENS.header.kicker + " border-l border-[#ff0080] pl-4 mb-0"}>
              Diferenciais
            </span>
            <h2 className={LANDING_TOKENS.header.title}>
              A força do nosso{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                posicionamento
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal
            animation="fade-up"
            duration={1.2}
            delay={0.2}
            className={LANDING_TOKENS.header.description + " max-w-xl"}
          >
            Quatro pilares fundamentais que transformam a consultoria tradicional em uma parceria estratégica de alto nível.
          </ScrollReveal>
        </div>

        {/* Features Grid — Reduzido para 768px (max-w-3xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.05] rounded-[2rem] overflow-hidden border border-white/[0.05]">
          {forces.map((force, index) => {
            const Icon = force.icon;
            return (
              <ScrollReveal
                key={force.title}
                animation="fade-in"
                duration={1.5}
                delay={force.delay}
                className={LANDING_TOKENS.card.container + " group bg-[#030303] rounded-none border-none"}
              >
                {/* 💡 Hover Light Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 overflow-hidden">
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${force.color} blur-[120px] opacity-10`} />
                </div>

                {/* Index / Numbering */}
                <div className="flex items-center justify-between mb-10">
                  <div className={`bg-gradient-to-r ${force.color} p-4 rounded-2xl shadow-lg shadow-black`}>
                    <Icon className="text-white" size={20} />
                  </div>
                  <span className="text-[35px] font-black text-white/5 group-hover:text-white/10 transition-colors duration-700 select-none">
                    0{index + 1}
                  </span>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <h4 className={LANDING_TOKENS.card.kicker + " group-hover:text-white transition-colors duration-500"}>
                    {force.subtitle}
                  </h4>
                  <h3 className={LANDING_TOKENS.card.title + " tracking-tight"}>
                    {force.title}
                  </h3>
                  <p className={LANDING_TOKENS.card.description + " group-hover:text-gray-300 transition-colors duration-500 pt-2"}>
                    {force.description}
                  </p>
                </div>

                {/* Interactive Decoration (bottom bar) */}
                <div className="absolute bottom-0 left-0 w-full h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left">
                  <div className={`w-full h-full bg-gradient-to-r ${force.color}`} />
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}

