import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEvent } from "@/lib/server-data";
import { prisma } from "@/lib/db";
import { ScannerClient } from "@/components/scanner/scanner-client";
import { InlineNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function ScannerPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const event = await getEvent(user, eventId);
    if (!event) return <InlineNotice tone="error">ไม่พบ Event หรือคุณไม่มีสิทธิ์ใช้งาน</InlineNotice>;
    const gates = await prisma.gate.findMany({ where: { eventId, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
    return <div className="mx-auto max-w-4xl"><Link href="/scanner" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"><ArrowLeft size={16} />เลือก Event อื่น</Link><ScannerClient eventId={event.id} eventName={event.name} gates={gates} /></div>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถเปิด Scanner ได้</InlineNotice>;
  }
}
