import { Resend } from "resend";
import { serverEnv, clientEnv } from "@/env";
import { buildSoberanaEmail, EMAIL_STYLES } from "./emails/soberana-layout";

const resend = new Resend(serverEnv.RESEND_API_KEY);

interface AttendeeEmailDetails {
  name: string;
  email: string;
}

/**
 * 📧 E-mail de Notificação de Presença
 * Remetente: hub@bplen.com
 */
export async function sendAttendanceRegisteredEmail(user: AttendeeEmailDetails, eventTitle: string) {
  try {
    if (!user.email) {
      console.warn("⚠️ [E-mail] Não foi possível enviar e-mail de presença: e-mail do usuário não informado.");
      return;
    }

    const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
    
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: user.email,
      subject: `Presença confirmada: ${eventTitle}`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Sua presença foi registrada.</h2>
        <p style="${EMAIL_STYLES.p}">
          Olá, <strong>${user.name || "Membro"}</strong>.
        </p>
        <p style="${EMAIL_STYLES.p}">
          Confirmamos o registro de sua presença no evento <strong>${eventTitle}</strong>.
        </p>
        <p style="${EMAIL_STYLES.p}">
          A ata do evento, os materiais de apoio e os detalhes completos da reunião já estão disponíveis na sua área exclusiva no BPlen HUB.
        </p>
        <a href="${baseUrl}/hub/membro" style="${EMAIL_STYLES.button}">
          Acessar BPlen HUB
        </a>
        <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
          Se tiver alguma dúvida sobre o conteúdo do evento, entre em contato com seu mentor ou consultor através do portal.
        </p>
      `, "Equipe BPlen HUB")
    });
    console.log(`✉️ [E-mail] "Presença Registrada" enviado para ${user.email}`);
  } catch (error) {
    console.error("❌ ERRO ao enviar e-mail de presença:", error);
  }
}

/**
 * 📧 E-mail de Notificação de Ausência (Falta)
 * Remetente: hub@bplen.com
 */
export async function sendAbsenceRegisteredEmail(user: AttendeeEmailDetails, eventTitle: string) {
  try {
    if (!user.email) {
      console.warn("⚠️ [E-mail] Não foi possível enviar e-mail de falta: e-mail do usuário não informado.");
      return;
    }

    const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
    
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: user.email,
      subject: `Registro de ausência: ${eventTitle}`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Sua ausência foi registrada.</h2>
        <p style="${EMAIL_STYLES.p}">
          Olá, <strong>${user.name || "Membro"}</strong>.
        </p>
        <p style="${EMAIL_STYLES.p}">
          Registramos sua ausência no evento <strong>${eventTitle}</strong>.
        </p>
        <p style="${EMAIL_STYLES.p}">
          Como a presença regular é fundamental para o seu desenvolvimento e o cumprimento dos marcos do programa, recomendamos que entre em contato direto com o atendimento BPlen para verificar alternativas de reposição ou alinhamento.
        </p>
        <a href="https://wa.me/5511999999999" style="${EMAIL_STYLES.buttonDanger || EMAIL_STYLES.button}">
          Falar com Atendimento
        </a>
        <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
          Caso prefira, você também pode abrir um ticket de suporte diretamente no portal BPlen HUB.
        </p>
      `, "Equipe BPlen HUB")
    });
    console.log(`✉️ [E-mail] "Falta Registrada" enviado para ${user.email}`);
  } catch (error) {
    console.error("❌ ERRO ao enviar e-mail de falta:", error);
  }
}
