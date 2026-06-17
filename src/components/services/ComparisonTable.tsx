"use client";

import React from "react";
import { ChevronRight, Check } from "lucide-react";
import Link from "next/link";

interface Column {
  id: string;
  name: string;
  duration: string;
  priceInstallment: string;
  cashDiscount: string;
  slug: string;
}

export function ComparisonTable() {
  const columns: Column[] = [
    { id: "junior", name: "Junior", duration: "1 semana", priceInstallment: "Sem Custo", cashDiscount: "Autoaplicável", slug: "junior" },
    { id: "pleno", name: "Pleno", duration: "2 semanas", priceInstallment: "5x R$ 165,34", cashDiscount: "5% de desc. à vista", slug: "pleno" },
    { id: "senior", name: "Senior", duration: "1 mês", priceInstallment: "5x R$ 325,62", cashDiscount: "5% de desc. à vista", slug: "senior" },
    { id: "lider", name: "Líder", duration: "4 meses", priceInstallment: "5x R$ 1.183,07", cashDiscount: "5% de desc. à vista", slug: "lider" }
  ];

  const features = [
    { name: "Revisão e elaboração de CV", values: { junior: true, pleno: true, senior: true, lider: true }, isSelfService: true },
    { name: "PDI Básico", values: { junior: true, pleno: true, senior: true, lider: true }, isSelfService: true },
    { name: "Preparação para Entrevista", values: { junior: true, pleno: true, senior: true, lider: true }, isSelfService: true },
    { name: "Análise Comportamental (DISC)", values: { junior: false, pleno: true, senior: true, lider: true } },
    { name: "Plano de Carreira", values: { junior: false, pleno: false, senior: true, lider: true } },
    { name: "PDI Avançado & Consultoria Dedicada", values: { junior: false, pleno: false, senior: true, lider: true } },
    { name: "Gestão e Desenvolvimento de Carreira", values: { junior: false, pleno: false, senior: false, lider: true } },
    { name: "Assessoria de Carreira Personalizada", values: { junior: false, pleno: false, senior: false, lider: true } },
    { name: "Consultoria (Reuniões de Devolutivas & Alinhamentos)", values: { junior: false, pleno: true, senior: true, lider: true } },
    { name: "1to1 de Acompanhamento (Mentoria & Feedback)", values: { junior: false, pleno: false, senior: true, lider: true } },
    { name: "Acesso à Área de Membro BPlen", values: { junior: false, pleno: true, senior: true, lider: true } },
    { name: "Acesso ao Networking de Negócios BPlen", values: { junior: false, pleno: false, senior: false, lider: true } },
  ];

  return (
    <div className="w-full rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-1 md:p-2 shadow-2xl relative overflow-hidden text-white">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-[180px] h-[180px] bg-[#ff0080]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Table Grid wrapper */}
      <div className="overflow-x-auto w-full scrollbar-none">
        <table className="w-full border-collapse text-left text-xs min-w-[800px] table-fixed">
          <thead>
            <tr className="border-b border-white/5">
              {/* External Grouping Header Column */}
              <th className="w-[120px] p-5 text-[9px] font-black uppercase tracking-wider text-gray-500">Serviço</th>
              {/* Deliverables Header Column */}
              <th className="w-[280px] p-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Entregáveis por Categoria</th>
              {columns.map(col => (
                <th key={col.id} className="p-5 text-center">
                  <div className="space-y-1">
                    <span className="text-sm font-black tracking-tight text-white block">{col.name}</span>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">{col.duration}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feat, idx) => {
              const isFirstSelfService = feat.isSelfService && idx === 0;

              return (
                <tr 
                  key={idx} 
                  className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${feat.isSelfService ? 'bg-[#ff0080]/[0.01]' : ''}`}
                >
                  {/* Outer Grouping Cell */}
                  {isFirstSelfService ? (
                    <td 
                      rowSpan={3} 
                      className="border-r border-white/10 text-center p-3 font-black text-[9px] tracking-widest text-[#ff0080] bg-gradient-to-r from-[#ff0080]/5 to-transparent uppercase align-middle select-none"
                    >
                      <div className="rotate-0 md:rotate-[-90deg] whitespace-normal md:whitespace-nowrap leading-tight">
                        Self-Service
                        <span className="block text-[7px] font-bold text-gray-400 normal-case tracking-normal mt-1 opacity-70">
                          (Sem Acompanhamento)
                        </span>
                      </div>
                    </td>
                  ) : !feat.isSelfService ? (
                    <td className="border-r border-white/5 p-3 text-center text-gray-700 font-medium select-none">—</td>
                  ) : null}

                  {/* Feature Title */}
                  <td className="p-4 font-bold text-gray-300 pl-6 leading-relaxed">{feat.name}</td>

                  {/* Column feature checks */}
                  {columns.map(col => {
                    const hasFeature = feat.values[col.id as keyof typeof feat.values];
                    return (
                      <td key={col.id} className="p-4 text-center">
                        {hasFeature ? (
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ff0080]/10 border border-[#ff0080]/20 text-[#ff0080] shadow-[0_0_10px_rgba(255,0,128,0.15)]">
                            <Check size={10} className="stroke-[3.5]" />
                          </div>
                        ) : (
                          <span className="text-gray-700 font-medium select-none">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Pricing Installments Row */}
            <tr className="border-t-2 border-white/10 bg-white/[0.02]">
              <td className="border-r border-white/5 p-5 text-center text-gray-700 font-medium select-none">—</td>
              <td className="p-5 font-black uppercase text-[10px] tracking-widest text-gray-300">Investimento</td>
              {columns.map(col => (
                <td key={col.id} className="p-5 text-center align-middle">
                  <div className="space-y-0.5">
                    <span className="text-base font-black text-white tracking-tight block">{col.priceInstallment}</span>
                    <span className="block text-[8px] font-black text-[#ff0080] uppercase tracking-wider opacity-90">{col.cashDiscount}</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Action / Detail CTA Row */}
            <tr className="bg-white/[0.04]">
              <td className="border-r border-white/5 p-5 text-center text-gray-700 font-medium select-none">—</td>
              <td className="p-5">
                <span className="text-[10px] font-bold text-gray-500 italic opacity-60">Escolha o seu nível estratégico</span>
              </td>
              {columns.map(col => (
                <td key={col.id} className="p-5 text-center">
                  <Link 
                    href={`/servicos/pessoas/${col.slug}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-wider hover:scale-[1.03] active:scale-[0.98] transition-all group/btn w-full shadow-lg"
                  >
                    Ver Mais
                    <ChevronRight size={10} className="group-hover/btn:translate-x-0.5 duration-300" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
