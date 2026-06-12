/**
 * BPlen HUB — Interface de Tipos para QR Codes 📡
 * Define a estrutura de dados persistida no banco Firestore e referenciada na interface.
 */
export interface BPlenQRCode {
  id?: string;
  title: string;
  link: string;
  driveFileId: string;
  driveUrl: string;
  createdAt: string; // ISO string para transporte seguro entre servidor/cliente
}
export interface QRCodeFormValues {
  title: string;
  link: string;
}
