import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/app-shell/page-header";
import { EventList } from "@/components/event/event-list";
import { getCurrentUser } from "@/lib/auth";
import { getEvents } from "@/lib/server-data";
import { PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const events = await getEvents(user);
    const canWrite = user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN";
    return <><PageHeader eyebrow="กิจกรรมทั้งหมด" title="กิจกรรมในระบบ" description={`ค้นหา ตรวจสถานะ และเปิด Event Workspace ของ ${PRODUCT_NAME}`} action={canWrite ? <Button href="/admin/events/new"><Plus size={17} />สร้างกิจกรรม</Button> : undefined} /><div className="mb-5 flex items-center gap-2 rounded-lg border border-[#b9dce5] bg-[#eef9fa] px-4 py-3 text-sm text-[#146c94]"><Radio size={17} aria-hidden="true" /><span>ระบบปัจจุบันรองรับโครงการ IIRFA 2026 เพียงรายการเดียว ข้อมูลทุกส่วนอ้างอิงจาก Event เดียวกัน</span></div><EventList initialEvents={events} canWrite={canWrite} /></>;
  } catch {
    return <><PageHeader eyebrow="กิจกรรมทั้งหมด" title="ข้อมูลกิจกรรม" /><InlineNotice tone="error">ยังเชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบ DATABASE_URL ก่อนโหลดรายการกิจกรรม</InlineNotice></>;
  }
}