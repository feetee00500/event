import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthRequiredError } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/guards";

export function apiError(error: unknown): NextResponse {
  if (error instanceof AuthRequiredError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof NotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
  if (error instanceof ZodError) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", fields: error.flatten().fieldErrors }, { status: 422 });
  return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
}

export function getRequestMeta(request: Request): { ipAddress?: string; userAgent?: string } {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return { ipAddress: forwarded || request.headers.get("x-real-ip") || undefined, userAgent: request.headers.get("user-agent") || undefined };
}
