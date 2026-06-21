"use client";

import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  HelpCircle, 
  Activity,
  CheckCircle2
} from "lucide-react";
import { Product } from "@/types/products";
import { BPlenRichTextRenderer } from "@/components/shared/BPlenRichTextRenderer";

interface PackageServicesAccordionProps {
  services: Product[];
}

/**
 * PackageServicesAccordion
 * Componente interativo para exibir os detalhes dos serviços inclusos em um pacote.
 * Permite ao usuário expandir cada serviço para visualizar:
 * 1. Descrição Geral
 * 2. Perguntas Frequentes (FAQs)
 * 3. Workflow de Entrega
 */
export default function PackageServicesAccordion({ services }: PackageServicesAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!services || services.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
        <p className="text-sm text-gray-500 italic">Nenhum serviço relacionado encontrado.</p>
      </div>
    );
  }

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {services.map((service, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={service.id} 
            className={`rounded-3xl border transition-all duration-300 overflow-hidden backdrop-blur-xl ${
              isOpen 
                ? "bg-white/10 border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" 
                : "bg-white/5 border-white/10 hover:border-[#ff0080]/20"
            }`}
          >
            {/* Header / Clickable Toggle */}
            <button
              onClick={() => toggleIndex(index)}
              className="w-full flex items-center justify-between p-8 text-left transition-colors"
              aria-expanded={isOpen}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-[#ff0080]/10 border border-[#ff0080]/20 rounded-full text-[#ff0080] text-[9px] font-black uppercase tracking-wider">
                    {service.kicker || "Serviço"}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {service.serviceCode}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {service.title}
                </h3>
              </div>
              <div className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 group-hover:text-white transition-colors">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {/* Expanded Content with smooth transition */}
            <div 
              className={`transition-all duration-500 ease-in-out ${
                isOpen ? "max-h-[1500px] border-t border-white/10" : "max-h-0"
              }`}
            >
              <div className="p-8 space-y-10">
                {/* 1. Descrição Geral */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff0080]">
                    <FileText size={14} />
                    Descrição Geral
                  </div>
                  <BPlenRichTextRenderer text={service.sheet.description} variant="default" />
                </div>

                {/* 2. Workflow de Entrega */}
                {service.workflow && service.workflow.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#00f2fe]">
                      <Activity size={14} />
                      Workflow de Entrega
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {service.workflow.map((step, sIdx) => (
                        <div 
                          key={step.id || sIdx} 
                          className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff0080]/10 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-[#ff0080]">
                            {sIdx + 1}
                          </div>
                          <div className="space-y-1 flex-1">
                            <h5 className="text-[11px] font-black uppercase tracking-widest text-white">
                              {step.title}
                            </h5>
                            <BPlenRichTextRenderer text={step.description || "Etapa estratégica de entrega"} variant="small" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. FAQs */}
                {service.sheet.faq && service.sheet.faq.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff0080]">
                      <HelpCircle size={14} />
                      Perguntas Frequentes
                    </div>
                    <div className="space-y-4">
                      {service.sheet.faq.map((item, fIdx) => (
                        <div 
                          key={fIdx} 
                          className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-[#ff0080] mt-0.5 flex-shrink-0" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">
                              {item.question}
                            </h4>
                          </div>
                          <BPlenRichTextRenderer text={item.answer} variant="small" className="pl-6" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
