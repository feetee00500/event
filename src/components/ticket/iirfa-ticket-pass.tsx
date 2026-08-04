"use client";

import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { TicketQr } from "@/components/ticket/ticket-qr";
import { PRODUCT_NAME } from "@/lib/branding";

type TicketPassProps = {
  token: string;
  attendeeName: string;
  ticketNumber: string;
  ticketType: string;
  eventName: string;
  eventDate: string;
  venue: string;
  statusLabel?: string;
  invalid?: boolean;
  showDownload?: boolean;
};

export function IirfaTicketPass({ token, attendeeName, ticketNumber, ticketType, eventName, eventDate, venue, statusLabel = "READY TO CHECK IN", invalid = false, showDownload = false }: TicketPassProps) {
  const statusClass = invalid ? "border-[#f4b7bb] bg-[#f7d4d6] text-[#c50000]" : "border-[#50e3c2]/50 bg-white/10 text-[#aaffec]";
  return (
    <article className="relative w-full overflow-hidden rounded-md border border-line bg-white text-ink shadow-soft">
      <header className="relative overflow-hidden border-t-2 border-[#50e3c2] bg-ink px-6 pb-7 pt-6 text-white sm:px-8">
        <div className="relative flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-white text-ink"><span className="h-3 w-3 rounded-full bg-[#50e3c2]" /></span>
              <span className="text-xl font-semibold tracking-[-0.05em]">{PRODUCT_NAME}</span>
            </div>
            <p className="mono mt-5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">The 13th Insurance Information &amp; Ratemaking Forum of Asia</p>
            <h2 className="mt-3 max-w-sm text-2xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[1.8rem]">DECODING<br /><span className="text-[#50e3c2]">TOMORROW&apos;S RISKS</span></h2>
          </div>
          <span className={["relative shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.08em]", statusClass].join(" ")}>{statusLabel}</span>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1fr_176px] sm:px-8 sm:py-7">
        <div className="min-w-0">
          <p className="mono text-[10px] font-medium uppercase tracking-[0.12em] text-link">Official digital pass</p>
          <p className="mt-2 break-words text-xl font-semibold tracking-[-0.04em]">{attendeeName}</p>
          <div className="mt-5 grid gap-3 text-sm">
            <p className="flex min-w-0 items-start gap-2.5"><CalendarDays className="mt-0.5 shrink-0 text-link" size={17} /><span>{eventDate}</span></p>
            <p className="flex min-w-0 items-start gap-2.5"><MapPin className="mt-0.5 shrink-0 text-link" size={17} /><span className="leading-5">{venue}</span></p>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <div><dt className="mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Ticket</dt><dd className="mono mt-1 truncate text-[11px] font-medium">{ticketNumber}</dd></div>
            <div><dt className="mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Access</dt><dd className="mt-1 text-xs font-medium">{ticketType}</dd></div>
          </dl>
        </div>
        <div className="flex flex-col items-center justify-center rounded-md border border-line bg-paper p-3">
          <TicketQr token={token} size={176} showDownload={showDownload} downloadName={ticketNumber + "-qr.png"} />
          <p className="mono mt-2 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.08em] text-muted"><ShieldCheck size={12} />Scan at entrance</p>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-dashed border-line px-6 py-3 text-[10px] text-muted sm:px-8">
        <span className="truncate">{eventName}</span>
        <span className="mono shrink-0 font-medium text-ink">tird.insure/iirfa</span>
      </footer>
    </article>
  );
}
