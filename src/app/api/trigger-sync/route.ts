import { NextResponse } from "next/server";
import { updateGlobalProgramacaoRegistryAction } from "@/actions/calendar-module/post-event";
import { getErrorMessage } from "@/lib/utils/errors";

export async function GET() {
  try {
    const res = await updateGlobalProgramacaoRegistryAction();
    return NextResponse.json({ success: true, result: res });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
