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
  return (
    <article className="relative w-full overflow-hidden rounded-[20px] border border-[#cbd8e4] bg-white text-[#002756] shadow-[0_24px_70px_rgba(0,39,86,0.18)]">
      <header className="relative overflow-hidden bg-[#002756] px-6 pb-7 pt-6 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-8 -top-20 h-48 w-48 rotate-45 border-[24px] border-[#0da48e]/25" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-36 w-36 rotate-45 border-[18px] border-white/5" />
        <div className="relative flex items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 rotate-45 place-items-center rounded-[5px] bg-[#0da48e]"><span className="h-3 w-3 rounded-full border-2 border-white" /></span>
              <span className="text-xl font-black tracking-[-0.04em]">{PRODUCT_NAME}</span>
            </div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7bdcb5]">The 13th Insurance Information &amp; Ratemaking Forum of Asia</p>
            <h2 className="mt-2 max-w-sm text-2xl font-black leading-[1.08] tracking-[-0.035em] sm:text-[1.8rem]">DECODING<br /><span className="text-[#22c7ae]">TOMORROW&apos;S RISKS</span></h2>
          </div>
          <span className={`relative rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${invalid ? "border-[#ffb4aa] bg-[#6f1d17] text-white" : "border-[#7bdcb5]/60 bg-[#0da48e]/15 text-[#baf3df]"}`}>{statusLabel}</span>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1fr_176px] sm:px-8 sm:py-7">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0da48e]">Official digital pass</p>
          <p className="mt-1 truncate text-xl font-black tracking-[-0.02em]">{attendeeName}</p>
          <div className="mt-5 grid gap-3 text-sm">
            <p className="flex items-start gap-2.5"><CalendarDays className="mt-0.5 shrink-0 text-[#0da48e]" size={17} /><span>{eventDate}</span></p>
            <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 shrink-0 text-[#0da48e]" size={17} /><span className="leading-5">{venue}</span></p>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#d9e2ea] pt-4">
            <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#67809a]">Ticket</dt><dd className="mono mt-1 truncate text-[11px] font-semibold">{ticketNumber}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#67809a]">Access</dt><dd className="mt-1 text-xs font-bold">{ticketType}</dd></div>
          </dl>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#d9e2ea] bg-[#f5faf9] p-3">
          <TicketQr token={token} size={176} showDownload={showDownload} downloadName={`${ticketNumber}-qr.png`} />
          <p className="mt-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#557087]"><ShieldCheck size={12} />Scan at entrance</p>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-dashed border-[#b9c9d7] px-6 py-3 text-[10px] text-[#67809a] sm:px-8">
        <span className="truncate">{eventName}</span>
        <span className="shrink-0 font-semibold text-[#002756]">tird.insure/iirfa</span>
      </footer>
    </article>
  );
}