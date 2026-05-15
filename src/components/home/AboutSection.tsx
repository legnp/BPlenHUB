import { ScrollReveal } from "@/components/shared/ScrollReveal";
import Image from "next/image";
import { ArrowRight, Sparkles, User, Briefcase, GraduationCap, Building } from "lucide-react";
import { LANDING_TOKENS } from "@/constants/landing-tokens";

export function AboutSection() {
  return (
    <section className={LANDING_TOKENS.section}>
      
      {/* 🔮 Glow Ambient */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ff0080] rounded-full blur-[180px] opacity-[0.03] pointer-events-none -z-10" />

      <div className={LANDING_TOKENS.container + " space-y-[70px]"}>
        
        {/* ==============================
            PARTE 1: QUEM SOMOS 
        ============================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Header Texto Principal */}
          <ScrollReveal 
            animation="fade-up"
            duration={1.2}
            className="space-y-8"
          >
            <span className={LANDING_TOKENS.header.kicker}>
              Quem Somos
            </span>
            <h2 className={LANDING_TOKENS.header.title}>
              Somos o seu HRBP que te ajuda a <span className="text-[var(--text-secondary)]">descomplicar o desenvolvimento humano</span> no trabalho.
            </h2>
            <p className={LANDING_TOKENS.header.description}>
              Somos uma consultoria de negócios com foco em Desenvolvimento Humano, nascida da experiência holística de sua fundadora em grandes multinacionais e empreendedorismo.
            </p>

            {/* "Para Quem" Badges */}
            <div className="pt-4 space-y-4">
              <h4 className={LANDING_TOKENS.header.kicker + " text-[var(--text-muted)] mb-0"}>Para quem</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ff0080]" />
                  <p className="text-sm md:text-base text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Pessoas:</strong> Gestão de Carreira Completa</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ff0080]" />
                  <p className="text-sm md:text-base text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Empresas:</strong> HRBP como um serviço</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ff0080]" />
                  <p className="text-sm md:text-base text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Parceiros:</strong> Projetos e ativações de negócio em conjunto</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Cards Glass Vision/Mission */}
          <ScrollReveal 
            animation="slide-right"
            duration={1.2}
            delay={0.2}
            className="space-y-6 lg:mt-16"
          >
            <div className={LANDING_TOKENS.card.container}>
              <Sparkles className="text-[#ff0080] mb-5" size={24} />
              <h3 className={LANDING_TOKENS.card.title}>Nossa Missão</h3>
              <p className={LANDING_TOKENS.card.description}>
                Ajudar pessoas e negócios a alinhar objetivos através do desenvolvimento humano prático, aplicado à realidade com clareza, método e execução, para gerar resultados sustentáveis.
              </p>
            </div>
            
            <div className={LANDING_TOKENS.card.container}>
              <Briefcase className="text-[#ff0080] mb-5" size={24} />
              <h3 className={LANDING_TOKENS.card.title}>O Que Nos Move</h3>
              <p className={LANDING_TOKENS.card.description}>
                Integramos dados, métodos e desenvolvimento humano para transformar conflitos em oportunidades e potencializar performance junto à qualidade de vida.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* ==============================
            PARTE 2: A FUNDADORA 
        ============================== */}
        <div className="pt-16 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Foto / Perfil */}
            <ScrollReveal 
              animation="fade-up"
              duration={1.2}
              className="lg:col-span-4 flex flex-col"
            >
            <span className={LANDING_TOKENS.header.kicker + " text-[var(--text-muted)] mb-8"}>
                A Fundadora
              </span>
              
              {/* Foto Circular (Placeholder luxuoso) */}
              <div className="w-48 h-48 rounded-full border border-white/10 bg-[#111] overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center mb-8">
                 <Image 
                   src="/foto_perfil_fundadora.jpg" 
                   alt="Lisandra Lencina - Fundadora da BPlen"
                   fill
                   className="object-cover"
                   priority
                 />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-[var(--text-primary)]">Lisandra Lencina</h3>
              <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed mb-6">
                Vive o empreendedorismo desde a juventude e há 10 anos ajuda pessoas e negócios a alinharem seus interesses e resultados.
              </p>

              <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)]">
                <GraduationCap className="text-[var(--text-muted)] mb-2" size={20} />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] block mb-1">Formações:</strong> 
                  Administração de Empresas, MBA em Gestão de Negócios, Especialização em RH e Coaching.
                </p>
              </div>
            </ScrollReveal>

            {/* Timeline Histórica */}
            <ScrollReveal 
              animation="slide-left"
              duration={1.2}
              delay={0.3}
              className="lg:col-span-8 space-y-8"
            >
               <h4 className="text-2xl font-semibold text-white">Linha do Tempo e Experiência</h4>
               
               <div className="relative border-l border-[var(--border-primary)] ml-3 space-y-12 pb-4">
                 
                 {/* Event 1 */}
                 <div className="relative pl-8">
                   <div className="absolute w-6 h-6 bg-black border border-white/20 rounded-full -left-3 top-[-2px] flex items-center justify-center">
                     <div className="w-2 h-2 bg-gray-500 rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-gray-500 tracking-widest">2008</span>
                   <h5 className="text-lg font-medium text-white">Empreendedorismo (Familiar)</h5>
                 </div>

                 {/* Event 2 */}
                 <div className="relative pl-8">
                   <div className="absolute w-6 h-6 bg-black border border-white/20 rounded-full -left-3 top-[-2px] flex items-center justify-center">
                     <div className="w-2 h-2 bg-gray-500 rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-gray-500 tracking-widest">2013</span>
                   <h5 className="text-lg font-medium text-white">Projetos Educacionais</h5>
                   <p className="text-sm text-gray-400 mt-1">Gov-SP, Hertft, Itaú</p>
                 </div>

                 {/* Event 3 */}
                 <div className="relative pl-8">
                   <div className="absolute w-6 h-6 bg-black border border-white/20 rounded-full -left-3 top-[-2px] flex items-center justify-center">
                     <div className="w-2 h-2 bg-gray-500 rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-gray-500 tracking-widest">2016</span>
                   <h5 className="text-lg font-medium text-white">Inteligência de Mercado</h5>
                   <p className="text-sm text-gray-400 mt-1">IDC, H. Strattner</p>
                 </div>

                 {/* Event 4 (Alto Impacto) */}
                 <div className="relative pl-8">
                   <div className="absolute w-6 h-6 bg-black border border-[#ff0080]/50 shadow-[0_0_10px_rgba(255,0,128,0.5)] rounded-full -left-3 top-[-2px] flex items-center justify-center z-10">
                     <div className="w-2 h-2 bg-[#ff0080] rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-[#ff0080] tracking-widest">2019</span>
                   <h5 className="text-xl font-bold text-white mb-2">RH e DHO</h5>
                   <p className="text-sm text-white mb-4 flex items-center gap-2">
                     <Building size={14} className="text-gray-400"/>
                     Acer, Samsung e Smart Beauty
                   </p>
                   
                   <div className="p-6 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 backdrop-blur-md space-y-3">
                     <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Principais Resultados</span>
                     <ul className="space-y-2">
                       <li className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                         <ArrowRight size={16} className="text-gray-500 shrink-0 mt-0.5"/>
                         Contribuição para a conquista do selo GPTW, com eNPS acima de 80%
                       </li>
                       <li className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                         <ArrowRight size={16} className="text-gray-500 shrink-0 mt-0.5"/>
                         Estruturação e implantação de frentes estratégicas de RH
                       </li>
                       <li className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                         <ArrowRight size={16} className="text-gray-500 shrink-0 mt-0.5"/>
                         Transformação e melhoria de processos, com ganho de mais de 50% em agilidade
                       </li>
                       <li className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                         <ArrowRight size={16} className="text-gray-500 shrink-0 mt-0.5"/>
                         Expansão de escopo e aumento do valor entregue ao cliente com NPs acima de 4.8
                       </li>
                     </ul>
                   </div>
                 </div>

                 {/* Event 5 (Atual) */}
                 <div className="relative pl-8">
                   <div className="absolute w-6 h-6 bg-black border border-[#ff0080]/50 shadow-[0_0_10px_rgba(255,0,128,0.5)] rounded-full -left-3 top-[-2px] flex items-center justify-center z-10">
                     <div className="w-2 h-2 bg-[#ff0080] rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-[#ff0080] tracking-widest">2025 E ALÉM</span>
                   <h5 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                     BPlen Consultoria
                   </h5>
                 </div>

               </div>
            </ScrollReveal>

          </div>
        </div>

      </div>
    </section>
  );
}

