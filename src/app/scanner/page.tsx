import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEvents } from "@/lib/server-data";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, InlineNotice } from "@/components/ui/feedback";
import { StatusBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ScannerSelectPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const events = await getEvents(user);
    const active = events.filter((event) => event.status !== "CANCELLED" && event.status !== "COMPLETED");
    return <><PageHeader eyebrow="หน้างาน" title="เลือก Event สำหรับ Scanner" description="เลือกงานก่อนเปิดกล้องเพื่อให้ระบบตรวจสอบ QR ได้ถูกต้อง" /><Card><CardContent>{active.length ? <div className="grid gap-3 md:grid-cols-2">{active.map((event) => <Link key={event.id} href={`/scanner/${event.id}`} className="focus-ring group rounded-sm border border-line p-4 transition hover:border-primary hover:shadow-soft"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#efeeff] text-primary"><ClipboardCheck size={20} /></span><StatusBadge status={event.status} label={{ DRAFT: "ฉบับร่าง", PUBLISHED: "เผยแพร่", ACTIVE: "กำลังใช้งาน", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก" }[event.status]} /></div><h2 className="mt-4 font-semibold group-hover:text-primary">{event.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CalendarDays size={14} />{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(event.startAt))}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">เปิด Scanner<ArrowRight size={15} /></span></Link>)}</div> : <EmptyState title="ยังไม่มี Event ที่เปิด Scanner ได้" description="ตรวจสอบสถานะ Event หรือขอสิทธิ์จากผู้ดูแลงาน" />}</CardContent></Card></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลด Event สำหรับ Scanner ได้</InlineNotice>;
  }
}
