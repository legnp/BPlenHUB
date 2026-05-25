import { MercadoPagoConfig } from 'mercadopago';
import { serverEnv } from '@/env';

/**
 * BPlen HUB — Mercado Pago SDK Singleton (💳)
 * Centraliza a configuração do client para garantir que as credenciais
 * sejam injetadas corretamente em Server Actions e Webhooks.
 */

if (!serverEnv.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error("❌ [MercadoPago] Access Token não encontrado no servidor.");
}

export const mpClient = new MercadoPagoConfig({ 
  accessToken: serverEnv.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 30000, // 30 segundos (Soberania de Resiliência: Sandbox MP costuma ser lento)
  }
});

// Nota: O ambiente (Sandbox vs Produção) é definido pela chave injetada.
// Chaves 'TEST-...' ativam automaticamente o modo Sandbox.
