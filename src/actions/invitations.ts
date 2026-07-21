"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import { serverEnv } from "@/env";
import { InvitationEvent, InvitationToken } from "@/types/invitations";
import { buildSoberanaEmail, EMAIL_STYLES } from "@/lib/emails/soberana-layout";
import { getServerSession } from "@/lib/server-session";

const resend = new Resend(serverEnv.RESEND_API_KEY);

/**
 * Helper to serialize Firestore data to safe JSON-serializable types for Next.js.
 */
function serializeDoc<T>(docSnap: admin.firestore.DocumentSnapshot): T | null {
  if (!docSnap.exists) return null;
  const data = docSnap.data();
  if (!data) return null;

  return JSON.parse(
    JSON.stringify({
      id: docSnap.id,
      ...data,
    }, (key, value) => {
      if (value && typeof value === "object" && (value.seconds !== undefined || value._seconds !== undefined)) {
        const seconds = value.seconds ?? value._seconds;
        return new Date(seconds * 1000).toISOString();
      }
      return value;
    })
  ) as T;
}

/**
 * Gera o conteudo do arquivo iCalendar (.ics) nativamente com compensacao de fuso horario de Brasilia (UTC-3).
 */
function generateIcsContent(event: { name: string; date: string; time: string; location: string; description: string }): string {
  try {
    const [year, month, day] = event.date.split("-").map(Number);
    const [hours, minutes] = event.time.split(":").map(Number);

    // Date.UTC interpreta os valores em UTC. Como Brasilia eh UTC-3, 
    // somamos 3 horas em milissegundos para obter o horario UTC equivalente correto.
    const startUtcMs = Date.UTC(year, month - 1, day, hours, minutes);
    const startDate = new Date(startUtcMs + 3 * 60 * 60 * 1000); 
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 horas de duracao por padrao

    const toIcsFormat = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const sanitize = (str: string) => str.replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n");

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BPlen HUB//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${event.date.replace(/-/g, "")}@bplen.com`,
      `DTSTAMP:${toIcsFormat(new Date())}`,
      "ORGANIZER;CN=BPlen HUB:MAILTO:hub@bplen.com",
      `DTSTART:${toIcsFormat(startDate)}`,
      `DTEND:${toIcsFormat(endDate)}`,
      `SUMMARY:${sanitize(event.name)}`,
      `DESCRIPTION:${sanitize(event.description)}`,
      `LOCATION:${sanitize(event.location)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  } catch (error) {
    console.error("[generateIcsContent] Erro ao gerar ICS:", error);
    return "";
  }
}

/**
 * 1. Busca e valida a existência do evento de convite.
 */
export async function getInvitationEventAction(slug: string): Promise<{ success: boolean; data?: InvitationEvent; error?: string }> {
  try {
    const db = getAdminDb();
    const eventRef = db.collection("Invitation_Events").doc(slug);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return { success: false, error: "Evento nao encontrado." };
    }

    const data = serializeDoc<InvitationEvent>(eventSnap);
    if (!data) {
      return { success: false, error: "Falha ao serializar dados do evento." };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[getInvitationEventAction] Erro para o slug ${slug}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 2. Valida se o token existe, está ativo e pertence ao evento correto.
 */
export async function validateInvitationTokenAction(
  token: string,
  eventSlug: string
): Promise<{ success: boolean; tokenData?: InvitationToken; error?: string }> {
  try {
    const db = getAdminDb();
    const normalizedToken = token.trim().toUpperCase();
    const tokenRef = db.collection("Invitation_Tokens").doc(normalizedToken);
    const tokenSnap = await tokenRef.get();

    if (!tokenSnap.exists) {
      return { success: false, error: "Token invalido." };
    }

    const tokenData = serializeDoc<InvitationToken>(tokenSnap);
    if (!tokenData) {
      return { success: false, error: "Falha ao carregar dados do token." };
    }

    if (tokenData.eventSlug !== eventSlug) {
      return { success: false, error: "Este token nao pertence a este evento." };
    }

    if (tokenData.status !== "unused") {
      return { success: false, error: "Este convite ja foi utilizado por outro participante." };
    }

    return { success: true, tokenData };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[validateInvitationTokenAction] Erro para token ${token}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 3. Associa o token ao usuário, realiza o claim e provisiona a matrícula caso não exista.
 * Transação atômica e extremamente segura contra concorrência e condições de corrida.
 */
export async function claimInvitationTokenAction(
  token: string,
  eventSlug: string,
  userUid: string,
  userEmail: string,
  authName: string
): Promise<{ success: boolean; matricula?: string; nickname?: string; error?: string }> {
  try {
    const db = getAdminDb();
    const normalizedToken = token.trim().toUpperCase();
    const emailLower = userEmail.trim().toLowerCase();

    // Referências dos documentos
    const tokenRef = db.collection("Invitation_Tokens").doc(normalizedToken);
    const authMapRef = db.collection("_AuthMap").doc(userUid);
    const counterRef = db.doc("_internal/counters/user/global");

    let finalMatricula = "";
    let finalNickname = authName.split(" ")[0] || "Membro BPlen";

    // Executamos tudo em uma transação atômica
    await db.runTransaction(async (transaction) => {
      // A. Verificar Token novamente
      const tokenSnap = await transaction.get(tokenRef);
      if (!tokenSnap.exists) {
        throw new Error("Token de acesso nao encontrado.");
      }
      const tokenData = tokenSnap.data();
      if (tokenData?.eventSlug !== eventSlug) {
        throw new Error("O token fornecido pertence a outro evento.");
      }
      if (tokenData?.status !== "unused") {
        throw new Error("Este convite ja foi utilizado.");
      }

      // B. Resolver ou criar Matrícula do usuário
      const authMapSnap = await transaction.get(authMapRef);
      
      if (authMapSnap.exists && authMapSnap.data()?.matricula) {
        // Usuário já possui matrícula existente no AuthMap
        finalMatricula = authMapSnap.data()?.matricula;
        
        // Puxar apelido do usuário
        const userRef = db.collection("User").doc(finalMatricula);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists) {
          finalNickname = userSnap.data()?.User_Nickname || userSnap.data()?.Authentication_Name?.split(" ")[0] || finalNickname;
        }
      } else {
        // Buscar se já existe usuário por email no Firestore (Prevenção de duplicados)
        const usersEmailQuery = await db.collection("User").where("email", "==", emailLower).limit(1).get();
        
        if (!usersEmailQuery.empty) {
          // Usuário existe na coleção User, apenas vinculamos seu AuthMap
          finalMatricula = usersEmailQuery.docs[0].id;
          const userData = usersEmailQuery.docs[0].data();
          finalNickname = userData?.User_Nickname || userData?.Authentication_Name?.split(" ")[0] || finalNickname;

          transaction.set(authMapRef, {
            matricula: finalMatricula,
            email: emailLower,
            linkedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } else {
          // Usuário novo absoluto: Criar matrícula sequencial com trava atômica
          const counterSnap = await transaction.get(counterRef);
          const count = (counterSnap.data()?.count || 0) + 1;
          
          transaction.set(counterRef, {
            count,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          const seq = count.toString().padStart(3, "0");
          const aammdd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
          finalMatricula = `BP-${seq}-PF-${aammdd}`;

          // Grava mapeamento AuthMap
          transaction.set(authMapRef, {
            matricula: finalMatricula,
            email: emailLower,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Cria perfil básico do Usuário (sem marcar hasCompletedWelcome para não estragar onboarding)
          const userRef = db.collection("User").doc(finalMatricula);
          transaction.set(userRef, {
            uid: userUid,
            email: emailLower,
            Authentication_Name: authName,
            User_Nickname: finalNickname,
            User_Type: "PF",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
          });

          // Cria documento de permissões de acesso
          const permissionsRef = db.doc(`User/${finalMatricula}/User_Permissions/access`);
          transaction.set(permissionsRef, {
            role: "member",
            services: {
              hub_community: false,
              survey_welcome: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      // C. Reivindicar o Token (Claim)
      transaction.update(tokenRef, {
        status: "claimed",
        claimedBy: finalMatricula,
        claimedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[claimInvitationTokenAction] Token ${normalizedToken} reivindicado por ${finalMatricula} (${finalNickname})`);
    return { success: true, matricula: finalMatricula, nickname: finalNickname };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[claimInvitationTokenAction] Erro para token ${token}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 4. Submete as respostas da survey e aciona os e-mails transacionais.
 *
 * BUG-108: a identidade vem da SESSAO VERIFICADA (idToken -> getServerSession),
 * nunca de uma matricula recebida do cliente. O token e a autorizacao DESTE
 * convite e precisa ter sido reivindicado pela mesma pessoa da sessao — sem isso,
 * um chamador escrevia respostas na subcolecao privada de qualquer membro so
 * informando a matricula (mesmo padrao de identidade do BUG-032/106).
 */
export async function submitInvitationSurveyAction(
  token: string,
  eventSlug: string,
  answers: Record<string, string | number>,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // A. Identidade comprovada pela sessao (nunca por parametro do cliente).
    const session = await getServerSession(idToken);
    if (!session || !session.matricula) {
      return { success: false, error: "Sessao invalida. Faca login novamente." };
    }
    const matricula = session.matricula;

    const db = getAdminDb();
    const normalizedToken = token.trim().toUpperCase();

    // B. O token e a autorizacao deste convite: tem de existir, ser deste evento
    //    e ter sido reivindicado por ESTA pessoa (claimedBy === matricula da sessao).
    const tokenSnap = await db.collection("Invitation_Tokens").doc(normalizedToken).get();
    if (!tokenSnap.exists) {
      return { success: false, error: "Token invalido." };
    }
    const tokenData = tokenSnap.data();
    if (tokenData?.eventSlug !== eventSlug) {
      return { success: false, error: "Este token nao pertence a este evento." };
    }
    if (tokenData?.status !== "claimed" || tokenData?.claimedBy !== matricula) {
      return { success: false, error: "Este convite nao esta vinculado a sua conta." };
    }

    // C. Gravar as respostas na subcolecao da matricula VERIFICADA.
    const surveyRef = db.doc(`User/${matricula}/Surveys/invitation_${eventSlug}`);
    await surveyRef.set({
      surveyId: `invitation_${eventSlug}`,
      token: normalizedToken,
      matricula,
      status: "completed",
      data: answers,
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // D. Disparar e-mails apenas se o RSVP tiver status de resposta
    const rsvpStatus = answers.rsvp as string;
    if (rsvpStatus === "com_certeza" || rsvpStatus === "talvez") {
      await sendInvitationRsvpEmails(matricula, eventSlug, answers);
    } else if (rsvpStatus === "nao" && answers.future_invite === "sim") {
      // Dispara e-mail de notificação para futuras datas
      await sendInvitationRsvpEmails(matricula, eventSlug, answers);
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[submitInvitationSurveyAction] Erro no evento ${eventSlug}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 5. Envia os e-mails em formato Soberana v3.1 (Dual Dispatch: Usuário + BPlen Notificação)
 *
 * BUG-108: helper INTERNO (sem `export`) — deixou de ser endpoint de rede. Quando
 * exportada, aceitava `matricula` do cliente e era um vetor de disparo de e-mail em
 * nome de qualquer membro. Agora so o proprio `submitInvitationSurveyAction` a
 * chama, com a matricula ja verificada pela sessao.
 */
async function sendInvitationRsvpEmails(
  matricula: string,
  eventSlug: string,
  answers: Record<string, string | number>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();

    // A. Buscar dados do Evento
    const eventSnap = await db.collection("Invitation_Events").doc(eventSlug).get();
    if (!eventSnap.exists) {
      throw new Error("Evento nao cadastrado para disparos de e-mail.");
    }
    const eventData = eventSnap.data() as InvitationEvent;

    // B. Buscar dados do Usuário (Nickname & Email)
    const userSnap = await db.collection("User").doc(matricula).get();
    if (!userSnap.exists) {
      throw new Error("Usuario invalido para disparos.");
    }
    const uData = userSnap.data() || {};
    const nickname = uData.User_Nickname || uData.User_Welcome?.User_Nickname || uData.Authentication_Name || uData.User_Name || "Membro BPlen";
    const userEmail = uData.email || uData.User_Email || "";

    if (!userEmail) {
      console.warn(`[sendInvitationRsvpEmailsAction] Usuario ${matricula} nao possui e-mail cadastrado.`);
      return { success: false, error: "E-mail do usuario nao encontrado." };
    }

    // Formatadores de data para visualização elegante
    // Data ex: "2026-06-25" -> "25 de junho de 2026"
    const months = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const [year, month, day] = eventData.date.split("-");
    const dateFormatted = `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;

    const rsvpStatus = answers.rsvp as string;
    const comment = (answers.comment as string) || "Nenhum comentario ou pedido especial.";

    // ──────────────────────────────
    // DISPARO 1: E-MAIL PARA O CONVIDADO
    // ──────────────────────────────
    let guestSubject = `Confirmacao de Presenca: ${eventData.name}`;
    let guestContent = "";
    let attachments: { filename: string; content: Buffer; contentType: string }[] | undefined = undefined;

    if (rsvpStatus === "com_certeza") {
      guestContent = `
        <h2 style="${EMAIL_STYLES.h2}">Presenca Confirmada!</h2>
        <p style="${EMAIL_STYLES.p}">Olá ${nickname},</p>
        <p style="${EMAIL_STYLES.p}">Sua presença na <strong>${eventData.name}</strong> está oficialmente confirmada e sua vaga garantida!</p>
        <p style="${EMAIL_STYLES.p}">Estamos preparando uma experiência única e exclusiva no ambiente BPlen, focada em conexões reais e desenvolvimento consistente.</p>
        
        <div style="margin: 24px 0; padding: 20px; background-color: #F9FAFB; border-radius: 12px; border-left: 4px solid #ff2c8d;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #1D1D1F;"><strong>Detalhes do Evento:</strong></p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Data: ${dateFormatted}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Horário: ${eventData.time}</p>
          <p style="margin: 0; font-size: 13px; color: #3F3F46;">Local: ${eventData.location}</p>
        </div>
        
        <p style="${EMAIL_STYLES.p}">Seus comentários e pedidos especiais já foram encaminhados à nossa equipe organizadora.</p>
        <p style="${EMAIL_STYLES.p}">Nos vemos em breve! Até lá!</p>
      `;

      const icsString = generateIcsContent({
        name: eventData.name,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        description: eventData.description || "Seu convite exclusivo BPlen HUB."
      });

      if (icsString) {
        attachments = [
          {
            filename: "agenda-bplen.ics",
            content: Buffer.from(icsString),
            contentType: "text/calendar"
          }
        ];
      }
    } else if (rsvpStatus === "talvez") {
      guestSubject = `Agendamento de Contato: ${eventData.name}`;
      guestContent = `
        <h2 style="${EMAIL_STYLES.h2}">Presenca Pendente</h2>
        <p style="${EMAIL_STYLES.p}">Olá ${nickname},</p>
        <p style="${EMAIL_STYLES.p}">Entendemos perfeitamente que imprevistos acontecem ou que sua agenda pode estar concorrida.</p>
        <p style="${EMAIL_STYLES.p}">Deixamos seu convite reservado temporariamente. Conforme combinado, alguns dias antes do evento entraremos em contato direto para verificar sua disponibilidade.</p>
        
        <div style="margin: 24px 0; padding: 20px; background-color: #F9FAFB; border-radius: 12px; border-left: 4px solid #9CA3AF;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #1D1D1F;"><strong>Informacoes do Evento:</strong></p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Data: ${dateFormatted}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Horário: ${eventData.time}</p>
          <p style="margin: 0; font-size: 13px; color: #3F3F46;">Local: ${eventData.location}</p>
        </div>
        
        <p style="${EMAIL_STYLES.p}">Se precisar confirmar antes, basta entrar em contato conosco.</p>
        <p style="${EMAIL_STYLES.p}">Até logo!</p>
      `;
    } else {
      guestSubject = `Oportunidades Futuras: BPlen`;
      guestContent = `
        <h2 style="${EMAIL_STYLES.h2}">Obrigado pelo seu retorno</h2>
        <p style="${EMAIL_STYLES.p}">Olá ${nickname},</p>
        <p style="${EMAIL_STYLES.p}">Agradecemos por nos informar que não poderá participar da <strong>${eventData.name}</strong> desta vez.</p>
        <p style="${EMAIL_STYLES.p}">Como você demonstrou interesse em oportunidades futuras, manteremos seu contato priorizado para os próximos encontros exclusivos que realizarmos.</p>
        <p style="${EMAIL_STYLES.p}">Desejamos muito sucesso na sua rotina e esperamos nos encontrar em breve!</p>
      `;
    }

    const guestEmailBody = buildSoberanaEmail(guestContent, "BPlen HUB - Desenvolvimento Humano");
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: userEmail,
      subject: guestSubject,
      html: guestEmailBody,
      ...(attachments ? { attachments } : {})
    });

    // ──────────────────────────────
    // DISPARO 2: E-MAIL DE NOTIFICAÇÃO BPLEN
    // ──────────────────────────────
    const staffSubject = `Novo RSVP: ${eventData.name} - ${nickname}`;
    const staffContent = `
      <h2 style="${EMAIL_STYLES.h2}">Novo Feedback de Convite Recebido</h2>
      <p style="${EMAIL_STYLES.p}">Resumo das interações do convidado no sistema:</p>
      
      <div style="margin: 20px 0; padding: 20px; background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #1D1D1F;"><strong>Dados do Convidado:</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Nome/Nickname: ${nickname}</p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">E-mail: ${userEmail}</p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Matrícula: ${matricula}</p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #3F3F46;">ID Evento: ${eventSlug}</p>
        
        <p style="margin: 12px 0 8px 0; font-size: 14px; color: #1D1D1F;"><strong>Respostas do Roteiro:</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Conhecia a BPlen? ${answers.knows_bplen === "sim" ? "Sim" : "Não"}</p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Nota Carreira (1-5): ${answers.career_rating || "N/A"}</p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #3F3F46;">Próximo Objetivo: "${answers.next_objective || "N/A"}"</p>
        
        <p style="margin: 12px 0 4px 0; font-size: 14px; color: #1D1D1F;"><strong>RSVP Final:</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Participará? <strong>${rsvpStatus === "com_certeza" ? "Sim, com certeza!" : rsvpStatus === "talvez" ? "Não tenho certeza (Entrar em contato)" : "Não poderei"}</strong></p>
        ${rsvpStatus === "nao" ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Quer próximos convites? ${answers.future_invite === "sim" ? "Sim" : "Não"}</p>` : ""}
        ${rsvpStatus === "nao" && answers.future_invite === "sim" ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Sugestões de datas de preferência: ${answers.suggested_dates || "N/A"}</p>` : ""}
        ${rsvpStatus === "talvez" ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #3F3F46;">Permite contato posterior? ${answers.allow_followup === "claro" ? "Sim, Claro!" : "Melhor nao"}</p>` : ""}
        
        <p style="margin: 16px 0 4px 0; font-size: 14px; color: #1D1D1F;"><strong>Comentário / Pedido Especial:</strong></p>
        <p style="margin: 0; font-size: 13px; color: #3F3F46; font-style: italic;">"${comment}"</p>
      </div>
    `;

    const staffEmailBody = buildSoberanaEmail(staffContent, "BPlen HUB - Central de Notificacoes");
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: "notificacao@bplen.com",
      subject: staffSubject,
      html: staffEmailBody,
    });

    console.log(`[sendInvitationRsvpEmailsAction] E-mails de RSVP enviados com sucesso para ${userEmail} e notificacao@bplen.com.`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[sendInvitationRsvpEmailsAction] Falha crítica de envio:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

