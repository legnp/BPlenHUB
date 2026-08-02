"use client";

import React from "react";
import { Product } from "@/types/products";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  FileText, 
  Zap, 
  Box, 
  Calendar,
  ExternalLink,
  Lock,
  MessageSquare,
  Clock
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SURVEY_REGISTRY } from "@/config/surveys";

interface ServiceDeliveryViewProps {
  product: Product;
  completedMilestones: string[];
  quotas: { total: number; used: number };
}

export function ServiceDeliveryView({ product, completedMilestones, quotas }: ServiceDeliveryViewProps) {
  
  const isWorkflowStepCompleted = (stepId: string) => {
    // Lógica inteligente: se o passo exige uma pesquisa, checamos se ela foi feita.
    return completedMilestones.includes(stepId);
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* 🏔️ Header do Portal de Entrega */}
      <div className="relative overflow-hidden rounded-[3rem] p-12 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
         {/* Ambient Glow */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-start)] rounded-full blur-[120px] opacity-10 pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="px-4 py-1.5 bg-[var(--accent-start)]/10 text-[var(--accent-start)] rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-[var(--accent-start)]/10">
                     Workflow Operacional
                  </div>
                  <div className="px-4 py-1.5 bg-white/5 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     Serviço Ativo
                  </div>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">{product.title}</h1>
               <p className="text-sm font-medium text-[var(--text-muted)] max-w-2xl leading-relaxed">
                  {product.sheet.description}
               </p>
            </div>

            {/* Elegant Quota Badge */}
            {quotas.total > 0 && (
               <div className="p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] flex items-center gap-6 group hover:border-[var(--accent-start)]/30 transition-all">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Saldo de Sessões</p>
                     <p className="text-2xl font-black italic tracking-tighter">
                        {quotas.total - quotas.used} <span className="text-xs opacity-30 not-italic">/ {quotas.total}</span>
                     </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-start)]/10 flex items-center justify-center text-[var(--accent-start)] group-hover:scale-110 transition-transform">
                     <Calendar size={20} />
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* 🗓️ Timeline Dinâmica (Esquerda) */}
         <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3 mb-6">
               <Clock size={16} className="text-[var(--accent-start)]" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Jornada de Execução</h2>
            </div>
            
            <div className="space-y-4 relative">
               {/* Linha Vertical Conectora */}
               <div className="absolute left-[21px] top-6 bottom-6 w-px bg-white/5" />

               {product.workflow.map((step, idx) => {
                  const isCompleted = completedMilestones.length > idx; // Mock progress for steps
                  return (
                     <div key={step.id} className="relative flex gap-6 group">
                        <div className={`z-10 w-[42px] h-[42px] rounded-2xl border flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                           {isCompleted ? <CheckCircle2 size={18} /> : <span className="font-black text-[10px]">{idx + 1}</span>}
                        </div>
                        <div className="pt-2 space-y-1">
                           <h3 className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isCompleted ? 'text-white' : 'text-gray-500'}`}>{step.title}</h3>
                           <p className="text-[10px] font-medium text-gray-600">{step.description}</p>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* 📦 Entregáveis & Ativos (Direita) */}
         <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-3 mb-6">
               <Box size={16} className="text-[var(--accent-start)]" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Recursos Disponíveis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               
               {/* Listagem de Pesquisas */}
               {product.capabilities.surveys.map(surveyId => {
                  const survey = SURVEY_REGISTRY.find(s => s.id === surveyId);
                  const isDone = completedMilestones.includes(surveyId);
                  if (!survey) return null;

                  return (
                     <Link key={surveyId} href={`/hub/surveys/${survey.id}`}>
                        <div className={`p-6 rounded-[2rem] border transition-all hover:-translate-y-1 flex flex-col justify-between h-48 group relative overflow-hidden ${isDone ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                           <div className="space-y-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                                 <MessageSquare size={18} />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black uppercase tracking-widest">{survey.title}</h4>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Diagnóstico Comportamental</p>
                              </div>
                           </div>
                           <div className="flex justify-between items-center z-10">
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDone ? 'text-emerald-500' : 'text-[var(--accent-start)]'}`}>
                                 {isDone ? "Resultado Pronto" : "Iniciar Agora"}
                              </span>
                              <ArrowRight size={14} className={`transition-transform group-hover:translate-x-1 ${isDone ? 'text-emerald-500' : 'text-[var(--accent-start)]'}`} />
                           </div>
                           {isDone && <CheckCircle2 size={80} className="absolute -right-4 -bottom-4 opacity-5 text-emerald-500" />}
                        </div>
                     </Link>
                  );
               })}

               {/* Botão do Google Drive */}
               <Link href={product.driveConfig?.sheetUrl || "#"} target="_blank">
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all hover:-translate-y-1 flex flex-col justify-between h-48 group">
                     <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 text-blue-400 flex items-center justify-center">
                           <FileText size={18} />
                        </div>
                        <div>
                           <h4 className="text-xs font-black uppercase tracking-widest">Documentação Cloud</h4>
                           <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Soberania de Dados Google Drive</p>
                        </div>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Abrir Pasta Individual</span>
                        <ExternalLink size={14} className="text-blue-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
               </Link>

               {/* Botão de Agendamento (Conditional) */}
               {(quotas.total - quotas.used > 0) && (
                  <Link href="/hub/agenda">
                     <div className="p-6 rounded-[2rem] bg-[#ff0080]/5 border border-[#ff0080]/10 hover:border-[#ff0080]/30 transition-all hover:-translate-y-1 flex flex-col justify-between h-48 group">
                        <div className="space-y-3">
                           <div className="w-10 h-10 rounded-2xl bg-[#ff0080]/10 text-[#ff0080] flex items-center justify-center italic font-black">
                              1:1
                           </div>
                           <div>
                              <h4 className="text-xs font-black uppercase tracking-widest">Agendar Sessão</h4>
                              <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Conexão Humana Integrada</p>
                           </div>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ff0080]">Reservar Horário</span>
                           <Calendar size={14} className="text-[#ff0080] opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </div>
                  </Link>
               )}
            </div>

            {/* Ficha Técnica / FAQ Expandido */}
            <div className="pt-12 border-t border-white/5 space-y-8">
               <div className="flex items-center gap-3">
                  <Zap size={16} className="text-[var(--accent-start)]" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Informações de Suporte</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Condições de Pagamento</h3>
                     <p className="text-[11px] leading-relaxed text-[var(--text-muted)] italic font-medium">&quot;{product.sheet.paymentConditions}&quot;</p>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Suporte Técnico</h3>
                     <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">O acompanhamento deste serviço é vitalício enquanto o HUB estiver ativo. Dúvidas pelo Slack ou WhatsApp.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
