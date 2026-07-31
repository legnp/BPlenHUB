"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type LoginProviderId } from "@/hooks/use-auth";
import { useAuthContext } from "@/context/AuthContext";
import { ParticleNexus } from "@/components/home/ParticleNexus";
import { sanitizeReturnTo } from "@/lib/auth/identity-guards";
import { requestMagicLink } from "@/actions/auth-magic-link";
import styles from "./entrar.module.css";

/**
 * BPlen HUB — Tela de login (/entrar). Superficie canonica de autenticacao.
 * Design aprovado (secao 13). Google + Microsoft + magic link, com retorno a
 * origem unificado (`returnTo`, sanitizado). Fundo com o ParticleNexus real.
 */

const EMAIL_STORAGE_KEY = "bplen_email_for_signin";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EntrarClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const safeReturnTo = useMemo(() => sanitizeReturnTo(returnTo), [returnTo]);
  const { user } = useAuthContext();
  const {
    signInWith,
    isLoggingIn,
    error,
    pendingLink,
    completePendingLink,
    cancelPendingLink,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [view, setView] = useState<"form" | "sent">("form");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());

  // Usuario ja autenticado que cai em /entrar segue direto ao destino.
  useEffect(() => {
    if (user) router.replace(safeReturnTo);
  }, [user, safeReturnTo, router]);

  async function handleProvider(providerId: LoginProviderId) {
    const logged = await signInWith(providerId, { origin: "entrar_page" });
    if (logged) {
      router.push(safeReturnTo);
      router.refresh();
    }
  }

  async function handleCompleteLink() {
    const logged = await completePendingLink("entrar_page");
    if (logged) {
      router.push(safeReturnTo);
      router.refresh();
    }
  }

  async function handleSendMagicLink() {
    if (!emailValid || sending) return;
    setSending(true);
    setSendError(null);
    try {
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
      const res = await requestMagicLink(email.trim(), safeReturnTo);
      if (res.success) {
        setView("sent");
      } else {
        setSendError(res.error || "Não foi possível enviar o link agora.");
      }
    } catch {
      setSendError("Não foi possível enviar o link agora.");
    } finally {
      setSending(false);
    }
  }

  const busy = isLoggingIn || sending;

  return (
    <div className={`${styles.page} theme-dark`}>
      <div className={`${styles.glow} ${styles.glowA}`} />
      <div className={`${styles.glow} ${styles.glowB}`} />
      <div className={styles.gridLines} />
      <ParticleNexus />

      <header className={styles.topbar}>
        <span className={styles.logo}>
          <Image
            src="/logo_bplen/logo-branco.png"
            alt="BPlen HUB"
            width={62}
            height={25}
            className={styles.logoImg}
            priority
          />
        </span>
        <a
          className={styles.support}
          href="https://wa.me/5511945152088"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.18.84 5.71 2.37a8.02 8.02 0 0 1 2.37 5.71c0 4.46-3.63 8.09-8.09 8.09a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.11.82.83-3.03-.2-.31a8.03 8.03 0 0 1-1.26-4.35c0-4.46 3.63-8.09 8.09-8.09Zm4.66 10.2c-.25-.13-1.5-.74-1.73-.82-.23-.08-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.29.19-.54.06-.25-.13-1.07-.39-2.04-1.26-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.37-.78-1.87-.2-.49-.41-.42-.57-.43l-.48-.01c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.03 2.6.13.17 1.77 2.7 4.3 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.5-.61 1.71-1.2.21-.59.21-1.1.15-1.2-.06-.11-.23-.17-.48-.29Z" />
          </svg>
          <span className={styles.supportLabel}>Suporte</span>
        </a>
      </header>

      <main className={styles.stage}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>BPLEN HUB</p>
          <h1>
            Te damos as <span className={styles.em}>boas-vindas</span>{" "}
            <span className={styles.nb}>à BPlen HUB.</span>
          </h1>
          <p>Sua jornada de desenvolvimento de carreira começa aqui.</p>
        </section>

        <section className={styles.authWrap}>
          <div className={styles.card}>
            {pendingLink ? (
              <div className={styles.linkPanel}>
                <h2>Vincular seu acesso</h2>
                <p className={styles.sub}>Uma conta com este e-mail já existe.</p>
                <p>
                  Já existe uma conta BPlen para <b>{pendingLink.email || "este e-mail"}</b> com
                  outro meio de acesso. Entre pelo método original para vincular os dois e passar a
                  usar qualquer um deles.
                </p>
                <button
                  className={styles.primary}
                  type="button"
                  onClick={handleCompleteLink}
                  disabled={busy}
                >
                  {busy ? "Vinculando..." : "Entrar e vincular"}
                </button>
                <div className={styles.linkActions}>
                  <button type="button" onClick={cancelPendingLink}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : view === "sent" ? (
              <div className={styles.sent}>
                <div className={styles.check}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
                  </svg>
                </div>
                <h3>Verifique seu e-mail</h3>
                <p>
                  Enviamos um link de acesso para <b>{email.trim() || "seu e-mail"}</b>. Abra seu
                  e-mail para entrar.
                </p>
                <div className={styles.actions}>
                  <button type="button" onClick={handleSendMagicLink} disabled={busy}>
                    Reenviar
                  </button>
                  <span className={styles.sep}>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setView("form");
                      setSendError(null);
                    }}
                  >
                    Usar outro e-mail
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2>Acesse sua conta</h2>
                <p className={styles.sub}>Escolha como deseja entrar.</p>

                <button
                  className={styles.provider}
                  type="button"
                  onClick={() => handleProvider("google.com")}
                  disabled={busy}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 4.9c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 1.5 14.9.5 12 .5 7.3.5 3.3 3.2 1.4 7.1l3.6 2.8C5.9 7 8.7 4.9 12 4.9Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L1.4 7.1C.6 8.6.2 10.3.2 12s.4 3.4 1.2 4.9L5 14.1Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3 0 5.5-1 7.3-2.7l-3.7-2.9c-1 .7-2.3 1.1-3.6 1.1-3.3 0-6.1-2.1-7-5l-3.6 2.8C3.3 20.8 7.3 23.5 12 23.5Z"
                    />
                  </svg>
                  Entrar com Google
                </button>

                <button
                  className={styles.provider}
                  type="button"
                  onClick={() => handleProvider("microsoft.com")}
                  disabled={busy}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                    <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                    <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                    <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
                  </svg>
                  Entrar com Microsoft
                </button>

                <div className={styles.divider}>
                  <span>ou</span>
                </div>

                <label className={styles.fld} htmlFor="email">
                  E-mail
                </label>
                <input
                  className={styles.input}
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && emailValid && !busy) handleSendMagicLink();
                  }}
                />
                <button
                  className={styles.primary}
                  type="button"
                  onClick={handleSendMagicLink}
                  disabled={!emailValid || busy}
                >
                  {sending ? "Enviando..." : "Enviar link de acesso"}
                </button>
                <p className={styles.hint}>
                  Enviaremos um link seguro para você entrar sem senha.
                </p>

                {(sendError || error) && (
                  <p className={styles.errorMsg}>{sendError || error}</p>
                )}

                <p className={styles.fineprint}>
                  Ao continuar, você aceita os <a href="/termos">Termos de Uso</a> e a{" "}
                  <a href="/privacidade">Política de Privacidade</a>.
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
