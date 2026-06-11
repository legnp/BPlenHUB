import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { clientEnv } from "@/env";

/**
 * BPlen HUB — Firebase Client SDK (Central de Distribuição)
 * Inicializa os serviços do Firebase para uso no navegador.
 */

const rawAuthDomain = clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const resolvedAuthDomain = (rawAuthDomain === "bplen.com" || rawAuthDomain === "www.bplen.com")
  ? "bplenhub.firebaseapp.com"
  : (rawAuthDomain || "bplenhub.firebaseapp.com");

const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: resolvedAuthDomain,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: clientEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton para evitar múltiplas inicializações no Hot Reloading do Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/** Instância de Autenticação */
export const auth = getAuth(app);

/** Instância do Banco de Dados (Firestore) */
export const db = getFirestore(app);

export default app;
