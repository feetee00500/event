import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PageHeader } from "@/components/app-shell/page-header";
import { EventList } from "@/components/event/event-list";
import { getSessionUser } from "@/lib/auth";
import { getEvents } from "@/lib/server-data";
import { loadWithFallback } from "@/lib/data-loading";
import { PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const canWrite = user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN";
  const { data: events, hasError } = await loadWithFallback(() => getEvents(user), [], "EventsPage.getEvents");
  return <><PageHeader eyebrow="กิจกรรมทั้งหมด" title="กิจกรรมในระบบ" description={`ค้นหา ตรวจสถานะ และเปิด Event Workspace ของ ${PRODUCT_NAME}`} action={canWrite ? <Button href="/admin/events/new"><Plus size={17} />สร้างกิจกรรม</Button> : undefined} /><div className="mb-5 flex items-center gap-2 rounded-sm border border-line bg-white px-4 py-3 text-sm text-muted"><Radio size={17} aria-hidden="true" /><span>ระบบปัจจุบันรองรับโครงการ IIRFA 2026 เพียงรายการเดียว ข้อมูลทุกส่วนอ้างอิงจาก Event เดียวกัน</span></div>    <EventList initialEvents={events} canWrite={canWrite} canDelete={user.role === "SUPER_ADMIN"} loadError={hasError} /></>;
}
