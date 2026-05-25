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
