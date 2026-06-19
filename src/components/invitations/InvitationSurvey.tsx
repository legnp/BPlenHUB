"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  X, 
  Mail, 
  AlertCircle,
  Sparkles
} from "lucide-react";
import { BPlenLogo } from "@/components/shared/BPlenLogo";
import { NarrativeReveal } from "@/components/ui/NarrativeReveal";
import { cn } from "@/lib/utils";
import { InvitationEvent } from "@/types/invitations";
import { 
  validateInvitationTokenAction, 
  claimInvitationTokenAction, 
  submitInvitationSurveyAction 
} from "@/actions/invitations";

interface InvitationSurveyProps {
  event: InvitationEvent;
}

function InvitationSurveyContent({ event }: InvitationSurveyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInWithGoogle, isLoggingIn: isAuthLoading } = useAuth();

  // Estados de Fluxo
  const [step, setStep] = useState<
    "token_input" | 
    "auth_login" | 
    "survey_step_1" | 
    "survey_step_2_a" | 
    "survey_step_2_b" | 
    "survey_step_3" | 
    "survey_step_4" | 
    "survey_sub_nao" | 
    "survey_sub_talvez" | 
    "ending_a" | 
    "ending_b" | 
    "ending_c"
  >("token_input");

  // Dados do Fluxo
  const [token, setToken] = useState("");
  const [matricula, setMatricula] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Respostas da Survey
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  // Seleções específicas
  const [selectedStars, setSelectedStars] = useState(0);
  const [openText, setOpenText] = useState("");
  const [specialComment, setSpecialComment] = useState("");
  const [suggestedDate, setSuggestedDates] = useState<string[]>([]);

  // Timer para redirecionamento
  const [countdown, setCountdown] = useState(5);

  // Controle de digitação sequencial por etapas
  const [typingPhase, setTypingPhase] = useState(0);

  // Reseta a fase de digitação sempre que mudar de etapa
  useEffect(() => {
    setTypingPhase(0);
  }, [step]);

  // 1. Efeito para carregar token da URL automaticamente
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      autoValidateToken(urlToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 2. Efeito para redirecionamento automático nas telas de encerramento
  useEffect(() => {
    if (step === "ending_a" || step === "ending_b" || step === "ending_c") {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push("https://bplen.com/home");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, router]);

  // Função para validar token vindo da URL sem fricção
  const autoValidateToken = async (tokenVal: string) => {
    setIsActionLoading(true);
    setError(null);
    try {
      const res = await validateInvitationTokenAction(tokenVal, event.slug);
      if (res.success) {
        // Se o usuário já estiver logado, fazemos o claim automático!
        if (user) {
          const claimRes = await claimInvitationTokenAction(
            tokenVal,
            event.slug,
            user.uid,
            user.email || "",
            user.displayName || "Membro BPlen"
          );
          if (claimRes.success) {
            setMatricula(claimRes.matricula || "");
            setNickname(claimRes.nickname || "");
            setStep("survey_step_1");
          } else {
            setStep("auth_login");
          }
        } else {
          setStep("auth_login");
        }
      } else {
        setError(res.error || "Token invalido.");
      }
    } catch {
      setError("Falha de conexao ao validar o token.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Função para validar token digitado manualmente no modal
  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await validateInvitationTokenAction(token, event.slug);
      if (res.success) {
        setIsTokenModalOpen(false);
        if (user) {
          const claimRes = await claimInvitationTokenAction(
            token,
            event.slug,
            user.uid,
            user.email || "",
            user.displayName || "Membro BPlen"
          );
          if (claimRes.success) {
            setMatricula(claimRes.matricula || "");
            setNickname(claimRes.nickname || "");
            setStep("survey_step_1");
          } else {
            setStep("auth_login");
          }
        } else {
          setStep("auth_login");
        }
      } else {
        setError(res.error || "Token invalido.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de validação.";
      setError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Login com Google integrado e claim do Token
  const handleGoogleLogin = async () => {
    setError(null);
    setIsActionLoading(true);
    try {
      const authUser = await signInWithGoogle();
      if (authUser) {
        const claimRes = await claimInvitationTokenAction(
          token,
          event.slug,
          authUser.uid,
          authUser.email || "",
          authUser.displayName || "Membro BPlen"
        );
        if (claimRes.success) {
          setMatricula(claimRes.matricula || "");
          setNickname(claimRes.nickname || "");
          setStep("survey_step_1");
        } else {
          setError(claimRes.error || "Falha ao vincular o convite.");
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Autenticação cancelada ou com falha.";
      setError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Salvar respostas e ir para o próximo passo
  const handleSaveStepAnswer = async (key: string, value: string | number, nextStep: typeof step) => {
    const updatedAnswers = { ...answers, [key]: value };
    setAnswers(updatedAnswers);
    setStep(nextStep);
  };

  // Salvar a pergunta aberta (Passo 3)
  const handleStep3Submit = () => {
    if (!openText.trim()) return;
    handleSaveStepAnswer("next_objective", openText, "survey_step_4");
  };

  // Enviar a pesquisa finalizada para o servidor
  const handleFinalSubmit = async (finalRsvp: "com_certeza" | "talvez" | "nao", extraData?: Record<string, string | number>) => {
    setIsActionLoading(true);
    try {
      const finalAnswers = {
        ...answers,
        rsvp: finalRsvp,
        ...extraData
      };

      const res = await submitInvitationSurveyAction(token, event.slug, finalAnswers, matricula);
      if (res.success) {
        if (finalRsvp === "com_certeza") {
          setStep("ending_c");
        } else if (finalRsvp === "talvez" && extraData?.allow_followup === "claro") {
          setStep("ending_b");
        } else {
          setStep("ending_a");
        }
      } else {
        setError("Ocorreu um erro ao salvar suas respostas. Tente novamente.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar a confirmacao.";
      setError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Formatar data do evento para exibição
  const getEventDateText = () => {
    const daysOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const d = new Date(event.date + "T12:00:00");
    const day = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const dayOfWeek = daysOfWeek[d.getDay()];
    const prepDia = (dayOfWeek.includes("segunda") || dayOfWeek.includes("terça") || dayOfWeek.includes("quarta") || dayOfWeek.includes("quinta") || dayOfWeek.includes("sexta")) ? "uma" : "um";
    
    return {
      formatted: `${day} de ${monthName} de ${year}`,
      dayOfWeek,
      prepDia
    };
  };

  const dateText = getEventDateText();
  const preposition = (event.name.toLowerCase().includes("inauguracao") || event.name.toLowerCase().includes("inauguração")) ? "a nossa" : "o nosso";
  const pronomDem = (event.name.toLowerCase().includes("inauguracao") || event.name.toLowerCase().includes("inauguração")) ? "essa pré-inauguração" : "esse evento";

  return (
    <div className="theme-dark min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-4 selection:bg-[#ff2c8d] selection:text-white font-sans relative overflow-hidden">
      
      {/* 🔮 Background Glow Elements (Aura Premium) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff0080] rounded-full blur-[150px] opacity-[0.08] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-[0.05] pointer-events-none z-0" />

      {/* Logo no topo para TODAS as etapas (incluindo a de entrada, garantindo branding oficial constante) */}
      <div className="absolute top-6 left-6 flex items-center gap-1 z-10">
        <BPlenLogo size={28} variant="hub" />
      </div>

      <div className={cn("w-full z-10 relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", step === "token_input" ? "max-w-4xl" : "max-w-xl")}>
        <AnimatePresence mode="wait">

          {/* ───────────────────────────────────────────
              TELA 1: ENTRADA / HERO PRINCIPAL BPLEN
              ─────────────────────────────────────────── */}
          {step === "token_input" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center px-4"
            >
              <span className="font-extrabold text-xs tracking-[0.25em] uppercase text-[#ff2c8d] mb-6 block">
                Convite Exclusivo
              </span>
              
              <button 
                onClick={() => setIsTokenModalOpen(true)}
                className="group flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-[1.02] mx-auto select-none mb-8"
                aria-label="Clique aqui para descomplicar o desenvolvimento humano no trabalho"
              >
                <span className="text-[var(--text-muted)] text-xs tracking-widest lowercase mb-1 group-hover:text-[var(--text-primary)] transition-colors">
                  clique aqui para
                </span>
                <span className="text-white text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight block -mb-2 z-10">
                  descomplicar o
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0080] via-[#c026d3] to-[#7928ca] bg-[size:200%_auto] animate-gradient-flow text-5xl md:text-7xl lg:text-[6.5rem] font-black tracking-tighter leading-[0.85] z-20 pb-2">
                  desenvolvimento
                </span>
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#c026d3] via-[#ff0080] to-[#7928ca] bg-[size:200%_auto] animate-gradient-flow text-5xl md:text-7xl lg:text-[6.5rem] font-black tracking-tighter leading-[0.85] -mt-1 md:-mt-3 z-30 pb-2"
                  style={{ animationDelay: "2s" }}
                >
                  humano
                </span>
                <span className="text-[var(--text-secondary)] text-xl md:text-2xl font-medium tracking-tight mt-1 group-hover:text-[var(--text-primary)] transition-colors">
                  no trabalho
                </span>
              </button>

              <p className="text-sm text-gray-400 font-light mb-12 max-w-sm mx-auto tracking-wide">
                Você foi convidado para a <strong className="text-white font-semibold">{event.name}</strong>. Participe da nossa confirmação premium.
              </p>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setIsTokenModalOpen(true)}
                  disabled={isActionLoading}
                  className="px-8 py-3.5 rounded-full font-semibold text-xs tracking-wider uppercase bg-white text-[#1d1d1f] hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_4px_24px_rgba(255,255,255,0.08)] flex items-center gap-2 group disabled:opacity-50"
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      Acessar Convite
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                
                {error && (
                  <p className="text-xs font-medium text-red-400 bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-full mt-4">
                    {error}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              TELA 2: AUTENTICAÇÃO GOOGLE MODAL PERSONALIZADO
              ─────────────────────────────────────────── */}
          {step === "auth_login" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 rounded-3xl text-center glass border border-[rgba(255,255,255,0.1)] relative"
              style={{
                background: "rgba(15, 15, 15, 0.75)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-5 h-5 text-[#ff2c8d]" />
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-2">Conexão Segura BPlen HUB</h2>
              <p className="text-sm text-gray-400 font-light mb-8 max-w-sm mx-auto leading-relaxed">
                Para autenticar seu convite único e associá-lo com segurança ao seu cadastro, conecte-se com sua conta Google.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={isActionLoading || isAuthLoading}
                className="w-full max-w-xs mx-auto py-3 px-6 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {isActionLoading || isAuthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Mail className="w-4 h-4 text-black" />
                )}
                <span>Conectar com Google</span>
              </button>

              {error && (
                <div className="flex items-center gap-2 justify-center text-xs font-medium text-red-400 bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-xl mt-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              PASSO 1: CONHECIA A BPLEN?
              ─────────────────────────────────────────── */}
          {step === "survey_step_1" && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              <NarrativeReveal 
                text={`Olá ${nickname}!`} 
                variant="h2" 
                className="mb-4"
                onComplete={() => setTypingPhase(1)} 
                speed={30} 
                active={step === "survey_step_1"}
              />
              
              {typingPhase >= 1 && (
                <div className="text-base text-gray-300 font-light mb-8 space-y-4 leading-relaxed">
                  <NarrativeReveal 
                    text={`Ficamos muito felizes em te receber por aqui...\n\ne mais empolgados ainda em te convidar para ${preposition} **${event.name}**!`} 
                    variant="p" 
                    onComplete={() => setTypingPhase(2)} 
                    speed={20} 
                    active={step === "survey_step_1"}
                  />
                </div>
              )}

              {typingPhase >= 2 && (
                <NarrativeReveal 
                  text="Antes de te apresentar mais detalhes do evento, a Lis já te contou um pouco sobre a BPlen?" 
                  variant="p" 
                  className="!text-gray-400 mb-8"
                  onComplete={() => setTypingPhase(3)} 
                  speed={15} 
                  active={step === "survey_step_1"}
                />
              )}

              {typingPhase >= 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-2 gap-4 mt-8"
                >
                  <button
                    onClick={() => handleSaveStepAnswer("knows_bplen", "sim", "survey_step_2_b")}
                    className="py-4 rounded-2xl font-semibold text-sm transition-all border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-center active:scale-95"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => handleSaveStepAnswer("knows_bplen", "nao", "survey_step_2_a")}
                    className="py-4 rounded-2xl font-semibold text-sm transition-all border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-center active:scale-95"
                  >
                    Não
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              PASSO 2.A: EXPLICATIVA + ESTRELAS (NÃO CONHECIA)
              ─────────────────────────────────────────── */}
          {step === "survey_step_2_a" && (
            <motion.div
              key="step2a"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                <NarrativeReveal 
                  text={`${nickname}, a BPlen nasceu para ampliar o acesso aos recursos e métodos de Desenvolvimento Humano no Trabalho de forma sólida, consistente e sustentável.`} 
                  variant="p" 
                  onComplete={() => setTypingPhase(1)} 
                  speed={15} 
                  active={step === "survey_step_2_a"}
                />

                {typingPhase >= 1 && (
                  <NarrativeReveal 
                    text="Além de promover como construir uma carreira de sucesso alinhada ao próprio perfil comportamental e objetivos situacionais, a BPlen visa mediar espaços de Networking de qualidade, contribuir para boas práticas psicológicas e desmistificar 2 crenças:" 
                    variant="p" 
                    onComplete={() => setTypingPhase(2)} 
                    speed={15} 
                    active={step === "survey_step_2_a"}
                  />
                )}

                {typingPhase >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3"
                  >
                    <NarrativeReveal 
                      text="**1ª** - Que o mercado de trabalho é complexo e só tem sucesso quem **se limita a replicar fórmulas prontas**." 
                      variant="p" 
                      className="text-xs !text-gray-400"
                      onComplete={() => setTypingPhase(3)}
                      speed={15}
                      active={step === "survey_step_2_a"}
                    />
                    {typingPhase >= 3 && (
                      <NarrativeReveal 
                        text="**2ª** - Que a tecnologia substituirá o trabalho humano." 
                        variant="p" 
                        className="text-xs !text-gray-400"
                        onComplete={() => setTypingPhase(4)}
                        speed={15}
                        active={step === "survey_step_2_a"}
                      />
                    )}
                  </motion.div>
                )}

                {typingPhase >= 4 && (
                  <NarrativeReveal 
                    text="... e o resto da história a Lis te contará na pré-inauguração!" 
                    variant="p" 
                    onComplete={() => setTypingPhase(5)} 
                    speed={15} 
                    active={step === "survey_step_2_a"}
                  />
                )}

                {typingPhase >= 5 && (
                  <NarrativeReveal 
                    text={`Mas ${nickname}, conta para a gente: o quanto hoje você sente que a sua carreira profissional te possibilita desfrutar o melhor que a sua rotina diária proporciona?`} 
                    variant="p" 
                    className="!text-gray-400 font-normal pt-2"
                    onComplete={() => setTypingPhase(6)} 
                    speed={15} 
                    active={step === "survey_step_2_a"}
                  />
                )}

                {/* Componente Estrelas */}
                {typingPhase >= 6 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 justify-center py-4"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          setSelectedStars(star);
                          handleSaveStepAnswer("career_rating", star, "survey_step_3");
                        }}
                        onMouseEnter={() => setSelectedStars(star)}
                        onMouseLeave={() => setSelectedStars(0)}
                        className="transition-transform hover:scale-125 duration-150 active:scale-95 p-1"
                      >
                        <Star 
                          className={`w-8 h-8 transition-colors duration-150 ${
                            star <= (selectedStars || 0) 
                              ? "fill-[#ff2c8d] text-[#ff2c8d]" 
                              : "text-gray-600 hover:text-gray-400"
                          }`} 
                        />
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              PASSO 2.B: ESTRELAS (JÁ CONHECIA)
              ─────────────────────────────────────────── */}
          {step === "survey_step_2_b" && (
            <motion.div
              key="step2b"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              <NarrativeReveal 
                text={`${nickname}, então você já sabe que não poderia faltar a nossa curiosidade sobre o seu contexto profissional...`} 
                variant="p"
                className="text-base text-gray-300 font-light mb-4 leading-relaxed"
                onComplete={() => setTypingPhase(1)}
                speed={20}
                active={step === "survey_step_2_b"}
              />
              
              {typingPhase >= 1 && (
                <NarrativeReveal 
                  text="Então conta para a gente: o quanto hoje você sente que a sua carreira profissional te possibilita desfrutar o melhor que a sua rotina diária te proporciona?" 
                  variant="p"
                  className="text-sm text-gray-400 mb-8 leading-relaxed"
                  onComplete={() => setTypingPhase(2)}
                  speed={20}
                  active={step === "survey_step_2_b"}
                />
              )}

              {/* Componente Estrelas */}
              {typingPhase >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3 justify-center py-6"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        setSelectedStars(star);
                        handleSaveStepAnswer("career_rating", star, "survey_step_3");
                      }}
                      onMouseEnter={() => setSelectedStars(star)}
                      onMouseLeave={() => setSelectedStars(0)}
                      className="transition-transform hover:scale-125 duration-150 active:scale-95 p-1"
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors duration-150 ${
                          star <= (selectedStars || 0) 
                            ? "fill-[#ff2c8d] text-[#ff2c8d]" 
                            : "text-gray-600 hover:text-gray-400"
                        }`} 
                      />
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              PASSO 3: OBJETIVO PROFISSIONAL
              ─────────────────────────────────────────── */}
          {step === "survey_step_3" && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              <NarrativeReveal 
                text="Sua Jornada" 
                variant="p"
                className="text-sm text-gray-400 tracking-wider uppercase mb-3 font-semibold"
                onComplete={() => setTypingPhase(1)}
                speed={30}
                active={step === "survey_step_3"}
              />
              
              {typingPhase >= 1 && (
                <NarrativeReveal 
                  text="Em uma única frase, descreva: quando você chegar no seu próximo objetivo profissional, o que estará te esperando ao final da jornada?" 
                  variant="h2"
                  className="text-xl sm:text-2xl font-bold tracking-tight mb-8 leading-snug"
                  onComplete={() => setTypingPhase(2)}
                  speed={20}
                  active={step === "survey_step_3"}
                />
              )}

              {typingPhase >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <textarea
                    value={openText}
                    onChange={(e) => setOpenText(e.target.value)}
                    placeholder="Escreva sua frase aqui..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2c8d] focus:ring-1 focus:ring-[#ff2c8d] transition-all resize-none font-light leading-relaxed"
                  />

                  <button
                    onClick={handleStep3Submit}
                    disabled={!openText.trim()}
                    className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    <span>Avançar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              PASSO 4: RSVP FINAL
              ─────────────────────────────────────────── */}
          {step === "survey_step_4" && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              <NarrativeReveal 
                text="É isso, e só isso! No evento podemos falar mais!" 
                variant="p"
                className="text-sm text-gray-400 mb-2 leading-relaxed"
                onComplete={() => setTypingPhase(1)}
                speed={25}
                active={step === "survey_step_4"}
              />
              
              {typingPhase >= 1 && (
                <NarrativeReveal 
                  text={`${nickname}, ${pronomDem} será ${event.specificMessage || "intimista com convidados especiais"}, e contamos com você!`} 
                  variant="p"
                  className="text-base text-gray-300 font-light mb-8 leading-relaxed"
                  onComplete={() => setTypingPhase(2)}
                  speed={20}
                  active={step === "survey_step_4"}
                />
              )}

              {typingPhase >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-[#ff2c8d] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">Data e Dia</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {dateText.formatted}, será {dateText.prepDia} {dateText.dayOfWeek}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#ff2c8d] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">Horário</p>
                        <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#ff2c8d] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">Localização</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{event.location}</p>
                      </div>
                    </div>
                  </div>

                  <NarrativeReveal 
                    text="Podemos contar com a sua participação?" 
                    variant="p"
                    className="text-sm font-medium text-white mb-6"
                    onComplete={() => setTypingPhase(3)}
                    speed={20}
                    active={step === "survey_step_4"}
                  />
                </motion.div>
              )}

              {typingPhase >= 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <button
                    onClick={() => handleFinalSubmit("com_certeza")}
                    disabled={isActionLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase text-center bg-white text-black hover:bg-gray-100 transition-all active:scale-[0.98]"
                  >
                    Com certeza
                  </button>
                  <button
                    onClick={() => handleSaveStepAnswer("rsvp", "talvez", "survey_sub_talvez")}
                    disabled={isActionLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-center border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
                  >
                    Não tenho certeza
                  </button>
                  <button
                    onClick={() => handleSaveStepAnswer("rsvp", "nao", "survey_sub_nao")}
                    disabled={isActionLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-center border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
                  >
                    Não poderei
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              SUB-FLUXO: NÃO PODEREI -> CONVITE FUTURO
              ─────────────────────────────────────────── */}
          {step === "survey_sub_nao" && (
            <motion.div
              key="sub_nao"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              <NarrativeReveal 
                text="Você gostaria que te convidassemos para uma próxima oportunidade?" 
                variant="h2"
                className="text-xl sm:text-2xl font-bold tracking-tight mb-8 leading-snug"
                onComplete={() => setTypingPhase(1)}
                speed={20}
                active={step === "survey_sub_nao"}
              />

              {typingPhase >= 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <button
                    onClick={() => {
                      // Sim -> Oferece seleção de datas
                      setAnswers(prev => ({ ...prev, future_invite: "sim" }));
                      setStep("survey_sub_talvez"); // Reutiliza layout para dar as 3 sugestões
                    }}
                    className="w-full py-4 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-center transition-all"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => {
                      // Não -> Encerramento A
                      handleFinalSubmit("nao", { future_invite: "nao" });
                    }}
                    className="w-full py-4 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-center transition-all"
                  >
                    Não
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              SUB-FLUXO: NÃO TENHO CERTEZA (PÓS-RSVP) ou SUGERIR DATAS
              ─────────────────────────────────────────── */}
          {step === "survey_sub_talvez" && (
            <motion.div
              key="sub_talvez"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 text-left"
            >
              {/* Condicional 1: Se veio do Não Poderei + Quer convite futuro, dá 3 sugestões de datas */}
              {answers.future_invite === "sim" ? (
                <>
                  <NarrativeReveal 
                    text="Escolha de preferência" 
                    variant="h2"
                    className="text-xl sm:text-2xl font-bold tracking-tight mb-4 leading-snug"
                    onComplete={() => setTypingPhase(1)}
                    speed={20}
                    active={step === "survey_sub_talvez"}
                  />

                  {typingPhase >= 1 && (
                    <NarrativeReveal 
                      text="Selecione uma ou mais sugestões de períodos ideais para organizarmos as próximas oportunidades exclusivas:" 
                      variant="p"
                      className="text-sm text-gray-400 mb-8 leading-relaxed"
                      onComplete={() => setTypingPhase(2)}
                      speed={15}
                      active={step === "survey_sub_talvez"}
                    />
                  )}

                  {typingPhase >= 2 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex flex-col gap-3 mb-8">
                        {[
                          "Quinta-feira, 16 de Julho de 2026, as 19:00",
                          "Quinta-feira, 30 de Julho de 2026, as 19:00",
                          "Quinta-feira, 13 de Agosto de 2026, as 19:00"
                        ].map((opt) => {
                          const isSelected = suggestedDate.includes(opt);
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                if (isSelected) {
                                  setSuggestedDates(prev => prev.filter(x => x !== opt));
                                } else {
                                  setSuggestedDates(prev => [...prev, opt]);
                                }
                              }}
                              className={`p-4 rounded-2xl text-left text-xs font-medium border transition-all ${
                                isSelected 
                                  ? "border-[#ff2c8d] bg-[#ff2c8d]/5 text-white" 
                                  : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          const datesJoined = suggestedDate.length > 0 ? suggestedDate.join(" | ") : "Nenhuma preferida";
                          handleFinalSubmit("nao", { future_invite: "sim", suggested_dates: datesJoined });
                        }}
                        disabled={isActionLoading}
                        className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase text-center bg-white text-black hover:bg-gray-100 transition-all"
                      >
                        Confirmar Sugestoes
                      </button>
                    </motion.div>
                  )}
                </>
              ) : (
                /* Condicional 2: Se veio do Não Tenho Certeza do RSVP */
                <>
                  <NarrativeReveal 
                    text="Tudo bem, não se preocupe. Alguns dias antes entraremos em contato com você para verificar a sua disponibilidade, tudo bem?" 
                    variant="h2"
                    className="text-xl sm:text-2xl font-bold tracking-tight mb-8 leading-snug"
                    onComplete={() => setTypingPhase(1)}
                    speed={20}
                    active={step === "survey_sub_talvez"}
                  />

                  {typingPhase >= 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-3"
                    >
                      <button
                        onClick={() => handleFinalSubmit("talvez", { allow_followup: "claro" })}
                        disabled={isActionLoading}
                        className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase text-center bg-white text-black hover:bg-gray-100 transition-all"
                      >
                        Claro!
                      </button>
                      <button
                        onClick={() => handleFinalSubmit("nao", { allow_followup: "melhor_nao" })}
                        disabled={isActionLoading}
                        className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-center border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                      >
                        Melhor não
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              TELA DE ENCERRAMENTO A: REDIRECIONAMENTO RÁPIDO
              ─────────────────────────────────────────── */}
          {step === "ending_a" && (
            <motion.div
              key="endinga"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl text-center glass border border-white/10"
              style={{
                background: "rgba(15, 15, 15, 0.75)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-6 h-6 text-gray-400" />
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-4">
                {nickname}, maravilha!
              </h2>
              <p className="text-sm text-gray-400 font-light leading-relaxed mb-8">
                Te agradecemos até aqui, e esperamos te encontrar em algum outro momento! Até mais!
              </p>

              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="bg-gray-400 h-full"
                />
              </div>

              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-4">
                Redirecionando em {countdown} segundos
              </p>

              <button
                onClick={() => router.push("https://bplen.com/home")}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 transition-all"
              >
                Concluir agora
              </button>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              TELA DE ENCERRAMENTO B: REDIRECIONAMENTO COM EMAIL PROMETIDO
              ─────────────────────────────────────────── */}
          {step === "ending_b" && (
            <motion.div
              key="endingb"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl text-center glass border border-white/10"
              style={{
                background: "rgba(15, 15, 15, 0.75)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-12 h-12 bg-[#ff2c8d]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-5 h-5 text-[#ff2c8d]" />
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-4">
                {nickname}, maravilha!
              </h2>
              <p className="text-sm text-gray-400 font-light leading-relaxed mb-8">
                Ficamos na expectativa da sua presença! Te enviaremos um e-mail com as informações desse convite, para que fique no seu radar! Até mais!
              </p>

              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="bg-[#ff2c8d] h-full"
                />
              </div>

              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-4">
                Redirecionando em {countdown} segundos
              </p>

              <button
                onClick={() => router.push("https://bplen.com/home")}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-[#ff2c8d] text-white hover:bg-[#ff006e] transition-all"
              >
                Concluir agora
              </button>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────
              TELA DE ENCERRAMENTO C: COMENTÁRIOS E EMAIL CONFIRMADO
              ─────────────────────────────────────────── */}
          {step === "ending_c" && (
            <motion.div
              key="endingc"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl text-center glass border border-white/10"
              style={{
                background: "rgba(15, 15, 15, 0.75)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-12 h-12 bg-[#ff2c8d]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-6 h-6 text-[#ff2c8d]" />
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-3">
                {nickname}, maravilha!!!
              </h2>
              <p className="text-sm text-gray-300 font-light leading-relaxed mb-6">
                A sua presença será incrível! As informações do convite serão enviadas para o seu e-mail para você adicionar em sua agenda!
              </p>

              <p className="text-xs text-gray-400 font-normal text-left mb-3">
                Você gostaria de deixar algum comentário ou fazer algum pedido especial para o evento? (Opcional)
              </p>

              <textarea
                value={specialComment}
                onChange={(e) => setSpecialComment(e.target.value)}
                placeholder="Digite aqui..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2c8d] focus:ring-1 focus:ring-[#ff2c8d] transition-all resize-none mb-6 font-light leading-normal"
              />

              <div className="flex flex-col gap-4">
                <button
                  onClick={async () => {
                    setIsActionLoading(true);
                    try {
                      // Submeter o comentário final se preenchido
                      if (specialComment.trim()) {
                        await submitInvitationSurveyAction(token, event.slug, { ...answers, comment: specialComment }, matricula);
                      }
                      router.push("https://bplen.com/home");
                    } catch {
                      router.push("https://bplen.com/home");
                    }
                  }}
                  disabled={isActionLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase text-center bg-white text-black hover:bg-gray-100 transition-all"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black mx-auto" />
                  ) : specialComment.trim() ? (
                    "Concluir"
                  ) : (
                    "Não"
                  )}
                </button>

                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
                  Salvando automaticamente em {countdown}s
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ───────────────────────────────────────────
          MODAL FLUTUANTE DE DIGITAÇÃO DE TOKEN (MANUAL)
          ─────────────────────────────────────────── */}
      <AnimatePresence>
        {setIsTokenModalOpen && isTokenModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl p-6 relative border border-white/10"
              style={{
                background: "rgba(20, 20, 20, 0.95)",
              }}
            >
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-white mb-2 pr-6">Token de Acesso Unico</h3>
              <p className="text-xs text-gray-400 font-light mb-6 leading-relaxed">
                Digite o token exclusivo que pode ser encontrado logo abaixo do QR Code do convite para prosseguir.
              </p>

              <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Ex: BPL-INV-XXXX"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs tracking-widest font-mono text-center text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2c8d] focus:ring-1 focus:ring-[#ff2c8d] transition-all uppercase"
                />

                <button
                  type="submit"
                  disabled={isActionLoading || !token.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <span>Validar Convite</span>
                  )}
                </button>
              </form>

              {error && (
                <div className="flex items-center gap-2 text-[11px] font-medium text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-xl mt-4">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrapper em Suspense para atender ao next/navigation useSearchParams Best Practices
export function InvitationSurvey({ event }: InvitationSurveyProps) {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff2c8d]" />
        </div>
      }
    >
      <InvitationSurveyContent event={event} />
    </Suspense>
  );
}
