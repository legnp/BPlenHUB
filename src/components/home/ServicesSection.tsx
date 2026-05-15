import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { User, Building2, Handshake, ChevronRight } from "lucide-react";
import Link from "next/link";
import { LANDING_TOKENS } from "@/constants/landing-tokens";

const services = [
  {
    id: "people",
    kicker: "Para Pessoas",
    title: "Desenvolvimento de Carreira",
    description: "Consultoria e gestão de carreira com métodos práticos, através de trilhas de desenvolvimento e posicionamento para profissionais que querem elevar sua performance e relevância.",
    icon: User,
    color: "#ff0080",
    href: "/servicos/pessoas"
  },
  {
    id: "business",
    kicker: "Para Empresas",
    title: "Estratégia, Analytics e Cultura",
    description: "Consultoria e serviços de HRBP nos pilares de Employee Experience, People Analytics e Clima e Cultura para impulsionar a performance organizacional.",
    icon: Building2,
    color: "#c026d3",
    href: "/servicos/empresas"
  },
  {
    id: "partners",
    kicker: "Para Parceiros",
    title: "Parcerias de Negócio",
    description: "Parcerias estratégicas através de projetos e ativações em conjunto para ampliar escala e impulsionar o empreendedorismo.",
    icon: Handshake,
    color: "#7928ca",
    href: "/servicos/parceiros"
  }
];

/**
 * ServicesSection — Seção 6: Nossos Serviços (Como Ajudamos)
 * Exibição em tríade de alto impacto com cards de vidro expansivos.
 */
export function ServicesSection() {
  return (
    <section id="servicos" className={`${LANDING_TOKENS.section} overflow-hidden`}>
      
      {/* 🔮 Background Glows */}
      <div className="absolute top-1/4 -right-24 w-[600px] h-[600px] bg-[#ff0080] rounded-full blur-[250px] opacity-[0.03] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-[600px] h-[600px] bg-[#7928ca] rounded-full blur-[250px] opacity-[0.03] pointer-events-none" />

      <div className={`${LANDING_TOKENS.container} relative z-10`}>
        
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          duration={1.2}
          className={LANDING_TOKENS.header.centered}
        >
          <span className={LANDING_TOKENS.header.kicker}>
            Como Ajudamos
          </span>
          <h2 className={`${LANDING_TOKENS.header.title} max-w-4xl mx-auto mb-8`}>
            Desenvolvendo e sustentando{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0080] to-[#7928ca] bg-[size:200%_auto] animate-gradient-flow">
              estratégias de pessoas
            </span>
          </h2>
          <p className={LANDING_TOKENS.header.descriptionCentered}>
            Atuamos em três frentes que vão do técnico ao humano, dos dados às pessoas, com foco no desenvolvimento real.
          </p>
        </ScrollReveal>

        {/* Services Triad */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <ScrollReveal
                key={service.id}
                animation="fade-up"
                duration={0.8}
                delay={index * 0.2}
                className={`${LANDING_TOKENS.card.container} group relative flex flex-col h-full rounded-[2.5rem]`}
              >
                {/* Visual Glass Glow on Hover */}
                <div 
                  className="absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${service.color}, transparent)` }}
                />

                {/* Icon Circle */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-700 group-hover:scale-110 group-hover:rotate-[5deg]"
                  style={{ backgroundColor: `${service.color}15`, border: `1px solid ${service.color}30` }}
                >
                  <Icon size={28} style={{ color: service.color }} />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow">
                  <span className={LANDING_TOKENS.card.kicker + " group-hover:text-white transition-colors duration-500"}>
                    {service.kicker}
                  </span>
                  <h3 className={LANDING_TOKENS.card.title + " group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all duration-500 mb-5 leading-tight"}>
                    {service.title}
                  </h3>
                  <p className={LANDING_TOKENS.card.description + " group-hover:text-gray-300 transition-colors duration-500"}>
                    {service.description}
                  </p>
                </div>

                {/* Simple Link/Arrow */}
                <Link 
                  href={service.href}
                  className="mt-10 flex items-center gap-2 text-white/40 group-hover:text-white transition-all duration-500 group-hover:gap-4 w-fit"
                >
                  <span className={LANDING_TOKENS.card.kicker + " opacity-0 group-hover:opacity-100 transition-all duration-500 mb-0 pointer-events-none"}>
                    Saiba mais
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[var(--accent-start)] transition-colors">
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Border Bottom Light */}
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] group-hover:w-1/3 transition-all duration-700 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${service.color}, transparent)` }}
                />
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

