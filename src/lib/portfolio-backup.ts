import * as admin from "firebase-admin";
import { PRODUCTS_COLLECTION, COUPONS_COLLECTION, BACKUP_NAMESPACE_COLLECTION } from "@/config/collections";

/**
 * BPlen HUB — Backup do sync de portfolio em namespace unico (Trilha 3d / BUG-040)
 *
 * Antes: cada sync criava DUAS colecoes-raiz novas (products_backup_<ts> +
 * coupons_backup_<ts>), poluindo a raiz (~50 colecoes). Agora: um doc por sync em
 * `_portfolio_backups/{ts}` com subcolecoes `products`/`coupons`, e rotacao que
 * mantem apenas os N mais recentes (decisao da Gestora, 2026-07-07: N=3).
 *
 * Compartilhado pelos DOIS caminhos de sync (`syncPortfolioAction` em products.ts
 * e `syncPortfolioFromFilesAction` em portfolio-commands.ts — este segundo nao
 * fazia backup nenhum antes da Trilha 3d).
 *
 * Sem guard proprio: chamado por actions que ja passaram por `requireAdmin`.
 */

/** Quantos backups de sync ficam retidos no namespace */
export const BACKUP_RETENTION = 3;

export async function backupPortfolioCollections(
  db: FirebaseFirestore.Firestore,
  options: { includeCoupons: boolean }
): Promise<string | null> {
  const productsSnapshot = await db.collection(PRODUCTS_COLLECTION).get();
  const couponsSnapshot = options.includeCoupons
    ? await db.collection(COUPONS_COLLECTION).get()
    : null;

  const shouldBackupProducts = !productsSnapshot.empty;
  const shouldBackupCoupons = couponsSnapshot !== null && !couponsSnapshot.empty;

  if (!shouldBackupProducts && !shouldBackupCoupons) {
    console.log("[Portfolio Backup] Nada a fazer backup (colecoes vazias).");
    return null;
  }

  const backupId = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  const backupRootRef = db.collection(BACKUP_NAMESPACE_COLLECTION).doc(backupId);
  const backupBatch = db.batch();

  backupBatch.set(backupRootRef, {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    productsCount: shouldBackupProducts ? productsSnapshot.size : 0,
    couponsCount: shouldBackupCoupons && couponsSnapshot ? couponsSnapshot.size : 0,
  });

  if (shouldBackupProducts) {
    productsSnapshot.docs.forEach((doc) => {
      backupBatch.set(backupRootRef.collection("products").doc(doc.id), doc.data());
    });
  }
  if (shouldBackupCoupons && couponsSnapshot) {
    couponsSnapshot.docs.forEach((doc) => {
      backupBatch.set(backupRootRef.collection("coupons").doc(doc.id), doc.data());
    });
  }

  await backupBatch.commit();
  console.log(`[Portfolio Backup] Backup concluído em ${BACKUP_NAMESPACE_COLLECTION}/${backupId}.`);

  // Rotacao: mantem os N mais recentes (id = timestamp ordenavel), apaga o resto
  // recursivamente (subcolecoes incluidas). Falha de rotacao nao aborta o sync.
  try {
    const allBackups = await db.collection(BACKUP_NAMESPACE_COLLECTION)
      .orderBy(admin.firestore.FieldPath.documentId(), "desc")
      .get();
    const stale = allBackups.docs.slice(BACKUP_RETENTION);
    for (const doc of stale) {
      await db.recursiveDelete(doc.ref);
      console.log(`[Portfolio Backup] Backup antigo removido: ${doc.id}`);
    }
  } catch (rotationErr) {
    console.error("[Portfolio Backup] Falha na rotacao (sync segue):", rotationErr);
  }

  return backupId;
}
