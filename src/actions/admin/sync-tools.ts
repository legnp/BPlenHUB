"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { syncOrderToUserDrive, syncJourneyToUserDrive, syncBacklogToUserDrive } from "@/lib/drive-sync";
import { USER_ORDERS_COLLECTION } from "@/config/collections";

/**
 * Ferramenta Administrativa para Sincronização Retroativa de Dados do Firestore para o Google Drive.
 * 
 * @param targetMatricula Matrícula do usuário a ser sincronizado.
 * @param adminToken Token do administrador autenticado.
 */
export async function triggerRetroactiveDriveSyncAction(targetMatricula: string, adminToken: string) {
  try {
    await requireAdmin(adminToken);
    const db = getAdminDb();
    
    console.log(`[AdminSync] Iniciando sincronização retroativa para: ${targetMatricula}`);

    // 1. Validar usuário
    const userSnap = await db.collection("User").doc(targetMatricula).get();
    if (!userSnap.exists) {
      throw new Error(`Usuário ${targetMatricula} não encontrado no Firestore.`);
    }

    // 2. Sincronizar Histórico Financeiro (Orders)
    const ordersSnap = await db.collection(USER_ORDERS_COLLECTION)
      .where("matricula", "==", targetMatricula)
      .where("status", "==", "approved")
      .get();
      
    if (!ordersSnap.empty) {
      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data();
        const { orderId, productTitle, finalPrice, createdAt, basePrice, appliedDiscount } = order;
        const orderDate = createdAt?.toDate ? createdAt.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
        
        const rowData = [
          orderDate,
          orderId,
          productTitle || "Serviço BPlen",
          basePrice || finalPrice,
          appliedDiscount || 0,
          finalPrice,
          "Aprovado"
        ];
        
        await syncOrderToUserDrive(targetMatricula, rowData);
      }
    }

    // 3. Sincronizar Snapshot da Jornada (Progress)
    const progressSnap = await db.collection("User").doc(targetMatricula).collection("User_Journey").doc("progress").get();
    if (progressSnap.exists) {
      const data = progressSnap.data();
      const updatedAtStr = data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
      
      const rowData = [
        updatedAtStr,
        data?.lastActiveStepId || "N/A", 
        "Snapshot Histórico Completo", 
        `${data?.overallProgress || 0}%`
      ];
      
      await syncJourneyToUserDrive(targetMatricula, rowData);
    }

    // 4. Sincronizar Histórico do Backlog de Tarefas
    const tasksSnap = await db.collection("User").doc(targetMatricula).collection("Career_Backlog").get();
    if (!tasksSnap.empty) {
      for (const taskDoc of tasksSnap.docs) {
        const task = taskDoc.data();
        const rowData = [
          task.createdAt ? new Date(task.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          "Resgate Retroativo",
          task.title || "Tarefa de Mentoria",
          task.status || "Sprint atual",
          ""
        ];
        
        await syncBacklogToUserDrive(targetMatricula, rowData);
      }
    }

    console.log(`✅ [AdminSync] Sincronização retroativa de ${targetMatricula} finalizada com sucesso!`);
    return { success: true, message: `Dados de ${targetMatricula} espelhados no Google Drive.` };

  } catch (error) {
    console.error("🚨 [AdminSync] Erro na sincronização retroativa:", error);
    return { success: false, error: (error as Error).message };
  }
}
