/**
 * BPlen HUB — Firestore Collections Registry 🏛️
 * Centralização de nomes de coleções para evitar dependências circulares
 * e erros de build no Turbopack (Next.js).
 */

export const PRODUCTS_COLLECTION = "products";
export const COUPONS_COLLECTION = "marketing_coupons";
export const USER_PERMISSIONS_COLLECTION = "User_Permissions"; // ⚠️ LEGADO: Migrar para subcoleção User/{mat}/User_Permissions/access
export const USER_ORDERS_COLLECTION = "User_Orders";
export const USER_COLLECTION = "User";
export const AUTH_MAP_COLLECTION = "_AuthMap";

export const COUPON_BATCHES_COLLECTION = "coupon_batches";
export const COUPONS_V2_COLLECTION = "coupons_v2";
export const COUPON_REDEMPTIONS_COLLECTION = "coupon_redemptions";
export const COUPON_ACCEPTANCES_COLLECTION = "coupon_acceptances";

