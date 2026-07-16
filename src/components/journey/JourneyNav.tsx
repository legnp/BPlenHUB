"use client";

import { StepStatus, JourneyStep } from "@/types/journey";
import { Product } from "@/types/products";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { UpsellServiceModal } from "./UpsellServiceModal";
import { getProductBySlug } from "@/actions/products";
import { StageTelemetry } from "@/hooks/useJourney";
import { SequenceLockModal } from "./SequenceLockModal";
import GlassModal from "@/components/ui/GlassModal";
import { BPlenRichTextRenderer } from "@/components/shared/BPlenRichTextRenderer";
import { resolveStageBeacon } from "@/lib/journey/stage-beacon";
import { resolvePendingStageTitles } from "@/lib/journey/pending-stages";

interface JourneyNavProps {
  stages: JourneyStep[];
  currentStepId: string;
  stepStatusMap: Record<string, StepStatus>;
  getStageTelemetry?: (stepId: string) => StageTelemetry;
  onSelectStep?: (stepId: string) => void;
}

// Mapeamento de Ícones Vibrantes e Cores Premium (Alinhado ao Apple IOS Pro) ✨🧬
const STAGE_THEMES: Record<string, { icon: LucideIcon, color: string, gradient: string }> = {
  "primeiros_passos": { 
    icon: LucideIcons.Rocket, 
    color: "#EC4899", 
    gradient: "from-pink-500 to-rose-500" 
  },
  "primeiros-passos": { 
    icon: LucideIcons.Rocket, 
    color: "#EC4899", 
    gradient: "from-pink-500 to-rose-500" 
  },
  "onboarding": { 
    icon: LucideIcons.Rocket, 
    color: "#EC4899", 
    gradient: "from-pink-500 to-rose-500" 
  },
  "preparacao-de-carreira": { 
    icon: LucideIcons.Compass, 
    color: "#3B82F6", 
    gradient: "from-blue-500 to-sky-500" 
  },
  "preparacao-carreira": { // Fallback para slug curta
    icon: LucideIcons.Compass, 
    color: "#3B82F6", 
    gradient: "from-blue-500 to-sky-500" 
  },
  "analise-comportamental": { 
    icon: LucideIcons.Fingerprint, 
    color: "#8B5CF6", 
    gradient: "from-violet-500 to-purple-500" 
  },
  "plano-de-carreira": { 
    icon: LucideIcons.Map, 
    color: "#10B981", 
    gradient: "from-emerald-500 to-teal-500" 
  },
  "plano-carreira": { // Fallback
    icon: LucideIcons.Map, 
    color: "#10B981", 
    gradient: "from-emerald-500 to-teal-500" 
  },
  "desenvolvimento-de-carreira": { 
    icon: LucideIcons.TrendingUp, 
    color: "#F59E0B", 
    gradient: "from-amber-500 to-orange-500" 
  },
  "desenvolvimento-carreira": { // Fallback
    icon: LucideIcons.TrendingUp, 
    color: "#F59E0B", 
    gradient: "from-amber-500 to-orange-500" 
  },
  "coaching-e-mentoria": { 
    icon: LucideIcons.MessageSquareHeart, 
    color: "#6366F1", 
    gradient: "from-indigo-500 to-violet-500" 
  },
  "coaching": { // Fallback 
    icon: LucideIcons.MessageSquareHeart, 
    color: "#6366F1", 
    gradient: "from-indigo-500 to-violet-500" 
  },
  "mentoria": { // Fallback 
    icon: LucideIcons.MessageSquareHeart, 
    color: "#6366F1", 
    gradient: "from-indigo-500 to-violet-500" 
  },
  "offboarding": { 
    icon: LucideIcons.Award, 
    color: "#EF4444", 
    gradient: "from-red-500 to-rose-600" 
  },
};

export function JourneyNav({ stages, currentStepId, stepStatusMap, getStageTelemetry, onSelectStep }: JourneyNavProps) {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<string | null>(null);
  
  // Upsell State 🧬
  const [upsellProduct, setUpsellProduct] = useState<Product | null>(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);

  // Sequence Lock State 🔒
  const [sequenceLockModalOpen, setSequenceLockModalOpen] = useState(false);
  const [pendingStageTitles, setPendingStageTitles] = useState<string[]>([]);

  // Gate para Não-Membros (mesmo padrão visual p/ Onboarding e Offboarding) 🔒
  const [offboardingLockedModalOpen, setOffboardingLockedModalOpen] = useState(false);
  const [onboardingLockedModalOpen, setOnboardingLockedModalOpen] = useState(false);

  const currentStepIndex = stages.findIndex(s => s.id === currentStepId);

  // Manipulador de Clique Inteligente (Governança + Upsell + Sequência 🛡️✨)
  const handleStageClick = async (stage: JourneyStep, hasAccess: boolean, isSequenceLocked: boolean, pendentes: string[] = []) => {
    // 0. Exceção do Offboarding para Não-Membros
    if (!hasAccess && stage.id.toLowerCase() === 'offboarding') {
      setOffboardingLockedModalOpen(true);
      return;
    }

    // 0.5 Exceção do Onboarding para Não-Membros — mesmo padrão visual do
    // Offboarding (não é serviço comprável, é composição da jornada; sem foto/upsell).
    if (!hasAccess && stage.id.toLowerCase() === 'onboarding') {
      setOnboardingLockedModalOpen(true);
      return;
    }

    // 1. Prioridade: Se não tem acesso nenhum -> Upsell
    if (!hasAccess) {
      setUpsellModalOpen(true);
      setUpsellLoading(true);
      try {
        const product = await getProductBySlug(stage.id, true);
        setUpsellProduct(product);
      } catch (err) {
        console.error("Erro ao carregar produto de upsell:", err);
      } finally {
        setUpsellLoading(false);
      }
      return;
    }

    // 2. Segunda Prioridade: Tem acesso, mas a sequência está travada metodologicamente
    if (isSequenceLocked) {
       // O modal abre SEMPRE que a etapa esta travada. Antes havia um
       // `if (stageIndex > 0)` aqui: a 1a etapa caia num return mudo, e o clique
       // no Posicionamento (etapa 1, travavel desde a Fase C) nao fazia nada
       // (BUG-081). As pendencias vem do motor, nao da posicao na lista.
       setPendingStageTitles(resolvePendingStageTitles(pendentes, stages, stage.id));
       setSequenceLockModalOpen(true);
       return;
    }

    if (onSelectStep) {
       onSelectStep(stage.id);
    }
  };

  return (
    <div className="w-full py-[5px] px-4 overflow-visible">
      <div className="max-w-6xl mx-auto relative px-2">
        {/* 🎇 Horizonte de Conexão (Efeito Eéreo) */}
        <div 
          className="absolute top-[92px] left-0 w-full h-[1.5px] bg-[var(--border-primary)] opacity-10" 
          style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
        />
        
        {/* 🎆 Linha de Progresso Ativo (Glow Rail) */}
        <motion.div 
          className="absolute top-[92px] left-0 h-[1.5px] bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] shadow-[0_0_12px_var(--accent-start)]"
          initial={{ width: 0 }}
          animate={{ width: `${(Math.max(0, currentStepIndex) / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 100%)' }}
        />

        <div className="flex justify-between items-center relative z-10 w-full">
          {stages.map((stage) => {
            const telemetry = getStageTelemetry ? getStageTelemetry(stage.id) : {
              status: stepStatusMap[stage.id] || "locked",
              percentage: 0,
              hasAccess: true,
              isNext: false,
              isSequenceLocked: false,
              substepsLabel: "0/0",
              pendentes: []
            };

            const isCurrent = stage.id === currentStepId;
            const isBlockedBySequence = telemetry.hasAccess && telemetry.isSequenceLocked;
            
            // 🔍 Resolução Inteligente de Tema (ID -> Ordem -> Fallback)
            const THEME_ORDER_MAP: Record<number, string> = {
              0: "primeiros-passos",
              1: "onboarding",
              2: "preparacao-de-carreira",
              3: "analise-comportamental",
              4: "plano-de-carreira",
              5: "desenvolvimento-de-carreira",
              6: "coaching-e-mentoria",
              7: "offboarding"
            };

            const theme = STAGE_THEMES[stage.id] 
              || STAGE_THEMES[THEME_ORDER_MAP[stage.order]]
              || { icon: LucideIcons.Circle, color: "#94A3B8", gradient: "from-slate-400 to-slate-500" };
            
            // 🧬 Resolução Dinâmica de Ícone (String -> Componente) Rigorosa 🛡️
            const iconName = stage.icon as keyof typeof LucideIcons;
            const IconComponent = (stage.icon && LucideIcons[iconName]) 
              ? LucideIcons[iconName] as LucideIcon
              : theme.icon;

            // Farol (beacon) da etapa — regra pura e testada em `stage-beacon.ts`.
            const beacon = resolveStageBeacon({
              status: telemetry.status,
              percentage: telemetry.percentage,
              hasAccess: telemetry.hasAccess,
              isNext: telemetry.isNext,
              isSequenceLocked: telemetry.isSequenceLocked,
              isCurrent
            });
            const beaconColor = beacon.color;
            const beaconStatus = beacon.status;
            const isPinkPulsing = !telemetry.hasAccess && telemetry.isNext;

            // Governança de Wrapper (Híbrido Link/Upsell/Sequence 🧬)
            const isBlocked = !telemetry.hasAccess;
            const WrapperComponent = (onSelectStep || isBlocked || isBlockedBySequence) ? "div" : Link;
            
            const wrapperProps = onSelectStep || isBlocked || isBlockedBySequence
              ? { onClick: () => handleStageClick(stage, telemetry.hasAccess, telemetry.isSequenceLocked, telemetry.pendentes ?? []), role: "button" } 
              : { href: (stage.id === 'PRIMEIROS_PASSOS' || stage.id === 'primeiros_passos' || stage.order === 0) 
                  ? "/hub/journey/posicionamento-profissional" 
                  : `/hub/journey/${stage.id}` 
                } as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

            return (
              <div 
                key={stage.id} 
                className="flex flex-col items-center group relative flex-1"
                onMouseEnter={() => setHoveredStep(stage.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* TOOLTIP OBSIDIAN (ALTA LEGIBILIDADE) 📊🧪 */}
                <AnimatePresence>
                  {hoveredStep === stage.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute -top-24 z-chrome-popover min-w-[160px] px-5 py-4 rounded-[1.5rem] bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] pointer-events-none"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-2">
                        {isBlocked ? "Conteúdo Exclusivo" : isBlockedBySequence ? "Aguardando Fase Anterior" : beaconStatus}
                      </p>
                      
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                         <motion.div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: theme.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${telemetry.percentage}%` }}
                         />
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Evolução</span>
                        <span className="text-[11px] font-black text-white">{telemetry.percentage}%</span>
                      </div>
                      
                      {/* Arrow Down */}
                      <div className="absolute -bottom-1.5 left-1/2 -translateX-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-white/10" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FAROL (BEACON) 🚥 */}
                <div className="mb-1.5 relative h-3 flex items-center justify-center">
                   <div className={cn(
                     "w-2.5 h-2.5 rounded-full transition-all duration-700 border border-white/10",
                     beaconColor,
                     isPinkPulsing ? "animate-pulse" : ""
                   )} />
                   {isPinkPulsing && (
                      <div className="absolute inset-0 rounded-full bg-[var(--accent-start)] animate-ping opacity-30" />
                   )}
                </div>

                {/* BOTÃO DO STEP (ÍCONE VIBRANTE) 🚀✨ */}
                <WrapperComponent
                  {...(wrapperProps as React.ComponentPropsWithoutRef<typeof Link> & React.HTMLAttributes<HTMLDivElement>)}
                  className={cn(
                    "relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                    "glass border overflow-visible cursor-pointer",
                    isCurrent 
                      ? "border-white/40 bg-white/20 shadow-xl scale-110" 
                      : isBlocked || isBlockedBySequence
                        ? "border-transparent bg-white/5 opacity-80 filter grayscale-[0.5] hover:grayscale-0 hover:scale-105"
                        : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 hover:scale-105"
                  )}
                >
                  <motion.div
                    className="flex items-center justify-center"
                    whileHover={{ 
                      y: [0, -6, 0],
                      transition: { 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }
                    }}
                  >
                    {isBlocked ? (
                       <LucideIcons.Lock size={18} className="text-[var(--text-muted)] opacity-60 absolute -top-1 -right-1 z-20 group-hover:text-[var(--accent-start)] transition-colors" />
                    ) : null}

                    <IconComponent 
                      className="w-[25px] h-[25px] transition-all duration-500" 
                      style={{ 
                        color: isBlocked || isBlockedBySequence ? "var(--text-muted)" : theme.color,
                        filter: isCurrent 
                            ? `drop-shadow(0 0 12px ${theme.color}60)` 
                            : !(isBlocked || isBlockedBySequence)
                                ? 'grayscale(0) opacity(1)' 
                                : 'grayscale(1) opacity(0.5)',
                      }}
                    />
                  </motion.div>

                  {/* Efeito Glow para Etapa Atual */}
                  {isCurrent && (
                    <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 rounded-[1.5rem] opacity-25 blur-2xl -z-10"
                        style={{ backgroundColor: theme.color }}
                    />
                  )}
                </WrapperComponent>

                {/* NOME DA ETAPA (TOKEN TEXT PRIMARY) */}
                <div className="mt-5 text-center px-2 hidden lg:block">
                  <p className={cn(
                    "text-[9px] uppercase tracking-[0.25em] font-black transition-colors leading-tight max-w-[110px]",
                    isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] opacity-50"
                  )}>
                    {stage.order === 0 ? "00" : (stage.order).toString().padStart(2, '0')}
                    <br />
                    {stage.title}
                  </p>
                  
                  {/* Botão de Detalhes da Etapa */}
                  <button 
                     onClick={() => setDetailModalOpen(stage.id)}
                     className="mt-2 mx-auto flex items-center justify-center text-[var(--text-muted)] opacity-40 hover:opacity-100 hover:text-[var(--text-primary)] transition-all"
                  >
                     <LucideIcons.ChevronDown size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalhes do Serviço — padronizado no GlassModal (overlay/tema/z canônicos) */}
      <GlassModal
        isOpen={!!detailModalOpen}
        onClose={() => setDetailModalOpen(null)}
        maxWidth="max-w-3xl"
      >
        {(() => {
          const stage = stages.find(s => s.id === detailModalOpen);
          if (!stage) return null;

          const theme = STAGE_THEMES[stage.id] || { color: "#EC4899", icon: LucideIcons.Compass, gradient: "" };
          const Icon = theme.icon;
          const workflow = stage.workflow && stage.workflow.length > 0 ? stage.workflow : null;
          const hasDelivery = !!workflow || (stage.substeps && stage.substeps.length > 0);

          return (
            <div className="relative">
              {/* Fechar */}
              <button
                onClick={() => setDetailModalOpen(null)}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all z-20"
                aria-label="Fechar"
              >
                <LucideIcons.X size={18} />
              </button>

              {/* Cabeçalho */}
              <div className="flex items-center gap-4 mb-8 pr-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${theme.color}20`, color: theme.color }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)] leading-tight">{stage.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                    {stage.kicker || "Visão Estratégica"}
                  </p>
                </div>
              </div>

              {/* Grid de 2 colunas: descrição do serviço | workflow de entrega */}
              <div className={cn("grid gap-6", hasDelivery ? "md:grid-cols-2" : "grid-cols-1")}>
                {/* Esquerda: descrição do serviço (fonte única = product.sheet.description) */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-start)] flex items-center gap-2">
                    <LucideIcons.Sparkles size={12} />
                    Sobre o serviço
                  </h4>
                  <div className="p-6 bg-[var(--input-bg)]/50 border border-[var(--border-primary)] rounded-[2rem] max-h-[340px] overflow-y-auto custom-scrollbar">
                    <BPlenRichTextRenderer
                      text={stage.description || "Faz parte do desenvolvimento contínuo da sua carreira na metodologia BPlen."}
                      variant="small"
                      themeAdaptive={true}
                    />
                  </div>
                </div>

                {/* Direita: workflow de entrega (fonte única = product.workflow) */}
                {hasDelivery && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)] flex items-center gap-2">
                      <LucideIcons.MapPin size={12} className="text-[var(--accent-start)]" />
                      Workflow de entrega
                    </h4>
                    <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                      {workflow ? (
                        workflow.map((step, idx) => (
                          <div
                            key={step.id || idx}
                            className="flex gap-4 p-4 rounded-2xl bg-[var(--input-bg)]/40 border border-[var(--border-primary)] hover:border-[var(--accent-start)]/20 transition-all"
                          >
                            <div
                              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                              style={{ backgroundColor: `${theme.color}15`, color: theme.color, border: `1px solid ${theme.color}30` }}
                            >
                              {idx + 1}
                            </div>
                            <div className="space-y-1 flex-1">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)]">{step.title}</h5>
                              {step.description && (
                                <BPlenRichTextRenderer text={step.description} variant="small" themeAdaptive={true} />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        stage.substeps.map((ss, idx) => (
                          <div
                            key={ss.id}
                            className="flex gap-4 p-4 rounded-2xl bg-[var(--input-bg)]/40 border border-[var(--border-primary)]"
                          >
                            <div
                              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                              style={{ backgroundColor: `${theme.color}15`, color: theme.color, border: `1px solid ${theme.color}30` }}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex items-center flex-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)]">{ss.title}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </GlassModal>

      {/* Modal de Upsell Contextual ✨🧬 */}
      <UpsellServiceModal 
        isOpen={upsellModalOpen}
        onClose={() => setUpsellModalOpen(false)}
        product={upsellProduct}
        loading={upsellLoading}
      />

      {/* Modal de Soberania Metodológica (Trava de Sequência) 🛡️ */}
      <SequenceLockModal 
        isOpen={sequenceLockModalOpen}
        onClose={() => setSequenceLockModalOpen(false)}
        pendingTitles={pendingStageTitles}
      />

      {/* Gate para Não-Membros — mesmo padrão visual (sem foto/upsell) p/ Offboarding e Onboarding */}
      <JourneyGateModal
        isOpen={offboardingLockedModalOpen}
        onClose={() => setOffboardingLockedModalOpen(false)}
        title="Sua Jornada de Membro ainda não começou."
        ctaLabel="Conheça nossos serviços!"
        ctaHref="/servicos/pessoas"
      >
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
          O <strong className="text-[var(--text-primary)]">Offboarding</strong> é a etapa master onde nossos membros consolidam aprendizados, mensuram evolução real e preparam a decolagem para os próximos grandes desafios de suas carreiras.
        </p>
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
          Essa área segue reservada para quem iniciou a Jornada BPlen.
        </p>
      </JourneyGateModal>

      <JourneyGateModal
        isOpen={onboardingLockedModalOpen}
        onClose={() => setOnboardingLockedModalOpen(false)}
        title="Sua Jornada de Membro ainda não começou."
        ctaLabel="Conheça nossos serviços!"
        ctaHref="/servicos/pessoas"
      >
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
          No <strong className="text-[var(--text-primary)]">Onboarding</strong> é onde a sua carreira profissional ganha potência! Para acessar e liberar todo o ecossistema HUB, torne-se um Membro BPlen.
        </p>
      </JourneyGateModal>
    </div>
  );
}

/**
 * Gate reutilizavel para etapas nao-comprais da jornada (Onboarding/Offboarding):
 * icone + titulo + corpo + CTA, sem foto de capa nem checkpoints. Padronizado no
 * GlassModal (overlay/tema/z canonicos).
 */
function JourneyGateModal({ isOpen, onClose, title, children, ctaLabel, ctaHref }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="relative flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
          aria-label="Fechar"
        >
          <LucideIcons.X size={20} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center mb-6 border border-[var(--accent-start)]/20">
          <LucideIcons.Lock size={28} />
        </div>

        <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-4">
          {title}
        </h3>

        <div className="space-y-4 mb-8">
          {children}
        </div>

        <Link
          href={ctaHref}
          className="w-full py-4 rounded-xl bg-[var(--accent-start)] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] shadow-[0_0_20px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-2 group/btn"
        >
          {ctaLabel}
          <LucideIcons.ChevronRight size={16} className="group-hover/btn:translate-x-1 duration-300" />
        </Link>
      </div>
    </GlassModal>
  );
}
