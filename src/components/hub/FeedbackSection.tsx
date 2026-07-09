"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  MessageSquareText 
} from "lucide-react";
import { LANDING_TOKENS } from "@/constants/landing-tokens";
import { useAuthContext } from "@/context/AuthContext";
import { ContentEvaluationModal } from "./ContentEvaluationModal";
import { ThemeSuggestionModal } from "./ThemeSuggestionModal";

/**
 * FeedbackSection — Componente de captação de voz do usuário
 * Gerencia a lógica de abertura dos modais de avaliação e sugestão.
 */
export function FeedbackSection() {
  const { user, matricula } = useAuthContext();
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  return (
    <section className="py-24 px-6 bg-white border-t border-gray-100">
      <div className={LANDING_TOKENS.container}>
        <div className="max-w-4xl mx-auto p-12 rounded-[3rem] bg-gray-50 border border-gray-100 flex flex-col md:flex-row items-center gap-12">
          <div className="space-y-6 text-center md:text-left flex-grow">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#ff0080] font-bold text-xs uppercase tracking-widest">
              <Sparkles size={16} />
              Sua Opinião Importa
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
              O que você gostaria de <br /> ver por aqui?
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Estamos sempre melhorando a qualidade de nosso conteúdo.
              Deixe seu feedback para nos ajudar a priorizar novos temas.
            </p>
          </div>
          
          <div className="w-full md:max-w-xs space-y-4">
            <button 
              onClick={() => setIsEvaluationOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-white border border-gray-200 text-black font-bold text-xs tracking-widest uppercase hover:border-[#ff0080] transition-all flex items-center justify-between group"
            >
              Avaliar Conteúdos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setIsSuggestionOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-black text-white font-bold text-xs tracking-widest uppercase hover:scale-[1.02] transition-all flex items-center justify-between group"
            >
              Sugerir Temas <MessageSquareText size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ContentEvaluationModal 
        isOpen={isEvaluationOpen} 
        onClose={() => setIsEvaluationOpen(false)}
        uid={user?.uid}
        matricula={matricula}
      />
      
      <ThemeSuggestionModal 
        isOpen={isSuggestionOpen} 
        onClose={() => setIsSuggestionOpen(false)}
        uid={user?.uid}
        matricula={matricula}
      />
    </section>
  );
}
