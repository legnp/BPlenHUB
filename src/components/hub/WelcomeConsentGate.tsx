"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { ParticleNexus } from "@/components/home/ParticleNexus";
import { isAdult } from "@/lib/consent/consent";
import { recordConsentAction } from "@/actions/consent";
import styles from "@/app/entrar/entrar.module.css";

/**
 * BPlen HUB — Gate de Boas-vindas (consentimento — Fase 2).
 * Primeiro acesso, logo apos o login: aceite de Termos + Privacidade + 18 anos.
 * Herda o universo visual do /entrar (secao 13). E um GATE: sem os aceites
 * obrigatorios, o usuario nao avanca. A data de nascimento e validada antes da
 * declaracao de idade — menor de 18 nao pode prosseguir.
 */
export function WelcomeConsentGate({
  onDone,
  initialBirthDate = "",
}: {
  onDone: () => void;
  initialBirthDate?: string;
}) {
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [terms, setTerms] = useState(false);
  const [over18, setOver18] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ageOk = useMemo(() => isAdult(birthDate, new Date()), [birthDate]);
  const showAgeError = birthDate.length === 10 && !ageOk;
  const canContinue = terms && over18 && ageOk && !submitting;

  async function handleContinue() {
    if (!canContinue) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await recordConsentAction({ birthDate, newsletterOptIn: newsletter });
      if (res.success) {
        onDone();
      } else {
        setError(res.error || "Nao foi possivel registrar o aceite agora.");
      }
    } catch {
      setError("Nao foi possivel registrar o aceite agora.");
    } finally {
      setSubmitting(false);
    }
  }

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
          <p className={styles.eyebrow}>PRIMEIRO ACESSO</p>
          <h1>
            Que bom ter você <span className={styles.nb}>por aqui.</span>
          </h1>
          <p>Antes de começar, precisamos de alguns aceites rápidos para a sua segurança.</p>
        </section>

        <section className={styles.authWrap}>
          <div className={`${styles.card} ${styles.cardWide}`}>
            <h2>Boas-vindas à BPlen HUB</h2>
            <p className={styles.sub}>Confirme os itens abaixo para continuar.</p>

            <div className={styles.consentField}>
              <label className={styles.fld} htmlFor="birthDate">
                Data de nascimento
              </label>
              <input
                className={styles.input}
                id="birthDate"
                type="date"
                value={birthDate}
                max="9999-12-31"
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  if (!isAdult(e.target.value, new Date())) setOver18(false);
                }}
              />
              {showAgeError && (
                <p className={styles.ageError}>
                  É necessário ter 18 anos ou mais para usar a BPlen HUB.
                </p>
              )}
            </div>

            <div className={styles.consentList}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span className={styles.checkBox}>
                  <CheckIcon />
                </span>
                <span className={styles.checkLabel}>
                  Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a{" "}
                  <a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
                  <span className={styles.req}>*</span>
                </span>
              </label>

              <label className={`${styles.checkRow} ${!ageOk ? styles.disabled : ""}`}>
                <input
                  type="checkbox"
                  checked={over18}
                  disabled={!ageOk}
                  onChange={(e) => setOver18(e.target.checked)}
                />
                <span className={styles.checkBox}>
                  <CheckIcon />
                </span>
                <span className={styles.checkLabel}>
                  Declaro ser maior de 18 anos.
                  <span className={styles.req}>*</span>
                </span>
              </label>

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <span className={styles.checkBox}>
                  <CheckIcon />
                </span>
                <span className={styles.checkLabel}>
                  Quero receber novidades e conteúdos da BPlen (opcional).
                </span>
              </label>
            </div>

            <button
              className={`${styles.primary} ${styles.consentContinue}`}
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              {submitting ? "Registrando..." : "Continuar"}
            </button>

            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
