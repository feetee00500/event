import { getSessionUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getEvent } from "@/lib/server-data";

import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { GateManager, type GateRow } from "@/components/gate/gate-manager";
import { InlineNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function GatesPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const event = await getEvent(user, eventId);
    if (!event) return <InlineNotice tone="error">ไม่พบ Event</InlineNotice>;
    const gates = [...event.gates].sort((a, b) => a.name.localeCompare(b.name, "th"));
    const rows: GateRow[] = gates.map((gate) => ({ id: gate.id, name: gate.name, description: gate.description, location: gate.location, deviceCode: gate.deviceCode, isActive: gate.isActive, checkins: gate._count.checkins }));
    return <><PageHeader eyebrow={event.name} title="จุดเข้างาน" description="กำหนด Gate และผูก Device Code สำหรับเจ้าหน้าที่หน้างาน" /><EventTabs eventId={eventId} active="/gates" canManage={canManageEvent(user.role, event.assignments[0]?.role)} /><div className="mt-6"><GateManager eventId={eventId} initialGates={rows} canWrite={canManageEvent(user.role, event.assignments[0]?.role)} /></div></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลด Gates ได้</InlineNotice>;
  }
}
