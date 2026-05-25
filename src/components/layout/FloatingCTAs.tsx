"use client";

import React, { Suspense } from "react";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X, Phone, Globe, LogIn, Loader2 } from "lucide-react";
import { BPlenLogo } from "../shared/BPlenLogo";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

import { ServiceSelectionModal } from "./ServiceSelectionModal";

/**
 * FloatingCTAs — Menu lateral fixo (Top Right / Bottom Right)
 * No Mobile: Transforma-se em um Menu Sanduíche elegante no topo direito.
 * No Desktop: Mantém os CTAs principais no canto inferior direito.
 */
/**
 * Sub-componente para lidar com a lógica de "Autenticação Requerida"
 * Isolado para permitir o uso de Suspense e evitar bail-out de hydration.
 */
function AuthRequiredHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, isLoggingIn, signInWithGoogle, signOut } = useAuth();

  React.useEffect(() => {
    const authStatus = searchParams.get("auth");
    
    if (authStatus === "required" && !loading && !isLoggingIn) {
      if (user) {
        // Cenário: Usuário existe no client mas foi barrado pelo server (sessão stale).
        // Forçamos o logout para limpar o estado e permitir o login fresco no próximo ciclo.
        const resetSession = async () => {
          console.warn("🛡️ [Soberania] Sessão stale detectada. Forçando reset...");
          try {
            await signOut();
          } catch (err) {
            console.error("Erro ao resetar sessão stale:", err);
          }
        };
        resetSession();
      } else {
        // Cenário: Não há usuário. Abrimos o popup de login.
        const triggerAutoLogin = async () => {
          try {
            const loggedUser = await signInWithGoogle();
            if (loggedUser) {
              const returnTo = searchParams.get("returnTo") || "/hub";
              // Aguarda um frame para garantir que os cookies foram escritos pelo navegador
              setTimeout(() => {
                router.push(returnTo);
                router.refresh(); // Força o Next.js a revalidar o middleware
              }, 100);
            }
          } catch (err) {
            console.error("Falha no login automático via query param:", err);
          }
        };
        triggerAutoLogin();
      }
    }
  }, [searchParams, user, loading, isLoggingIn, signInWithGoogle, signOut, router]);

  return null;
}

export function FloatingCTAs() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const { theme } = useTheme();

  // Escutar evento global para abrir o modal de serviços
  React.useEffect(() => {
    const handleOpenModal = () => setIsServiceModalOpen(true);
    window.addEventListener("open-service-modal", handleOpenModal);
    return () => window.removeEventListener("open-service-modal", handleOpenModal);
  }, []);
  
  const isHomePage = pathname === "/";
  const { user, isLoggingIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleServiceModal = () => setIsServiceModalOpen(!isServiceModalOpen);

  const menuVariants = {
    closed: { opacity: 0, x: "100%" },
    open: { opacity: 1, x: 0 }
  };

  // Condicional de contraste: inverter os ícones em todos os modos claros (todos exceto dark/bplen e daltonico/alto contraste)
  const isDarkTheme = theme === "dark" || theme === "daltonico";
  const iconFilterClass = !isDarkTheme ? "invert opacity-70" : "";

  const socialLinks = [
    { 
      icon: <img src="/linkedin.webp" alt="LinkedIn" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, 
      url: "https://www.linkedin.com/in/lisandralencina/", 
      name: "LinkedIn" 
    },
    { 
      icon: <img src="/insta.png" alt="Instagram" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, 
      url: "https://www.instagram.com/lis_lencina", 
      name: "Instagram" 
    },
    { 
      icon: <img src="/whatsapp.png" alt="WhatsApp" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, 
      url: "https://wa.me/5511945152088", 
      name: "WhatsApp" 
    },
    { 
      icon: <img src="/tiktok.png" alt="TikTok" className={`w-5 h-5 object-contain ${iconFilterClass}`} />, 
      url: "https://www.tiktok.com/@lis.lencina", 
      name: "TikTok" 
    }, 
  ];

  return (
    <>
      <Suspense fallback={null}>
        <AuthRequiredHandler />
      </Suspense>

      <ServiceSelectionModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
      />

      {/* 🍔 BOTÃO DO MENU (APENAS MOBILE - TOPO DIREITO) */}
      <div className="fixed top-6 right-6 z-[201] md:hidden">
        <button
          onClick={toggleMenu}
          className="p-[11px] bg-[var(--bg-primary)] border border-[var(--border-primary)] backdrop-blur-xl rounded-2xl text-[var(--accent-start)] shadow-2xl active:scale-95 transition-all"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 🔮 OVERLAY DO MENU MOBILE (FULLSCREEN GLASS) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] md:hidden flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-l border-[var(--glass-border)]"
          >
            <div className="flex-1 flex flex-col justify-center gap-12 mt-10">
              {/* Branding no Menu */}
              <div className="flex items-center gap-3">
                <BPlenLogo variant="main" size={40} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)] px-1">Menu</span>
                <div className="h-px flex-1 bg-[var(--accent-start)] opacity-20" />
              </div>

              {/* Links de Navegação */}
              <nav className="flex flex-col gap-8 items-start">
                {!isHomePage && (
                  <Link href="/" onClick={toggleMenu} className="text-4xl font-black tracking-tighter hover:text-[var(--accent-start)] transition-colors flex items-center gap-4 group">
                    <span className="text-[var(--text-muted)] text-sm group-hover:text-[var(--accent-start)] font-mono">01.</span> Home
                  </Link>
                )}
                <button 
                  onClick={() => {
                    toggleMenu();
                    toggleServiceModal();
                  }} 
                  className="text-4xl font-black tracking-tighter hover:text-[var(--accent-start)] transition-colors flex items-center gap-4 group text-left"
                >
                  <span className="text-[var(--text-muted)] text-sm group-hover:text-[var(--accent-start)] font-mono">02.</span> Serviços
                </button>
                <Link href="/agendar" onClick={toggleMenu} className="text-4xl font-black tracking-tighter hover:text-[var(--accent-start)] transition-colors flex items-center gap-4 group">
                  <span className="text-[var(--text-muted)] text-sm group-hover:text-[var(--accent-start)] font-mono">03.</span> Agendar
                </Link>
                <Link href="/conteudo" onClick={toggleMenu} className="text-4xl font-black tracking-tighter hover:text-[var(--accent-start)] transition-colors flex items-center gap-4 group">
                  <span className="text-[var(--text-muted)] text-sm group-hover:text-[var(--accent-start)] font-mono">04.</span> Conteúdos
                </Link>
              </nav>

              {/* Botão de Destaque HUB */}
              <div className="pt-4">
                {user ? (
                   <Link
                      href="/hub"
                      onClick={toggleMenu}
                      className="w-full block py-[18px] bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-black text-center tracking-[0.2em] text-[10px] shadow-xl shadow-[var(--accent-start)]/20 uppercase"
                   >
                     ACESSAR BPLEN HUB
                   </Link>
                ) : (
                   <button
                      onClick={async () => {
                          try {
                            const loggedUser = await signInWithGoogle();
                            if (loggedUser) {
                              toggleMenu();
                              setTimeout(() => {
                                router.push("/hub");
                                router.refresh();
                              }, 100);
                            }
                          } catch (err) {
                           console.error("Erro ao autenticar via CTA:", err);
                         }
                      }}
                      disabled={isLoggingIn}
                      className="w-full flex items-center justify-center gap-3 py-[18px] bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-black text-center tracking-[0.2em] text-[10px] shadow-xl shadow-[var(--accent-start)]/20 disabled:opacity-50"
                   >
                     {isLoggingIn ? "CONECTANDO..." : "ACESSAR BPLEN HUB"}
                   </button>
                )}
              </div>

              {/* Redes Sociais */}
              <div className="space-y-4 pt-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] px-1">Conecte-se</p>
                <div className="flex gap-4">
                  {socialLinks.map((social, i) => (
                    <Link
                      key={i}
                      href={social.url}
                      target="_blank"
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/30 transition-all flex items-center justify-center"
                    >
                      {social.icon}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé do Menu */}
            <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
              <span>© {new Date().getFullYear()} BPlen Consultoria</span>
              <span>Propulsor Humano</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 LAYOUT DESKTOP (ORIGINAL - HIDDEN ON MOBILE) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
        className="fixed bottom-6 right-6 md:top-8 md:right-8 md:bottom-auto hidden md:flex flex-col items-end gap-2 md:gap-3 z-[100]"
      >
        <AnimatePresence mode="wait">
          {!isHomePage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
            >
              <Link 
                href="/"
                className="w-[126px] md:w-[153px] h-8 md:h-9 px-3 md:px-4 bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-md rounded-xl text-[10px] md:text-xs font-bold tracking-widest text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-all flex items-center justify-center shadow-2xl cursor-pointer gap-2"
              >
                <Home size={14} />
                HOME
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={toggleServiceModal}
          className="w-[126px] md:w-[153px] h-8 md:h-9 px-3 md:px-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl text-[10px] md:text-xs font-normal tracking-wide text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all flex items-center justify-center shadow-lg cursor-pointer"
        >
          Nossos Serviços
        </button>

        <Link 
          href="/agendar"
          className="w-[126px] md:w-[153px] h-8 md:h-9 px-3 md:px-4 bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-md rounded-xl text-[10px] md:text-xs font-normal tracking-wide text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/20 hover:text-[var(--text-primary)] transition-all flex items-center justify-center shadow-lg cursor-pointer"
        >
          Agendar Conversa
        </Link>
        <Link 
          href="/conteudo"
          className="w-[126px] md:w-[153px] h-8 md:h-9 px-3 md:px-4 bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-md rounded-xl text-[10px] md:text-xs font-normal tracking-wide text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/20 hover:text-[var(--text-primary)] transition-all flex items-center justify-center shadow-lg cursor-pointer"
        >
          Explorar Conteúdos
        </Link>
        {user ? (
           <Link 
             href="/hub"
             className="w-[126px] md:w-[153px] h-8 md:h-9 px-3 md:px-4 bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-md rounded-xl text-[10px] md:text-xs font-normal tracking-wide text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/20 hover:text-[var(--text-primary)] transition-all flex items-center justify-center shadow-lg cursor-pointer"
           >
             Acessar BPlen HUB
           </Link>
        ) : (
           <button 
             onClick={async () => {
                 try {
                   const loggedUser = await signInWithGoogle();
                   if (loggedUser) {
                    setTimeout(() => {
                      router.push("/hub");
                      router.refresh();
                    }, 100);
                   }
                 } catch (err) {
                  console.error("Erro ao autenticar via CTA Desktop:", err);
                }
             }}
             disabled={isLoggingIn}
             className="w-[126px] md:w-[153px] h-8 md:h-9 px-3 md:px-4 bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-md rounded-xl text-[10px] md:text-xs font-normal tracking-wide text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/20 hover:text-[var(--text-primary)] transition-all flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-50 gap-2"
           >
             {isLoggingIn ? "Entrando..." : "Acessar BPlen HUB"}
           </button>
        )}
      </motion.div>
    </>
  );
}
