"use server";

import { Resend } from "resend";
import { getAdminAuth } from "@/lib/firebase-admin";
import { serverEnv, clientEnv } from "@/env";
import { buildEmailLayout, EMAIL_STYLES } from "@/lib/emails/email-layout";
import { sanitizeReturnTo, normalizeEmail } from "@/lib/auth/identity-guards";

/**
 * BPlen HUB — Magic link (login sem senha).
 *
 * Gera o link de acesso pelo Admin SDK (`generateSignInWithEmailLink`) e envia
 * pelo Resend com o Padrao de E-mail BPlen V01 — mantendo marca e entregabilidade
 * (secao 4 do plano). A verificacao real acontece so quando o usuario clica o
 * link e o cliente completa com `signInWithEmailLink`, que valida o codigo. Nao
 * ha concessao de sessao aqui — enviar o link a um e-mail apenas permite que quem
 * controla aquela caixa entre COMO aquele e-mail, sem violar o invariante de
 * identidade (o e-mail acaba verificado pelo proprio fluxo).
 *
 * Pre-requisito de console (Gestora): habilitar "Email link (passwordless)" no
 * Firebase Auth e incluir o dominio de producao nos dominios autorizados.
 */

const resend = new Resend(serverEnv.RESEND_API_KEY);

// Formato de e-mail suficiente para o gate; a verificacao real e a posse da caixa.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
}

export async function requestMagicLink(
  rawEmail: string,
  returnTo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = normalizeEmail(rawEmail ?? "");
    if (!EMAIL_RE.test(email)) {
      return { success: false, error: "Informe um e-mail valido." };
    }

    const safeReturnTo = sanitizeReturnTo(returnTo);
    const continueUrl = `${getBaseUrl()}/entrar/verificar?returnTo=${encodeURIComponent(safeReturnTo)}`;

    // O link carrega o oobCode; o cliente completa e valida em /entrar/verificar.
    const link = await getAdminAuth().generateSignInWithEmailLink(email, {
      url: continueUrl,
      handleCodeInApp: true,
    });

    const content = `
      <p style="${EMAIL_STYLES.eyebrow}">ACESSO</p>
      <h2 style="${EMAIL_STYLES.h2}">Seu link de acesso a BPlen HUB</h2>
      <p style="${EMAIL_STYLES.p}">Recebemos um pedido de acesso a BPlen HUB com este e-mail. Clique no botao abaixo para entrar com seguranca, sem senha.</p>
      <div style="text-align: left;">
        <a href="${link}" style="${EMAIL_STYLES.button}">Entrar na BPlen HUB</a>
      </div>
      <p style="${EMAIL_STYLES.p}">Este link e pessoal e temporario. Se voce nao pediu este acesso, pode ignorar esta mensagem com seguranca — nada acontece sem o clique.</p>
    `;

    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: email,
      subject: "Seu link de acesso a BPlen HUB",
      html: buildEmailLayout(content, "BPlen HUB - Desenvolvimento Humano", { eyebrow: "ACESSO" }),
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[auth-magic-link] Falha ao gerar/enviar link de acesso:", message);
    return { success: false, error: "Não foi possível enviar o link agora. Tente novamente." };
  }
}
