/**
 * BPlen HUB — Padrao de E-mail BPlen V01
 * Motor central de renderizacao de e-mails, garantindo governanca de design
 * system, uso de aliases e tipografia alinhada em todas as notificacoes
 * transacionais. Todos os e-mails transacionais passam por `buildEmailLayout`.
 *
 * V01 (baseline unico): cabecalho com o logotipo real (public/logo_bplen/logo.png),
 * acabamento premium — fita de acento em gradiente no topo do cartao, sombra suave
 * em vez de borda seca, botao primario solido em pilula, rotulo eyebrow por
 * categoria e rodape com divisor + icone + dominio. Cores e tipografia de base
 * (#044159 / #9677D9 / #9558A6) inalteradas.
 *
 * Robustez Outlook: os gradientes (fita de acento e botao de erro) trazem um
 * `background-color` solido ANTES do `background`, para nao renderizarem
 * transparentes em clientes que ignoram `linear-gradient`.
 */

import { clientEnv } from "@/env";

// Tokens de Design — Padrao de E-mail BPlen V01
export const EMAIL_STYLES = {
  container: `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1D1D1F;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px;
    background-color: #F5F7FA;
  `,
  card: `
    background-color: #FFFFFF;
    padding: 36px 32px 32px 32px;
    text-align: left;
  `,
  accentBar: `height: 4px; background-color: #044159; background: linear-gradient(90deg, #9558A6, #9677D9, #044159, #0D0D0D);`,
  accentBarDanger: `height: 4px; background-color: #ef4444; background: linear-gradient(90deg, #ef4444, #f87171);`,
  eyebrow: `
    margin: 0 0 10px 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #044159;
  `,
  eyebrowDanger: `
    margin: 0 0 10px 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ef4444;
  `,
  h2: `
    font-size: 21px;
    font-weight: 700;
    margin-bottom: 24px;
    letter-spacing: -0.02em;
    color: #1D1D1F;
  `,
  p: `
    font-size: 15px;
    line-height: 1.6;
    color: #1D1D1F;
    margin-bottom: 20px;
    opacity: 0.8;
  `,
  button: `
    display: inline-block;
    background-color: #044159;
    color: #FFFFFF;
    text-decoration: none;
    padding: 14px 30px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 20px 0;
    box-shadow: 0 8px 20px -6px rgba(4,65,89,0.45);
  `,
  buttonDanger: `
    display: inline-block;
    background-color: #ef4444;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #FFFFFF;
    text-decoration: none;
    padding: 14px 30px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 20px 0;
    box-shadow: 0 8px 20px -6px rgba(239,68,68,0.45);
  `,
  infoBox: `background: #F8FAFC; padding: 20px; border-radius: 14px; margin: 0 0 28px 0; border: 1px solid rgba(0,0,0,0.04);`,
  dangerBox: `background: #FEF6F6; padding: 20px; border-radius: 14px; margin: 0 0 28px 0; border-left: 3px solid #ef4444;`,
  footer: `
    margin-top: 40px;
    text-align: center;
    font-size: 11px;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  `,
};

function getBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
}

/**
 * Fita de acento (cinta) no topo do cartao. O rotulo textual de categoria foi
 * removido a pedido da Gestora (2026-07-30) — mantem-se apenas a fita. `danger`
 * pinta a fita em vermelho (cancelamento/falha).
 */
function getCardHeaderHtml(danger: boolean = false): string {
  return `
    <div style="${danger ? EMAIL_STYLES.accentBarDanger : EMAIL_STYLES.accentBar}"></div>
  `;
}

/** Cabecalho com o logotipo real (substitui o antigo wordmark de texto). */
function getLogoHtml(): string {
  const baseUrl = getBaseUrl();
  return `
    <div style="margin-bottom: 32px; text-align: left;">
      <img src="${baseUrl}/logo_bplen/logo.png" alt="BPlen" width="140" style="display: block; height: auto; border: 0;" />
    </div>
  `;
}

/** Icone da marca usado no rodape, para fechar o e-mail com a mesma identidade do cabecalho. */
function getFooterIconHtml(): string {
  const baseUrl = getBaseUrl();
  return `<img src="${baseUrl}/logo_bplen/favicon.png" alt="" width="20" style="display: inline-block; opacity: 0.5; margin-bottom: 10px;" />`;
}

/**
 * Monta o layout centralizado do Padrao de E-mail BPlen V01.
 * `eyebrow` (a categoria do e-mail) sinaliza que o cartao leva a fita de acento no
 * topo; sem ele o cartao fica sem fita. O rotulo textual da categoria nao e mais
 * exibido (decisao da Gestora, 2026-07-30). `danger: true` pinta a fita em vermelho.
 */
export function buildEmailLayout(
  contentHtml: string,
  footerText: string = "BPlen - Inteligência e Estratégia",
  options: { eyebrow?: string; danger?: boolean } = {}
) {
  const { eyebrow, danger = false } = options;
  return `
    <div style="${EMAIL_STYLES.container}">
      ${getLogoHtml()}
      <div style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px -24px rgba(29,29,31,0.22), 0 2px 8px rgba(29,29,31,0.04); text-align: left;">
        ${eyebrow ? getCardHeaderHtml(danger) : ""}
        <div style="${EMAIL_STYLES.card}">
          ${contentHtml}
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}">
        <div style="height: 1px; background: rgba(0,0,0,0.06); margin: 0 auto 24px auto; max-width: 80px;"></div>
        ${getFooterIconHtml()}
        <p style="margin: 0 0 4px 0;">${footerText}</p>
        <p style="margin: 0; font-size: 11px; color: #C4C7CE; text-transform: none; letter-spacing: normal;">bplen.com</p>
      </div>
    </div>
  `;
}
