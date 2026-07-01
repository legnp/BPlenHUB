import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getErrorMessage } from "@/lib/utils/errors";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collectionGroup("Surveys")
      .where("surveyId", "==", "check_in")
      .where("status", "==", "completed")
      .get();

    const paths = snapshot.docs.map(doc => ({
      path: doc.ref.path,
      matricula: doc.data().matricula,
      submittedAt: doc.data().submittedAt,
    }));

    return NextResponse.json(paths);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
