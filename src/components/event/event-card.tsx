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
  const eventHref = "/admin/events/" + event.id;
  return (
    <article className="group overflow-hidden rounded-md border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft">
      <Link href={eventHref} className="focus-ring block">
        <div className="relative aspect-[16/7] overflow-hidden bg-ink">
          {event.imageUrl ? <div className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.02]" style={{ backgroundImage: "linear-gradient(90deg, rgba(23,23,23,.84), rgba(23,23,23,.22)), url(" + event.imageUrl + ")" }} aria-label={"ภาพปก " + event.name} role="img" /> : <div className="absolute inset-0 bg-ink"><div className="absolute inset-y-0 right-0 w-1/3 border-l border-white/10 bg-white/[0.03]" /></div>}
          <div className="absolute inset-0 flex flex-col justify-between p-4 text-white sm:p-5">
            <div className="flex items-start justify-between gap-3"><span className="mono text-[10px] font-medium uppercase tracking-[0.12em] text-white/65">Event record</span><StatusBadge status={event.status} label={labels[event.status] ?? event.status} /></div>
            <p className="max-w-2xl text-xl font-semibold leading-tight tracking-[-0.045em] sm:text-2xl">{event.name}</p>
          </div>
        </div>
      </Link>
      <div className="p-4 sm:p-5">
        <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
          <p className="flex min-w-0 items-start gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-link" aria-hidden="true" /><span>{formatBangkokDateTime(event.startAt)}</span></p>
          <p className="flex min-w-0 items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-link" aria-hidden="true" /><span className="truncate" title={event.venue}>{event.venue}</span></p>
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3 text-xs"><span className="inline-flex items-center gap-1.5 text-muted"><UsersRound size={14} aria-hidden="true" />{event.registered.toLocaleString("th-TH")} ผู้เข้าร่วม</span><span className="mono font-medium text-ink">{event.checkedIn.toLocaleString("th-TH")} / {event.registered.toLocaleString("th-TH")}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0f0f0]" aria-label={"Check-in " + progress + "%"} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-link transition-[width] duration-300" style={{ width: progress + "%" }} /></div>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-muted">Check-in {progress}%</span><Link href={eventHref} className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-sm px-2 text-sm font-medium text-link hover:bg-[#eef6ff]">เปิดงาน<ArrowRight size={15} aria-hidden="true" /></Link></div>
        </div>
      </div>
    </article>
  );
}
