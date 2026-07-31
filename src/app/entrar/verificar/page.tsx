"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { finalizeClientSession } from "@/lib/auth/finalize-session";
import { sanitizeReturnTo } from "@/lib/auth/identity-guards";
import styles from "../entrar.module.css";

/**
 * BPlen HUB — Conclusao do magic link (/entrar/verificar).
 * O usuario chega aqui pelo link do e-mail. Validamos o codigo com
 * `signInWithEmailLink` (a verificacao real da posse do e-mail), cunhamos a sessao
 * segura e seguimos para o destino (`returnTo` sanitizado). Se o e-mail nao estiver
 * no armazenamento local (link aberto em outro dispositivo), pedimos a confirmacao.
 */

const EMAIL_STORAGE_KEY = "bplen_email_for_signin";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = "verificando" | "pedir_email" | "erro";

function VerificarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("verificando");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const complete = useCallback(
    async (useEmail: string) => {
      setBusy(true);
      try {
        const result = await signInWithEmailLink(auth, useEmail, window.location.href);
        window.localStorage.removeItem(EMAIL_STORAGE_KEY);
        await finalizeClientSession(result.user, "entrar_magic_link");
        router.replace(sanitizeReturnTo(searchParams.get("returnTo")));
      } catch {
        setErrorMsg("Link inválido ou expirado. Peça um novo link de acesso.");
        setPhase("erro");
      } finally {
        setBusy(false);
      }
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setErrorMsg("Este link não é válido. Peça um novo link de acesso.");
      setPhase("erro");
      return;
    }
    const stored = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (stored) {
      void complete(stored);
    } else {
      setPhase("pedir_email");
    }
  }, [complete]);

  return (
    <div className={`${styles.page} theme-dark`}>
      <div className={`${styles.glow} ${styles.glowA}`} />
      <div className={`${styles.glow} ${styles.glowB}`} />
      <div className={styles.gridLines} />

      <div className={styles.statusWrap}>
        <div className={styles.statusCard}>
          {phase === "verificando" && (
            <>
              <div className={styles.spinner} />
              <h1>Entrando com segurança</h1>
              <p>Confirmando seu link de acesso. Isso leva só um instante.</p>
            </>
          )}

          {phase === "pedir_email" && (
            <>
              <h1>Confirme seu e-mail</h1>
              <p>Para concluir o acesso com segurança, digite o e-mail que recebeu o link.</p>
              <div style={{ maxWidth: 300, margin: "20px auto 0", textAlign: "left" }}>
                <label className={styles.fld} htmlFor="confirm-email">
                  E-mail
                </label>
                <input
                  className={styles.input}
                  id="confirm-email"
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && EMAIL_RE.test(email.trim()) && !busy) {
                      void complete(email.trim().toLowerCase());
                    }
                  }}
                />
                <button
                  className={styles.primary}
                  type="button"
                  disabled={!EMAIL_RE.test(email.trim()) || busy}
                  onClick={() => void complete(email.trim().toLowerCase())}
                >
                  {busy ? "Entrando..." : "Concluir acesso"}
                </button>
              </div>
            </>
          )}

          {phase === "erro" && (
            <>
              <h1>Não foi possível entrar</h1>
              <p>{errorMsg}</p>
              <div style={{ marginTop: 20 }}>
                <a className={styles.support} href="/entrar">
                  <span>Voltar para o login</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={null}>
      <VerificarInner />
    </Suspense>
  );
}
