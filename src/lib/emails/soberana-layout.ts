/**
 * BPlen HUB — Soberana v3.1 Email Engine (📧💎)
 * Motor central de renderização de e-mails, garantindo governança de design
 * system, uso de aliases e tipografia alinhada em todas as notificações transacionais.
 */

// Tokens de Design Soberana v3.1 (E-mail)
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
    padding: 32px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    text-align: left;
  `,
  h2: `
    font-size: 20px;
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
    background-color: #1D1D1F;
    color: #FFFFFF;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 20px 0;
  `,
  buttonDanger: `
    display: inline-block;
    background-color: #ef4444;
    color: #FFFFFF;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 20px 0;
  `,
  footer: `
    margin-top: 40px;
    text-align: center;
    font-size: 11px;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  `
};

export const LOGO_HTML = `
  <div style="margin-bottom: 32px; text-align: left;">
    <span style="font-size: 18px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
      BPlen <span style="color: #ff2c8d;">HUB</span>
    </span>
  </div>
`;

/**
 * Monta o layout centralizado do Soberana v3.1 para e-mails.
 */
export function buildSoberanaEmail(contentHtml: string, footerText: string = "BPlen - Inteligência e Estratégia") {
  return `
    <div style="${EMAIL_STYLES.container}">
      ${LOGO_HTML}
      <div style="${EMAIL_STYLES.card}">
        ${contentHtml}
      </div>
      <div style="${EMAIL_STYLES.footer}">
        ${footerText}
      </div>
    </div>
  `;
}
