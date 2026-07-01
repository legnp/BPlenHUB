import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * BPlen HUB — Rota de Emergência para Reset de Base 🛡️
 * Acesso: /api/admin/db-reset?secret=BPLEN_RESET_2026
 */

const ADMIN_EMAIL = "legnp@bplen.com";
const COLLECTIONS = ["User", "_AuthMap", "content_posts", "Events", "Networking", "Checkouts", "ServiceRequests"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Trava de Segurança
  if (secret !== "BPLEN_RESET_2026") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Inicializar Admin com Reconstrução PEM Robusta 💎
  if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    
    // 1. Limpeza profunda: remove aspas e converte \n
    privateKey = privateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
    
    // 2. Extrai apenas o miolo Base64
    const body = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\s+/g, ""); // Remove espaços e quebras internas
    
    // 3. Reconstrói o PEM (64 chars por linha)
    const chunks = body.match(/.{1,64}/g) || [];
    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join("\n")}\n-----END PRIVATE KEY-----`;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
  }

  const db = admin.firestore();
  const results: any = {};

  try {
    for (const colName of COLLECTIONS) {
      const colRef = db.collection(colName);
      const snapshot = await colRef.get();
      
      let count = 0;
      let preserved = 0;

      // Usar Batches para eficiência
      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const isMaster = 
          data.Authentication_Email === ADMIN_EMAIL || 
          data.email === ADMIN_EMAIL || 
          data.User_Email === ADMIN_EMAIL ||
          doc.id === ADMIN_EMAIL ||
          doc.id === "62.857.668/0001-07";

        if (!isMaster) {
          batch.delete(doc.ref);
          count++;
        } else {
          preserved++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }
      
      results[colName] = { deleted: count, preserved };
    }

    return NextResponse.json({ 
      success: true, 
      message: "Base de dados limpa com sucesso via Server Engine.",
      results 
    });

  } catch (error: unknown) {
    console.error("Erro no reset via API:", error);
    return NextResponse.json({ 
      success: false, 
      error: getErrorMessage(error) 
    }, { status: 500 });
  }
}
