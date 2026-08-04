import { getSessionUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { getEvent } from "@/lib/server-data";
import { loadWithFallback } from "@/lib/data-loading";

import { PageHeader } from "@/components/app-shell/page-header";
import { EventTabs } from "@/components/event/event-tabs";
import { GateManager, type GateRow } from "@/components/gate/gate-manager";
import { DataLoadNotice, InlineNotice } from "@/components/ui/feedback";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";

export default async function GatesPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  const { eventId } = await params;
    const { data: event, hasError } = await loadWithFallback(() => getEvent(user, eventId), null, "GatesPage.getEvent");
    if (!event) return <><PageHeader eyebrow="Event" title="จุดเข้างาน" description="กำหนด Gate และ Device Code สำหรับเจ้าหน้าที่หน้างาน" /><EventTabs eventId={eventId} active="/gates" canManage={false} /><div className="mt-6">{hasError ? <DataLoadNotice resource="Gate" /> : <InlineNotice tone="error">ไม่พบ Event</InlineNotice>}</div></>;
    const gates = [...event.gates].sort((a, b) => a.name.localeCompare(b.name, "th"));
    const rows: GateRow[] = gates.map((gate) => ({ id: gate.id, name: gate.name, description: gate.description, location: gate.location, deviceCode: gate.deviceCode, isActive: gate.isActive, checkins: gate._count.checkins }));
    return <><PageHeader eyebrow={event.name} title="จุดเข้างาน" description="กำหนด Gate และผูก Device Code สำหรับเจ้าหน้าที่หน้างาน" /><EventTabs eventId={eventId} active="/gates" canManage={canManageEvent(user.role, event.assignments[0]?.role)} /><div className="mt-6"><GateManager eventId={eventId} initialGates={rows} canWrite={canManageEvent(user.role, event.assignments[0]?.role)} /></div></>;
}
