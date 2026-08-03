import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { getReportData } from "@/lib/server-data";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    const report = await getReportData(user, eventId);
    if (!report) return NextResponse.json({ error: "ไม่พบ Event" }, { status: 404 });
    return NextResponse.json({ report });
  } catch (error) {
    return apiError(error);
  }
}
