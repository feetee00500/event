import { NextResponse } from "next/server";
import { processCheckin } from "@/lib/checkin-service";
import { requireAuthenticatedUser, requireEvent } from "@/lib/guards";
import { apiError, getRequestMeta } from "@/lib/http";
import { checkinRateLimit } from "@/lib/rate-limit";
import { checkinSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const meta = getRequestMeta(request);
    const rate = checkinRateLimit(`${user.id}:${meta.ipAddress ?? "unknown"}`);
    if (!rate.allowed) return NextResponse.json({ error: "มีการสแกนถี่เกินไป กรุณารอสักครู่" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const data = checkinSchema.parse(await request.json());
    await requireEvent(user, data.eventId, "checkin:write");
    const result = await processCheckin({ ...data, userId: user.id, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error) {
    return apiError(error);
  }
}
