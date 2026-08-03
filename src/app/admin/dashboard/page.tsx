import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, FileBarChart, IdCard, QrCode, Settings2, UserRoundCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EventCard } from "@/components/event/event-card";
import { InlineNotice } from "@/components/ui/feedback";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/server-data";
import { EVENT_SCOPE_NAME, PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { DRAFT: "กำลังเตรียมข้อมูล", PUBLISHED: "พร้อมรับผู้เข้าร่วม", ACTIVE: "กำลังดำเนินงาน", COMPLETED: "ปิดงานแล้ว", CANCELLED: "ยกเลิก" };

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof UsersRound }) {
  return <div className="rounded-lg border border-line bg-white px-4 py-4 shadow-card sm:px-5"><div className="flex items-start justify-between gap-3"><p className="max-w-[12rem] text-sm font-semibold leading-5 text-muted">{label}</p><Icon size={18} strokeWidth={1.8} className="text-primary" aria-hidden="true" /></div><p className="metric-value mt-4">{value}</p><p className="mt-2 text-xs text-muted">{detail}</p></div>;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const data = await getDashboardData(user);
  const project = data.latestEvents[0];
  const projectHref = project ? `/admin/events/${project.id}` : "/admin/events/new";
  const workspaceHref = project ? `/admin/events/${project.id}` : "/admin/events";
  const workspaceDescription = project ? "เปิด Workspace ของกิจกรรมนี้" : "เลือกกิจกรรมเพื่อเปิด Workspace";
  const attendeeHref = project ? `/admin/events/${project.id}/attendees` : workspaceHref;
  const ticketHref = project ? `/admin/events/${project.id}/tickets` : workspaceHref;
  const reportHref = project ? `/admin/events/${project.id}/reports` : workspaceHref;
  const pending = Math.max(0, data.attendeeCount - data.checkinsToday);
  const checkinRate = data.attendeeCount ? Math.round((data.checkinsToday / data.attendeeCount) * 100) : 0;
  const operations = [
    { title: "ผู้เข้าร่วม", description: project ? "ตรวจรายชื่อ นำเข้า และดูสถานะบัตร" : workspaceDescription, href: attendeeHref, icon: UsersRound },
    { title: "บัตรเข้างาน", description: project ? "ออกบัตร ตรวจสถานะ และจัดการ QR" : workspaceDescription, href: ticketHref, icon: IdCard },
    { title: "สแกนเข้างาน", description: "เปิด Scanner สำหรับเจ้าหน้าที่หน้างาน", href: "/scanner", icon: QrCode },
    { title: "รายงาน", description: project ? "ดูยอดเข้า สแกนซ้ำ และแยกตาม Gate" : workspaceDescription, href: reportHref, icon: FileBarChart },
  ];

  return <>
    <section className="overflow-hidden rounded-lg border border-ink bg-navy text-white shadow-card">
      <div className="grid lg:grid-cols-[1.45fr_.55fr]">
        <div className="relative px-6 py-7 sm:px-9 sm:py-8"><div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rotate-45 border-[25px] border-[#22c7ae]/15" /><div className="relative"><p className="mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Operations Desk / {EVENT_SCOPE_NAME}</p><h1 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.06em] sm:text-6xl">{PRODUCT_NAME}</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">ศูนย์กลางสำหรับทีมลงทะเบียน ออกบัตร และควบคุมการ Check-in ข้อมูลทุกจุดอ้างอิงจาก Event เดียวกัน</p><div className="mt-6 flex flex-wrap gap-3"><Button href="/scanner" variant="secondary" className="border-white bg-white text-ink hover:bg-signal"><QrCode size={17} />เปิดจุด Check-in</Button><Button href={projectHref} variant="ghost" className="border border-white/25 text-white hover:bg-white/10 hover:text-white"><Settings2 size={17} />{project ? "เปิด Event Workspace" : "ตั้งค่ากิจกรรม"}</Button></div></div></div>
        <div className="border-t border-white/15 bg-white/[0.05] p-6 lg:border-l lg:border-t-0 lg:p-7"><div className="flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[0.18em] text-white/50">สถานะระบบ</span><span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" /></div><p className="mt-6 text-2xl font-semibold leading-tight">{project ? "พร้อมปฏิบัติงาน" : "รอตั้งค่ากิจกรรม"}</p><p className="mt-2 text-sm leading-6 text-white/65">{project ? statusLabels[project.status] ?? project.status : "เพิ่มวันเวลา สถานที่ และช่วงเปิด Check-in ก่อนเริ่มใช้งาน"}</p><dl className="mt-6 space-y-3 border-t border-white/15 pt-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-white/50">ขอบเขต</dt><dd className="font-semibold">{EVENT_SCOPE_NAME}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/50">ผู้ใช้งาน</dt><dd className="font-semibold">{user.name}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/50">สิทธิ์</dt><dd className="font-semibold">{user.role.replaceAll("_", " ")}</dd></div></dl></div>
      </div>
    </section>

    <section className="mt-6" aria-labelledby="overview-heading"><div className="mb-3 flex items-end justify-between gap-4"><div><p className="eyebrow">ภาพรวม</p><h2 id="overview-heading" className="mt-2 text-xl font-semibold tracking-[-0.025em]">ตัวเลขที่ต้องรู้วันนี้</h2></div><span className="mono hidden text-[10px] uppercase tracking-[0.16em] text-muted sm:block">Asia / Bangkok</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="กิจกรรมทั้งหมด" value={data.eventCount.toLocaleString("th-TH")} detail="Event ในขอบเขตของคุณ" icon={CalendarClock} /><Metric label="กำลังจะถึง" value={data.upcomingCount.toLocaleString("th-TH")} detail="กิจกรรมที่ยังไม่เริ่ม" icon={CalendarClock} /><Metric label="ผู้เข้าร่วม" value={data.attendeeCount.toLocaleString("th-TH")} detail="รายชื่อในกิจกรรม" icon={UsersRound} /><Metric label="เข้างานวันนี้" value={data.checkinsToday.toLocaleString("th-TH")} detail="ผลสำเร็จเท่านั้น" icon={UserRoundCheck} /><Metric label="Check-in rate" value={`${checkinRate}%`} detail={`ยังไม่เข้า ${pending.toLocaleString("th-TH")} คน`} icon={ClipboardCheck} /></div></section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[1.18fr_.82fr]"><div><div className="mb-3 flex items-end justify-between gap-3"><div><p className="eyebrow">กิจกรรมที่เกี่ยวข้อง</p><h2 className="mt-2 text-xl font-semibold">กิจกรรมที่กำลังจะถึง</h2></div><Link href="/admin/events" className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-sm px-2 text-sm font-semibold text-primary hover:bg-[#eaf6f3]">ดูกิจกรรมทั้งหมด<ArrowRight size={15} /></Link></div>{project ? <EventCard event={project} /> : <Card><CardContent><InlineNotice tone="info"><div><strong>ยังไม่มีข้อมูลกิจกรรม</strong><p className="mt-1">ตั้งค่า {PRODUCT_NAME} สำหรับ {EVENT_SCOPE_NAME} เพื่อเริ่มรับรายชื่อและเปิดจุด Check-in</p><Button href="/admin/events/new" size="sm" className="mt-4">ตั้งค่ากิจกรรม</Button></div></InlineNotice></CardContent></Card>}</div><div><div className="mb-3"><p className="eyebrow">พื้นที่ปฏิบัติงาน</p><h2 className="mt-2 text-xl font-semibold">ทางลัดสำหรับทีม</h2></div><Card><CardContent className="p-0"><div className="divide-y divide-line">{operations.map((item) => { const Icon = item.icon; return <Link key={item.title} href={item.href} className="focus-ring group grid min-h-[76px] grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-3 hover:bg-paper"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-primary"><Icon size={18} strokeWidth={1.8} /></span><span><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{item.description}</span></span><ArrowRight size={16} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" /></Link>; })}</div></CardContent></Card></div></section>

    <section className="mt-7 grid gap-6 lg:grid-cols-2"><Card><CardHeader><p className="eyebrow">กิจกรรมล่าสุด</p><h2 className="mt-2 text-lg font-semibold">Check-in ล่าสุด</h2></CardHeader><CardContent><InlineNotice tone="info"><div><strong>รายการล่าสุดจะแสดงเมื่อมีการสแกน</strong><p className="mt-1">หน้านี้จะใช้ข้อมูลจริงจากประวัติ Check-in ของ Event</p></div></InlineNotice></CardContent></Card><Card><CardHeader><p className="eyebrow">การดูแลระบบ</p><h2 className="mt-2 text-lg font-semibold">สิ่งที่ต้องตรวจ</h2></CardHeader><CardContent>{project ? <div className="space-y-3 text-sm"><p className="flex items-start gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-success" /><span>กิจกรรมถูกตั้งค่าแล้ว ตรวจช่วงเปิด–ปิด Check-in ก่อนวันงาน</span></p><p className="flex items-start gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-signal" /><span>ตรวจจำนวน Gate และทดสอบ Scanner ก่อนเปิดรับคนหน้างาน</span></p><p className="flex items-start gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-warning" /><span>ตรวจรายชื่อและสร้าง QR ให้ครบก่อนส่งบัตร</span></p></div> : <InlineNotice tone="info">ตั้งค่ากิจกรรมก่อน ระบบจะแสดงรายการตรวจที่เกี่ยวข้องที่นี่</InlineNotice>}</CardContent></Card></section>
  </>;
}