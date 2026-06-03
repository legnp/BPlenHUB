import { NextResponse } from "next/server";
import { updateGlobalProgramacaoRegistryAction } from "@/actions/calendar-module/post-event";

export async function GET() {
  try {
    const res = await updateGlobalProgramacaoRegistryAction();
    return NextResponse.json({ success: true, result: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
