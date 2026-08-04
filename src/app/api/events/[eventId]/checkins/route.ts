import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError } from "@/lib/http";
import { getCheckins } from "@/lib/server-data";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const { eventId } = await params;
    await requireEvent(user, eventId, "reports:read");
    const checkins = await getCheckins(user, eventId);
    if (!checkins) return NextResponse.json({ error: "ไม่พบ Event" }, { status: 404 });
    return NextResponse.json({ checkins });
  } catch (error) {
    return apiError(error);
  }
}
