"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, UsersRound } from "lucide-react";
import type { EventStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { formatBangkokDateTime } from "@/lib/timezone";

export type EventCardData = {
  id: string;
  name: string;
  venue: string;
  startAt: string;
  endAt?: string;
  status: EventStatus | string;
  registered: number;
  checkedIn: number;
  imageUrl?: string | null;
};

const labels: Record<string, string> = { DRAFT: "ฉบับร่าง", PUBLISHED: "เผยแพร่", ACTIVE: "กำลังใช้งาน", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก" };

export function EventCard({ event }: { event: EventCardData }) {
  const progress = event.registered ? Math.min(100, Math.round((event.checkedIn / event.registered) * 100)) : 0;
  return (
    <article className="group overflow-hidden rounded-lg border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
      <Link href={`/admin/events/${event.id}`} className="focus-ring block">
        <div className="relative aspect-[16/7] overflow-hidden bg-navy">
          {event.imageUrl ? <div className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.02]" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,39,86,.78), rgba(0,39,86,.18)), url(${event.imageUrl})` }} aria-label={`ภาพปก ${event.name}`} role="img" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(34,199,174,.45),transparent_30%),linear-gradient(115deg,#002756_10%,#0b4f73_55%,#087a6f)]"><span className="absolute -right-8 -top-14 h-40 w-40 rotate-45 border-[18px] border-white/10" /></div>}
          <div className="absolute inset-0 flex flex-col justify-between p-4 text-white sm:p-5">
            <div className="flex items-start justify-between gap-3"><span className="mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Event record</span><StatusBadge status={event.status} label={labels[event.status] ?? event.status} /></div>
            <p className="max-w-2xl text-xl font-bold leading-tight tracking-[-0.025em] sm:text-2xl">{event.name}</p>
          </div>
        </div>
      </Link>
      <div className="p-4 sm:p-5">
        <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
          <p className="flex min-w-0 items-start gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /><span>{formatBangkokDateTime(event.startAt)}</span></p>
          <p className="flex min-w-0 items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /><span className="truncate" title={event.venue}>{event.venue}</span></p>
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3 text-xs"><span className="inline-flex items-center gap-1.5 text-muted"><UsersRound size={14} aria-hidden="true" />{event.registered.toLocaleString("th-TH")} ผู้เข้าร่วม</span><span className="mono font-semibold text-ink">{event.checkedIn.toLocaleString("th-TH")} / {event.registered.toLocaleString("th-TH")}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dce9ed]" aria-label={`Check-in ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-muted">Check-in {progress}%</span><Link href={`/admin/events/${event.id}`} className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold text-primary hover:bg-[#eaf6f3]">เปิดงาน<ArrowRight size={15} aria-hidden="true" /></Link></div>
        </div>
      </div>
    </article>
  );
}
