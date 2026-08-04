
import { BarChart3, CalendarClock, CheckCircle2, Clock3, Edit3, MapPin, QrCode, Ticket, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { canCheckIn, canManageEvent } from "@/lib/permissions";
import { getEvent } from "@/lib/server-data";
import { prisma } from "@/lib/db";
import { formatBangkokDateTime, formatBangkokTime } from "@/lib/timezone";
import { Breadcrumbs } from "@/components/app-shell/breadcrumbs";
import { EventTabs } from "@/components/event/event-tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/feedback";
import { DeleteEventButton } from "@/components/event/delete-event-button";
import { PRODUCT_NAME } from "@/lib/branding";

type Props = { params: Promise<{ eventId: string }> };
export const dynamic = "force-dynamic";
const eventLabels: Record<string, string> = { DRAFT: "ฉบับร่าง", PUBLISHED: "เผยแพร่", ACTIVE: "กำลังใช้งาน", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก" };

export default async function EventDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  const { eventId } = await params;
  try {
    const [event, checkedInCount] = await Promise.all([
      getEvent(user, eventId),
      prisma.attendee.count({ where: { eventId, status: "CHECKED_IN" } }),
    ]);
    if (!event) return <InlineNotice tone="error">ไม่พบ Event หรือคุณไม่ได้รับมอบหมายงานนี้</InlineNotice>;
    const rate = event._count.attendees ? Math.min(100, Math.round((checkedInCount / event._count.attendees) * 100)) : 0;
    const canWrite = canManageEvent(user.role, event.assignments[0]?.role);
    const canScan = canCheckIn(user.role, event.assignments[0]?.role);
    return <>
      <Breadcrumbs items={[{ label: "กิจกรรมทั้งหมด", href: "/admin/events" }, { label: event.name }]} />


      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-card"><div className="grid lg:grid-cols-[240px_1fr_auto]"><div className="relative min-h-[170px] bg-navy lg:min-h-full">{event.imageUrl ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,39,86,.72),rgba(0,39,86,.25)),url(${event.imageUrl})` }} role="img" aria-label={`ภาพปก ${event.name}`} /> : <div className="absolute inset-0 bg-ink" />}<span className="absolute left-4 top-4 rounded-full border border-white/25 bg-navy/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">{PRODUCT_NAME}</span></div><div className="p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status} label={eventLabels[event.status] ?? event.status} /><span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">Event workspace</span></div><h1 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">{event.name}</h1><div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2"><span className="flex items-start gap-2"><CalendarClock size={16} className="mt-0.5 shrink-0 text-primary" />{formatBangkokDateTime(event.startAt)}</span><span className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" /><span>{event.venue}</span></span><span className="flex items-start gap-2"><Clock3 size={16} className="mt-0.5 shrink-0 text-primary" />Check-in {formatBangkokTime(event.checkinOpenAt)}–{formatBangkokTime(event.checkinCloseAt)}</span></div></div><div className="flex items-end gap-2 border-t border-line bg-paper p-5 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0"><Button href={`/admin/events/${eventId}/tickets`} variant="secondary"><QrCode size={17} />จัดการบัตร</Button>{canWrite ? <Button href={`/admin/events/${eventId}/edit`}><Edit3 size={17} />แก้ไขกิจกรรม</Button> : null}{user.role === "SUPER_ADMIN" ? <DeleteEventButton eventId={eventId} eventName={event.name} /> : null}</div></div></section>

      <div className="mt-6"><EventTabs eventId={eventId} canManage={canWrite} /></div>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Users} label="ผู้เข้าร่วม" value={event._count.attendees} detail="รายชื่อในกิจกรรม" /><Metric icon={Ticket} label="บัตรเข้างาน" value={event._count.tickets} detail="Ticket ที่ออกแล้ว" tone="success" /><Metric icon={CheckCircle2} label="Check-in สำเร็จ" value={checkedInCount} detail="ผลสำเร็จจากทุก Gate" tone="success" /><Metric icon={BarChart3} label="Check-in rate" value={`${rate}%`} detail="เทียบกับผู้เข้าร่วม" tone="primary" /></section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><Card><CardHeader><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Registration vs check-in</p><h2 className="mt-2 text-lg font-semibold">ความคืบหน้าการเข้างาน</h2></div><span className="mono text-2xl font-semibold text-primary">{rate}%</span></div></CardHeader><CardContent><div className="flex items-end justify-between gap-4 text-sm"><div><p className="text-muted">เข้างานแล้ว</p><p className="mt-1 text-3xl font-semibold">{checkedInCount.toLocaleString("th-TH")}</p></div><div className="text-right"><p className="text-muted">ทั้งหมด</p><p className="mt-1 text-xl font-semibold">{event._count.attendees.toLocaleString("th-TH")}</p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#f0f0f0]" role="progressbar" aria-label="ความคืบหน้า Check-in" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate}><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${rate}%` }} /></div><p className="mt-3 text-sm text-muted">เหลือ {Math.max(0, event._count.attendees - checkedInCount).toLocaleString("th-TH")} คนที่ยังไม่ Check-in</p>{canScan ? <Button href={`/scanner/${event.id}`} className="mt-5"><QrCode size={17} />เปิด Scanner ของกิจกรรมนี้</Button> : null}</CardContent></Card><Card><CardHeader><p className="eyebrow">Gate performance</p><h2 className="mt-2 text-lg font-semibold">การทำงานแยกตามจุด</h2></CardHeader><CardContent className="space-y-5">{event.gates.length ? event.gates.map((gate) => <div key={gate.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{gate.name}</span><span className="mono text-xs text-muted">{gate._count.checkins.toLocaleString("th-TH")} คน</span></div><div className="h-2 overflow-hidden rounded-full bg-[#f0f0f0]"><div className="h-full rounded-full bg-signal" style={{ width: `${event._count.checkins ? Math.min(100, (gate._count.checkins / event._count.checkins) * 100) : 0}%` }} /></div><p className="mt-1 text-xs text-muted">{gate._count.checkins ? "มีการสแกนสำเร็จ" : "ยังไม่มีการสแกน"}</p></div>) : <InlineNotice tone="info">ยังไม่มี Gate สำหรับกิจกรรมนี้</InlineNotice>}</CardContent></Card></section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><Card><CardHeader><p className="eyebrow">Event information</p><h2 className="mt-2 text-lg font-semibold">ข้อมูลกิจกรรม</h2></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><Info label="เริ่มงาน" value={formatBangkokDateTime(event.startAt)} /><Info label="สิ้นสุดงาน" value={formatBangkokDateTime(event.endAt)} /><Info label="รูปแบบการเข้า" value={{ SINGLE_ENTRY: "เข้าได้ครั้งเดียว", REENTRY: "เข้าออกได้หลายครั้ง", MULTI_DAY: "งานหลายวัน" }[event.accessMode]} /><Info label="สถานที่" value={event.venue} /></dl>{event.description ? <div className="mt-6 border-t border-line pt-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">รายละเอียด</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted">{event.description}</p></div> : null}</CardContent></Card><Card><CardHeader><p className="eyebrow">Operational alert</p><h2 className="mt-2 text-lg font-semibold">สิ่งที่ควรตรวจ</h2></CardHeader><CardContent className="space-y-3 text-sm"><p className="flex items-start gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-success" />ตรวจช่วงเปิด–ปิด Check-in ให้ตรงกับแผนงาน</p><p className="flex items-start gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-signal" />ทดสอบ Gate และอุปกรณ์ก่อนเริ่มรับผู้เข้าร่วม</p><p className="flex items-start gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-warning" />ตรวจรายชื่อและสถานะ QR ก่อนส่งบัตร</p></CardContent></Card></section>
    </>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลดรายละเอียด Event ได้</InlineNotice>;
  }
}

function Metric({ icon: Icon, label, value, detail, tone = "primary" }: { icon: typeof Users; label: string; value: string | number; detail: string; tone?: "primary" | "success" }) { const colors = tone === "success" ? "text-success bg-[#eef6ff]" : "text-primary bg-[#eef6ff]"; return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors}`}><Icon size={18} aria-hidden="true" /></span><span className="text-right text-xs text-muted">{detail}</span></div><p className="metric-value mt-4">{value}</p><p className="mt-2 text-sm font-semibold text-ink">{label}</p></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt><dd className="mt-1.5 text-sm font-medium">{value}</dd></div>; }