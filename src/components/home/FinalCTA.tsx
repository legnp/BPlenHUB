import { ScrollReveal } from "@/components/shared/ScrollReveal";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { LANDING_TOKENS } from "@/constants/landing-tokens";

/**
 * FinalCTA (Call to Action Final)
 * Seção de encerramento para conversão direta antes do rodapé.
 */
export function FinalCTA() {
  return (
    <section className={`${LANDING_TOKENS.section} border-none pt-0 pb-32`}>
      <div className={LANDING_TOKENS.container + " text-center"}>
        
        <ScrollReveal
           animation="fade-up"
           duration={1.2}
           className="space-y-10"
        >
          {/* Headline de Conversão */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-[50px] font-bold tracking-tighter leading-[1.1]">
              Vamos transformar o <br />
              desenvolvimento humano em <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0080] to-[#7928ca]">
                oportunidades?
              </span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
               Agende uma conversa, sem custo, sem compromisso, apenas com o foco de descobrirmos como podemos descomplicar o desenvolvimento humano juntos!
            </p>
          </div>

          {/* Botão Gigante Premium */}
          <div className="flex flex-col items-center gap-6">
            <Link 
              href="/agendar"
              className="group relative flex items-center gap-4 px-10 py-5 bg-white text-black font-bold text-lg rounded-2xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,0,128,0.2)] active:scale-95"
            >
              <Calendar className="w-6 h-6" />
              Agendar Conversa
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

        </ScrollReveal>

      </div>
    </section>
  );
}

