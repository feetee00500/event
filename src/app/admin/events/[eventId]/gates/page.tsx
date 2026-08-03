import { getCurrentUser } from "@/lib/auth";
import { getEvent } from "@/lib/server-data";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { GateManager, type GateRow } from "@/components/gate/gate-manager";
import { InlineNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function GatesPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const event = await getEvent(user, eventId);
    if (!event) return <InlineNotice tone="error">ไม่พบ Event</InlineNotice>;
    const gates = await prisma.gate.findMany({ where: { eventId }, orderBy: { name: "asc" }, include: { _count: { select: { checkins: { where: { result: "SUCCESS" } } } } } });
    const rows: GateRow[] = gates.map((gate) => ({ id: gate.id, name: gate.name, description: gate.description, location: gate.location, deviceCode: gate.deviceCode, isActive: gate.isActive, checkins: gate._count.checkins }));
    return <><PageHeader eyebrow={event.name} title="จุดเข้างาน" description="กำหนด Gate และผูก Device Code สำหรับเจ้าหน้าที่หน้างาน" /><EventTabs eventId={eventId} active="/gates" /><div className="mt-6"><GateManager eventId={eventId} initialGates={rows} canWrite={user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN"} /></div></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลด Gates ได้</InlineNotice>;
  }
}
