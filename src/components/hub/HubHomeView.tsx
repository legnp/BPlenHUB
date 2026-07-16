"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  Zap,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Target,
  Briefcase,
  Clock,
  Activity,
  type LucideIcon
} from "lucide-react";
import { getSocialPosts } from "@/actions/social";
import { SocialPost } from "@/types/social";
import { MemberJourneyHero } from "@/components/hub/MemberJourneyHero";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { cn } from "@/lib/utils";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

/**
 * HUB HOME VIEW — o coracao da experiencia privada.
 * Estruturada como uma jornada de desenvolvimento.
 */


interface HubActivity {
  id: string;
  title: string;
  stageName: string;
  stageId: string;
  type: string;
  status: "completed" | "in_progress" | "pending";
  url: string;
  completionDate?: string;
}

function ActivityCard({
  kicker,
  activity,
  fallbackText,
  iconColor,
  icon: Icon
}: {
  kicker: string;
  activity: HubActivity | undefined;
  fallbackText: string;
  iconColor: string;
  icon: LucideIcon;
}) {
  if (!activity) {
    return (
      <div className="p-5 rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] opacity-50 flex flex-col justify-between h-36 text-left">
        <div>
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2">
            {kicker}
          </span>
          <p className="text-xs font-bold text-[var(--text-muted)] italic mt-4">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href={activity.url}
      className="p-5 rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-white/5 hover:border-[var(--accent-start)]/20 transition-all flex flex-col justify-between h-36 text-left group relative overflow-hidden"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] block">
            {kicker}
          </span>
          <div className={cn("p-1.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg shrink-0", iconColor)}>
            <Icon size={12} />
          </div>
        </div>
        <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:translate-x-1 transition-transform line-clamp-2 leading-snug">
          {activity.title}
        </h4>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
          {activity.stageName}
        </span>
        <ChevronRight size={12} className="text-[var(--text-muted)] opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export function HubHomeView() {
  const { user } = useAuthContext();
  const { stages, progress, loading: journeyLoading, getStageTelemetry } = useJourney(user?.uid || "guest");
  
  const [latestPosts, setLatestPosts] = useState<SocialPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await getSocialPosts(true); // Apenas ativos
        setLatestPosts(data.slice(0, 3)); // Pegar apenas os 3 mais recentes
      } catch (error) {
        console.error("Erro ao carregar posts no Hub:", error);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    loadPosts();
  }, []);

  // Mapear e classificar atividades do membro para exibicao de status real
  const activities = useMemo(() => {
    if (journeyLoading || stages.length === 0) return [];
    const list: Array<{
      id: string;
      title: string;
      stageName: string;
      stageId: string;
      type: string;
      status: "completed" | "in_progress" | "pending";
      url: string;
      completionDate?: string;
    }> = [];

    let firstActiveStageId = "";
    let firstIncompleteSubstepId = "";

    for (const stage of stages) {
      const tel = getStageTelemetry(stage.id);
      if (tel.status === "current" || tel.status === "available") {
        firstActiveStageId = stage.id;
        const completedIds = progress?.steps[stage.id]?.completedSubSteps || [];
        const incomplete = stage.substeps?.find(ss => !completedIds.includes(ss.id));
        if (incomplete) {
          firstIncompleteSubstepId = incomplete.id;
        }
        break;
      }
    }

    stages.forEach(stage => {
      if (stage.id === "primeiros-passos" || stage.id === "primeiros_passos" || stage.order === 0) {
        return;
      }

      // Filtro de habilitacao: apenas servicos adquiridos/habilitados para o cliente
      const telemetry = getStageTelemetry(stage.id);
      if (!telemetry.hasAccess) {
        return;
      }

      const completedIds = progress?.steps[stage.id]?.completedSubSteps || [];
      const compDates = progress?.steps[stage.id]?.subStepCompletionDates || {};

      stage.substeps?.forEach(sub => {
        const refIdLower = (sub.referenceId || "").toLowerCase();
        if (
          refIdLower.includes("perfil_settings") || 
          refIdLower.includes("networking") || 
          refIdLower.includes("tema")
        ) {
          return;
        }

        const isCompleted = completedIds.includes(sub.id);
        let status: "completed" | "in_progress" | "pending" = "pending";

        if (isCompleted) {
          status = "completed";
        } else if (stage.id === firstActiveStageId && sub.id === firstIncompleteSubstepId) {
          status = "in_progress";
        } else {
          status = "pending";
        }

        list.push({
          id: sub.id,
          title: sub.title,
          stageName: stage.title,
          stageId: stage.id,
          type: sub.type,
          status,
          url: `/hub/journey/${stage.id}`,
          completionDate: compDates[sub.id]
        });
      });
    });

    return list;
  }, [stages, progress, journeyLoading, getStageTelemetry]);

  const cardsData = useMemo(() => {
    const proxima = activities.find(a => a.status === "pending");
    const emAndamento = activities.find(a => a.status === "in_progress");
    const completedList = activities.filter(a => a.status === "completed");
    let ultimaConcluida: typeof activities[0] | undefined = undefined;
    
    if (completedList.length > 0) {
      const sortedByDate = [...completedList].sort((a, b) => {
        const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
        const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
        return dateB - dateA;
      });
      ultimaConcluida = sortedByDate[0];
    }

    return { proxima, emAndamento, ultimaConcluida };
  }, [activities]);

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      linkedin: "LinkedIn",
      instagram: "Instagram",
      tiktok: "TikTok",
      whatsapp: "WhatsApp",
      other: "Conteúdo"
    };
    return labels[platform] || "Conteúdo";
  };

  return (
    <div className="w-full flex flex-col min-h-screen relative font-sans">
      
      {/* CONTEÚDO PRINCIPAL DO HUB */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-[10px] pb-12 md:pt-[10px] md:pb-20 space-y-14">

        {/* 1. SEÇÃO JORNADA (Regra: 1 para Muitos) */}
        <MemberJourneyHero showAction={true} />

        {/* 2. ULTIMOS CONTEÚDOS E FERRAMENTAS (GRID MISTO) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 !mt-8">

           {/* Feed de Conteúdo Dinâmico */}
           <section id="ultimos-conteudos" className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                 <h3 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <Briefcase size={22} className="text-[var(--accent-start)]" /> Últimos Conteúdos
                 </h3>
                 <Link href="/conteudo" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 group">
                    Ver Todos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>

              <div className="space-y-3">
                 {isLoadingPosts ? (
                    Array.from({ length: 3 }).map((_, i) => (
                       <div key={i} className="h-20 bg-[var(--input-bg)] animate-pulse rounded-[1.5rem] border border-[var(--border-primary)]" />
                    ))
                 ) : latestPosts.length > 0 ? (
                    latestPosts.map((post) => (
                       <Link 
                         key={post.id}
                         href={post.url}
                         target="_blank"
                         className="p-4 block rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--input-border)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)] transition-all group"
                       >
                          <div className="flex items-start justify-between gap-4">
                             <div className="space-y-1 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
                                   {getPlatformLabel(post.platform)}
                                </span>
                                <h4 className="text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-all leading-relaxed line-clamp-2">
                                   {post.title}
                                </h4>
                             </div>
                             <div className="shrink-0 p-2.5 bg-[var(--input-bg)] rounded-xl text-[var(--text-muted)] group-hover:text-[var(--accent-start)] transition-all">
                                <ExternalLink size={16} />
                             </div>
                          </div>
                       </Link>
                    ))
                 ) : (
                    <div className="py-8 px-6 border border-dashed border-[var(--border-primary)] rounded-[2rem] text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40">Novos conteúdos em breve</p>
                    </div>
                 )}
              </div>
           </section>

            {/* Telemetria Ativa: Suas atividades no HUB */}
            <section id="atividades-hub-acesso" className="space-y-5">
               <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                     <Target size={22} className="text-[#667eea]" /> Suas atividades no HUB
                  </h3>
                  <Link href="/hub/visao_geral" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 group">
                     Ir para Visão Geral <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {journeyLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-36 bg-[var(--input-bg)] animate-pulse rounded-2xl border border-[var(--border-primary)]" />
                     ))
                  ) : (
                     <>
                        {/* Card 1: Próxima Atividade */}
                        <ActivityCard
                           kicker="Próxima Atividade"
                           activity={cardsData.proxima}
                           fallbackText="Nenhuma atividade pendente"
                           iconColor="text-yellow-500"
                           icon={Clock}
                        />

                        {/* Card 2: Atividade em Andamento */}
                        <ActivityCard
                           kicker="Atividade em Andamento"
                           activity={cardsData.emAndamento}
                           fallbackText="Nenhum foco ativo no momento"
                           iconColor="text-blue-500"
                           icon={Activity}
                        />

                        {/* Card 3: Última Atividade Concluída */}
                        <ActivityCard
                           kicker="Última Atividade Concluída"
                           activity={cardsData.ultimaConcluida}
                           fallbackText="Nenhuma atividade concluída"
                           iconColor="text-green-500"
                           icon={CheckCircle2}
                        />
                     </>
                  )}
               </div>
            </section>

        </div>

        {/* 3. SEÇÃO DE PESQUISAS INTERATIVAS */}
        <section className="py-10 relative rounded-[3rem] overflow-hidden">
           {/* Background Overlay */}
           <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--border-primary)] backdrop-blur-md -z-10" />
           <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-start)] rounded-full blur-[120px] opacity-[0.03] translate-x-1/2 -translate-y-1/2" />
           
           <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
              <div className="space-y-4">
                 <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] border border-[var(--accent-start)]/10">
                    <MessageSquare size={12} /> Pulso da Comunidade
                 </span>
                 <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
                    A BPlen evolui com a <span className="italic text-[var(--text-secondary)]">sua participação.</span>
                 </h3>
              </div>

              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[var(--input-bg)] to-transparent border border-[var(--border-primary)] text-center space-y-5 max-w-2xl mx-auto hover:border-[var(--accent-start)]/20 transition-all shadow-2xl backdrop-blur-xl relative group">
                 {/* Decorative Glow */}
                 <div className="absolute inset-0 bg-[var(--accent-start)]/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                 <div className="space-y-4 relative z-10">
                    <div className="w-12 h-12 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-500">
                       <Zap size={28} className="text-[var(--accent-start)]" />
                    </div>
                    <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                       A BPlen está em <br /> <span className="text-[var(--accent-start)] italic">constante melhoria contínua.</span>
                    </p>
                    <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-black uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                       No momento não há enquetes abertas. Te avisaremos para participar das próximas evoluções.
                    </p>
                 </div>

                 <div className="pt-4 relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-500">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       Desenvolvimento Ativo
                    </div>
                 </div>
              </div>
           </div>
        </section>

      </main>

      {/* FOOTER DO HUB — Padronizado */}
      <GlobalFooter variant="full" />

    </div>
  );
}

