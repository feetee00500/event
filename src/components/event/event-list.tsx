"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Grid2X2, List, MoreHorizontal, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import type { EventListItem } from "@/lib/server-data";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineNotice } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { EventCard } from "@/components/event/event-card";
import { PRODUCT_NAME } from "@/lib/branding";
import { formatBangkokDateTime } from "@/lib/timezone";

const statusLabels: Record<string, string> = { ALL: "ทุกสถานะ", DRAFT: "ฉบับร่าง", PUBLISHED: "เผยแพร่", ACTIVE: "กำลังใช้งาน", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก" };
type DateFilter = "ALL" | "UPCOMING" | "PAST";
type SortMode = "DATE" | "NAME" | "CHECKIN";

export function EventList({ initialEvents, canWrite }: { initialEvents: EventListItem[]; canWrite: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("DATE");
  const [view, setView] = useState<"card" | "table">("card");
  const [selected, setSelected] = useState<EventListItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const events = useMemo(() => {
    const filtered = initialEvents.filter((event) => {
      const matchesSearch = !search || `${event.name} ${event.venue}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "ALL" || event.status === status;
      const time = new Date(event.startAt).getTime();
      const matchesDate = dateFilter === "ALL" || (dateFilter === "UPCOMING" ? time >= now : time < now);
      return matchesSearch && matchesStatus && matchesDate;
    });
    return [...filtered].sort((a, b) => sort === "NAME" ? a.name.localeCompare(b.name, "th") : sort === "CHECKIN" ? b.checkedIn - a.checkedIn : new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [dateFilter, initialEvents, now, search, sort, status]);
  const hasFilters = Boolean(search || status !== "ALL" || dateFilter !== "ALL");

  function clearFilters() { setSearch(""); setStatus("ALL"); setDateFilter("ALL"); setSort("DATE"); }
  async function cancelEvent() {
    if (!selected) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/events/${selected.id}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.error ?? "ไม่สามารถยกเลิก Event ได้"); setBusy(false); return; }
    window.location.reload();
  }

  return <>
    {error ? <div className="mb-4"><InlineNotice tone="error">{error}</InlineNotice></div> : null}
    <Card>
      <CardContent>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_180px_170px]">
            <Field label="ค้นหากิจกรรม"><div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อกิจกรรมหรือสถานที่" /></div></Field>
            <Field label="สถานะ"><Select value={status} onChange={(event) => setStatus(event.target.value)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
            <Field label="ช่วงเวลา"><Select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}><option value="ALL">ทุกช่วงเวลา</option><option value="UPCOMING">กำลังจะถึง</option><option value="PAST">ผ่านมาแล้ว</option></Select></Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Field label="เรียงตาม" className="min-w-[150px]"><Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="DATE">วันเริ่มงาน</option><option value="NAME">ชื่อกิจกรรม</option><option value="CHECKIN">Check-in มากสุด</option></Select></Field>
            <div className="flex self-end rounded-lg border border-line bg-paper p-1" aria-label="รูปแบบการแสดงผล"><button type="button" className={`touch-target rounded-md ${view === "card" ? "bg-white text-primary shadow-subtle" : "text-muted"}`} aria-label="มุมมองการ์ด" aria-pressed={view === "card"} onClick={() => setView("card")}><Grid2X2 size={17} /></button><button type="button" className={`touch-target rounded-md ${view === "table" ? "bg-white text-primary shadow-subtle" : "text-muted"}`} aria-label="มุมมองตาราง" aria-pressed={view === "table"} onClick={() => setView("table")}><List size={18} /></button></div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="text-sm text-muted">พบ <strong className="text-ink">{events.length}</strong> จาก {initialEvents.length} กิจกรรม</p>{hasFilters ? <button type="button" className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold text-primary hover:bg-[#eaf6f3]" onClick={clearFilters}><X size={15} />ล้างตัวกรอง</button> : <span className="inline-flex items-center gap-1.5 text-xs text-muted"><SlidersHorizontal size={14} />กรองข้อมูลได้ทันที</span>}</div>
      </CardContent>
    </Card>

    <div className="mt-5">
      {events.length === 0 ? <Card><CardContent><EmptyState title={hasFilters ? "ไม่พบกิจกรรมที่ตรงเงื่อนไข" : "ยังไม่มีกิจกรรม"} description={hasFilters ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด" : `เริ่มต้นด้วยการตั้งค่ากิจกรรม ${PRODUCT_NAME}`} action={canWrite && !hasFilters ? <Button href="/admin/events/new">สร้างกิจกรรม</Button> : undefined} /></CardContent></Card> : view === "card" ? <div className="grid gap-5 md:grid-cols-2">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <Card><CardContent className="p-0"><div className="table-scroll"><table className="data-table"><thead><tr><th>กิจกรรม</th><th>วันเวลา</th><th>ผู้เข้าร่วม</th><th>Check-in</th><th>สถานะ</th><th className="text-right">การทำงาน</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td><Link href={`/admin/events/${event.id}`} className="flex min-w-[240px] items-center gap-3 font-semibold hover:text-primary"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white"><CalendarDays size={17} /></span><span><span className="block truncate">{event.name}</span><span className="mt-0.5 block max-w-[240px] truncate text-xs font-normal text-muted">{event.venue}</span></span></Link></td><td className="whitespace-nowrap text-sm text-muted">{formatBangkokDateTime(event.startAt)}</td><td className="mono text-sm">{event.registered.toLocaleString("th-TH")}</td><td className="mono text-sm">{event.checkedIn.toLocaleString("th-TH")} / {event.registered.toLocaleString("th-TH")}</td><td><StatusBadge status={event.status} label={statusLabels[event.status] ?? event.status} /></td><td><div className="flex justify-end gap-1"><Button href={`/admin/events/${event.id}`} variant="ghost" size="sm">เปิด</Button>{canWrite ? <details className="relative"><summary className="focus-ring touch-target list-none rounded-md text-muted hover:bg-paper"><MoreHorizontal size={18} /><span className="sr-only">เมนูกิจกรรม {event.name}</span></summary><div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-line bg-white p-1 shadow-soft"><Link className="block rounded-md px-3 py-2 text-sm hover:bg-paper" href={`/admin/events/${event.id}/edit`}>แก้ไขกิจกรรม</Link>{event.status !== "CANCELLED" ? <button type="button" className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-[#fff4f4]" onClick={() => setSelected(event)}><Trash2 size={15} />ยกเลิกกิจกรรม</button> : null}</div></details> : null}</div></td></tr>)}</tbody></table></div></CardContent></Card>}
    </div>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="ยืนยันการยกเลิกกิจกรรม" description="ประวัติการลงทะเบียนและ Check-in จะไม่ถูกลบ แต่บัตรจะไม่สามารถใช้เข้างานได้"><p className="text-sm leading-6 text-muted">ต้องการยกเลิก <strong className="text-ink">{selected?.name}</strong> ใช่หรือไม่</p><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setSelected(null)}>กลับ</Button><Button variant="danger" disabled={busy} onClick={() => void cancelEvent()}>{busy ? "กำลังดำเนินการ" : "ยืนยันยกเลิก"}</Button></div></Modal>
  </>;
}