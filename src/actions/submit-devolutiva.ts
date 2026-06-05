"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

/**
 * BPlen HUB — Submit DISC Devolutiva (🧬🚀)
 * Injeta resultados manuais na conta do usuário, sincroniza com Drive e Sheets.
 */
export async function submitDevolutivaDisc(
  targetMatricula: string, 
  data: { 
    executor: number; 
    comunicador: number; 
    planejador: number; 
    analista: number;
    result_file: { url: string; fileName: string; size: number };
  },
  adminToken?: string
) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);

    const db = getAdminDb();
    const now = new Date();
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 1. Buscar metadados do usuário para nomenclatura (Identidade 🧬)
    const userDoc = await db.doc(`User/${targetMatricula}`).get();
    if (!userDoc.exists) throw new Error("Usuário não encontrado.");
    const userData = userDoc.data() || {};
    const userName = userData.Authentication_Name || userData.User_Name || "Membro";
    const userNickname = userData.User_Nickname || "";

    // 2. Persistência no Firestore (Dashboard Results) 🛡️
    const resultPath = `User/${targetMatricula}/results/disc`;
    const resultRef = db.doc(resultPath);
    
    const resultPayload = {
      surveyId: "disc",
      matricula: targetMatricula,
      scores: {
        executor: { percentage: Number(data.executor) },
        comunicador: { percentage: Number(data.comunicador) },
        planejador: { percentage: Number(data.planejador) },
        analista: { percentage: Number(data.analista) }
      },
      file: {
        url: data.result_file.url,
        name: `DISC_${targetMatricula}_${userName.replace(/\s+/g, '_')}_${yymm}.pdf`,
        originalName: data.result_file.fileName,
        size: data.result_file.size
      },
      isReleased: false, // Por padrão, o admin libera depois de conferir no painel
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      injectedBy: `ADMIN`
    };

    await resultRef.set(resultPayload, { merge: true });

    // Sincronização Google Sheets / Drive 🛰️
    try {
      const { getDriveClient, getSheetsClient } = await import("@/lib/google-auth");
      const { serverEnv } = await import("@/env");
      const { ensureFolder, createSpreadsheet, syncDataToSheet } = await import("@/lib/drive-utils");

      const drive = await getDriveClient();
      const sheets = await getSheetsClient();
      const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;

      const isPJ = targetMatricula.includes("-PJ-");
      const catFolderId = await ensureFolder(drive, baseFolderId, isPJ ? "2.3.B2B" : "2.2.B2C");
      const userFolderId = await ensureFolder(drive, catFolderId, targetMatricula);
      
      // Pasta específica para Resultados
      const resultadosFolderId = await ensureFolder(drive, userFolderId, "2.Resultados");
      const discFolderId = await ensureFolder(drive, resultadosFolderId, "DISC");
      
      const { id: spreadsheetId } = await createSpreadsheet(drive, discFolderId, `Devolutiva DISC - ${targetMatricula} - ${yymm}`);

      const headers = ["Timestamp", "Matrícula", "Nome", "Nickname", "Executor", "Comunicador", "Planejador", "Analista", "Link PDF"];
      const rowData = [
        now.toLocaleString("pt-BR"),
        targetMatricula,
        userName,
        userNickname,
        data.executor,
        data.comunicador,
        data.planejador,
        data.analista,
        data.result_file.url
      ];

      await syncDataToSheet(sheets, spreadsheetId, headers, rowData);
    } catch (driveErr) {
      console.error("⚠️ [SubmitDevolutiva] Erro na sincronização Google:", driveErr);
    }

    revalidatePath("/admin/users");
    revalidatePath("/hub/membro");
    
    return { success: true };

  } catch (err: any) {
    console.error("❌ [SubmitDevolutiva] Falha crítica:", err);
    throw new Error(err.message || "Erro ao publicar devolutiva DISC.");
  }
}
