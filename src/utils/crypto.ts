import crypto from "crypto";

/**
 * BPlen HUB — Crypto Utilities (🛡️)
 * Algoritmo padrão de mercado para mascaramento de dados confidenciais (CPF).
 * Sem emojis nos logs e sem any de acordo com as regras de governança.
 */

const SALT = process.env.FIREBASE_PROJECT_ID || "bplen-hub-default-salt-key";

/**
 * Gera um hash SHA-256 do CPF fornecido, utilizando um Salt para maior segurança.
 * @param cpf String contendo o CPF do usuário (será normalizado removendo pontuação).
 */
export function hashCpf(cpf: string): string {
  const normalizedCpf = cpf.replace(/\D/g, "");
  return crypto
    .createHmac("sha256", SALT)
    .update(normalizedCpf)
    .digest("hex");
}
