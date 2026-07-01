import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getErrorMessage } from "@/lib/utils/errors";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collectionGroup("Surveys")
      .where("matricula", "==", "BP-013-PF-260527")
      .get();

    const results = snapshot.docs.map(doc => ({
      path: doc.ref.path,
      data: doc.data(),
    }));

    return NextResponse.json(results);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
