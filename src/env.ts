import { z } from "zod";

/**
 * BPlen HUB — Sensor Zod (Regra de Segurança 🛡️)
 * Valida todas as variáveis de ambiente obrigatórias.
 */

// ──────────────────────────────
// Schema: Variáveis Públicas (Front-end)
// ──────────────────────────────
const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "Firebase API Key é obrigatória"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth Domain é obrigatório"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase Storage Bucket é obrigatório"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "Firebase Messaging Sender ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url("APP_URL deve ser uma URL válida"),
  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: z.string().min(1, "Mercado Pago Public Key é obrigatória"),
});

// ──────────────────────────────
// Normalização de PEM (Private Key) — Versão Final Estabilizada 🛡️
// ──────────────────────────────
function normalizePrivateKey(key: string | undefined): string {
  if (!key) return "";
  
  // Remove aspas no início e no fim, se houver
  let cleaned = key.trim().replace(/^["']|["']$/g, "");

  // Substitui \n literais por quebras de linha reais
  cleaned = cleaned.replace(/\\n/g, "\n");

  // Remove o carriage return do Windows (\r)
  cleaned = cleaned.replace(/\r/g, "");

  // Remove qualquer aspa que tenha ficado no meio do arquivo (erro de formatação)
  cleaned = cleaned.replace(/['"]/g, "");

  // Reconstrói o PEM forçadamente
  const body = cleaned
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, ""); // remove TODOS os espaços e quebras

  const chunks = body.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${chunks.join("\n")}\n-----END PRIVATE KEY-----`;
}

// ──────────────────────────────
// Schema: Variáveis Privadas (Server-side)
// ──────────────────────────────
const serverSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID (server) é obrigatório"),
  FIREBASE_CLIENT_EMAIL: z.string().email("Firebase Client Email deve ser um email válido"),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1, "Firebase Private Key é obrigatória")
    .transform(normalizePrivateKey), // Normalização simplificada pós-Nova Chave
  RESEND_API_KEY: z.string().min(1, "Resend API Key é obrigatória"),
  GOOGLE_DRIVE_ROOT_ID: z.string().min(1, "Google Drive Root ID é obrigatório"),
  GOOGLE_DRIVE_PORTFOLIO_ID: z.string().min(1, "Google Drive Portfolio ID é obrigatório"),
  GOOGLE_DRIVE_USUARIOS_ID: z.string().min(1, "Google Drive Usuarios ID é obrigatório"),
  GOOGLE_DRIVE_ATAS_ID: z.string().min(1, "Google Drive Atas ID é obrigatório"),
  GOOGLE_CALENDAR_ID: z.string().min(1, "Google Calendar ID é obrigatório"),
  GOOGLE_BOOKING_CALENDAR_ID: z.string().min(1, "Google Booking Calendar ID é obrigatório"),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, "Mercado Pago Access Token é obrigatório"),
});

// ──────────────────────────────
// Validação e Exportação
// ──────────────────────────────

function validateEnv<T extends z.ZodRawShape>(schema: z.ZodObject<T>, data: unknown, type: "client" | "server") {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Erro de Configuração (${type}-side):`);
      error.issues.forEach((err) => {
        console.error(`   - Campo: ${err.path.join(".")} | Motivo: ${err.message}`);
      });
    }
    throw error;
  }
}

export const clientEnv = validateEnv(clientSchema, {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
}, "client");

let validatedServerEnv: z.infer<typeof serverSchema> | undefined;

if (typeof window === "undefined") {
  validatedServerEnv = validateEnv(serverSchema, {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GOOGLE_DRIVE_ROOT_ID: process.env.GOOGLE_DRIVE_ROOT_ID,
    GOOGLE_DRIVE_PORTFOLIO_ID: process.env.GOOGLE_DRIVE_PORTFOLIO_ID,
    GOOGLE_DRIVE_USUARIOS_ID: process.env.GOOGLE_DRIVE_USUARIOS_ID,
    GOOGLE_DRIVE_ATAS_ID: process.env.GOOGLE_DRIVE_ATAS_ID,
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_BOOKING_CALENDAR_ID: process.env.GOOGLE_BOOKING_CALENDAR_ID,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  }, "server");
}

export const serverEnv = validatedServerEnv!;
