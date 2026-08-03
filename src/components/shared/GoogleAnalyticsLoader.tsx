"use client";

import React, { useState, useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { COOKIE_CONSENT_EVENT, readStoredCookieChoice } from "@/lib/consent/cookie-consent";

/**
 * BPlen HUB — Google Analytics Loader (Condicional) 📈🛡️
 * Este componente atua como um Gatekeeper. Ele só renderiza o script do GA4
 * se o usuário tiver dado consentimento explícito via CookieBanner.
 */

// Chave e evento vem de `lib/consent/cookie-consent.ts`: eram literais repetidos
// aqui e no banner, e divergir entre os dois quebraria o gate em silencio.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalyticsLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      // Solo carregamos se o consentimento for "all"
      setShouldLoad(readStoredCookieChoice() === "all" && !!GA_ID);
    };

    // 1. Verificação inicial (ao carregar o app)
    checkConsent();

    // 2. Escutar atualizações de consentimento (disparadas pelo CookieConsent.tsx)
    window.addEventListener(COOKIE_CONSENT_EVENT, checkConsent);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, checkConsent);
    };
  }, []);

  // Se não houver ID ou o consentimento for negado, não injetamos nad
  if (!shouldLoad || !GA_ID) {
    return null;
  }

  return <GoogleAnalytics gaId={GA_ID} />;
}
