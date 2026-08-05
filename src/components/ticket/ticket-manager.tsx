"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Copy, ExternalLink, QrCode, RefreshCw, Ticket as TicketIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, InlineNotice } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PrintButton } from "@/components/report/print-button";
import { PRODUCT_NAME } from "@/lib/branding";

const IirfaTicketPass = dynamic(
  () => import("@/components/ticket/iirfa-ticket-pass").then((module) => module.IirfaTicketPass),
  { ssr: false, loading: () => <div className="min-h-[520px] animate-pulse rounded-md bg-paper" aria-label="กำลังเตรียม QR บัตร" /> },
);

export type TicketRow = { id: string; ticketNumber: string; ticketType: string; status: string; issuedAt: string; expiresAt: string | null; checkedInAt: string | null; attendeeStatus: string; attendee: { name: string; email: string | null } };
type TicketEvent = { name: string; startAt: string; endAt: string; venue: string };
type Confirmation = { action: "regenerate" | "toggle"; ticket: TicketRow } | null;
type PreviewToken = { ticketNumber: string; publicToken: string; publicUrl: string; attendeeName: string; ticketType: string };
const labels: Record<string, string> = { ACTIVE: "ใช้งานได้", CHECKED_IN: "Check-in แล้ว", CANCELLED: "ยกเลิก", EXPIRED: "หมดอายุ" };
const attendeeLabels: Record<string, string> = { REGISTERED: "ลงทะเบียนแล้ว", QR_GENERATED: "สร้าง QR แล้ว", DELIVERED: "ส่งบัตรแล้ว", CHECKED_IN: "Check-in แล้ว", CANCELLED: "ยกเลิก", NO_SHOW: "ไม่มาร่วมงาน" };
const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });

export function TicketManager({ event, initialTickets, canWrite }: { event: TicketEvent; initialTickets: TicketRow[]; canWrite: boolean }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [busy, setBusy] = useState("");
  const [token, setToken] = useState<PreviewToken | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const activeCount = tickets.filter((ticket) => ticket.status === "ACTIVE").length;
  const checkedInCount = tickets.filter((ticket) => ticket.status === "CHECKED_IN").length;
  const cancelledCount = tickets.filter((ticket) => ticket.status === "CANCELLED").length;

  async function regenerate(ticket: TicketRow) { setBusy(ticket.id); setMessage(null); const response = await fetch(`/api/tickets/${ticket.id}/regenerate`, { method: "POST" }); const body = await response.json().catch(() => ({})); if (!response.ok) setMessage({ tone: "error", text: body.error ?? "สร้าง QR ใหม่ไม่สำเร็จ" }); else { setToken({ ...body.ticket, attendeeName: ticket.attendee.name, ticketType: ticket.ticketType }); setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: "ACTIVE", attendeeStatus: "QR_GENERATED" } : item)); } setBusy(""); }
  async function toggleCancel(ticket: TicketRow) { setBusy(ticket.id); const action = ticket.status === "CANCELLED" ? "reactivate" : "cancel"; const response = await fetch(`/api/tickets/${ticket.id}/${action}`, { method: "POST" }); const body = await response.json().catch(() => ({})); if (!response.ok) setMessage({ tone: "error", text: body.error ?? "เปลี่ยนสถานะ Ticket ไม่สำเร็จ" }); else setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: action === "cancel" ? "CANCELLED" : "ACTIVE", attendeeStatus: action === "cancel" ? "CANCELLED" : "QR_GENERATED" } : item)); setBusy(""); }
  async function copy(value: string) { try { await navigator.clipboard?.writeText(value); setMessage({ tone: "success", text: "คัดลอกลิงก์แล้ว" }); } catch { setMessage({ tone: "error", text: "ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอกด้วยตนเอง" }); } }
  function askRegenerate(ticket: TicketRow) { if (canWrite) setConfirmation({ action: "regenerate", ticket }); }
  function askToggle(ticket: TicketRow) { if (canWrite) setConfirmation({ action: "toggle", ticket }); }
  async function confirmAction() { if (!confirmation) return; const { action, ticket } = confirmation; setConfirmation(null); if (action === "regenerate") await regenerate(ticket); else await toggleCancel(ticket); }
  const previewDate = dateTimeFormatter.format(new Date(event.startAt));

  return <>
    {message ? <div className="mb-4"><InlineNotice tone={message.tone}>{message.text}</InlineNotice></div> : null}
    <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="สรุปบัตร"><TicketSummary label="บัตรทั้งหมด" value={tickets.length} icon={TicketIcon} /><TicketSummary label="ใช้งานได้" value={activeCount} icon={QrCode} tone="success" /><TicketSummary label="Check-in แล้ว" value={checkedInCount} icon={QrCode} tone="primary" detail={cancelledCount ? `ยกเลิก ${cancelledCount} ใบ` : undefined} /></section>
    <Card><CardContent className="p-0">{tickets.length ? <div className="table-scroll"><table className="data-table"><caption className="sr-only">รายการบัตรของกิจกรรม {event.name}</caption><thead><tr><th>ผู้เข้าร่วม</th><th>Ticket Number</th><th>ประเภท</th><th>สถานะผู้เข้าร่วม</th><th>ออกบัตร / หมดอายุ</th><th>สถานะบัตร</th><th>การทำงาน</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><p className="min-w-[180px] font-semibold">{ticket.attendee.name}</p><p className="text-xs text-muted">{ticket.attendee.email || "—"}</p></td><td className="mono whitespace-nowrap text-xs">{ticket.ticketNumber}</td><td><span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-xs font-semibold text-[#0761d1]">{ticket.ticketType}</span></td><td><span className="whitespace-nowrap text-xs text-muted">{attendeeLabels[ticket.attendeeStatus] ?? ticket.attendeeStatus}</span></td><td className="whitespace-nowrap text-xs text-muted"><span className="block">{dateFormatter.format(new Date(ticket.issuedAt))}</span>{ticket.expiresAt ? <span className="mt-1 block text-[11px]">หมดอายุ {dateFormatter.format(new Date(ticket.expiresAt))}</span> : <span className="mt-1 block text-[11px]">ไม่กำหนด</span>}</td><td><StatusBadge status={ticket.status} label={labels[ticket.status] ?? ticket.status} />{ticket.checkedInAt ? <span className="mt-1 block text-[11px] text-muted">{dateFormatter.format(new Date(ticket.checkedInAt))}</span> : null}</td><td><div className="flex min-w-[230px] flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={() => askRegenerate(ticket)} disabled={!canWrite || Boolean(busy)}><RefreshCw size={15} />สร้าง QR ใหม่</Button>{canWrite ? <Button size="sm" variant="ghost" className={ticket.status === "CANCELLED" ? "text-success" : "text-danger"} onClick={() => askToggle(ticket)} disabled={Boolean(busy)}>{ticket.status === "CANCELLED" ? <QrCode size={15} /> : <XCircle size={15} />}{ticket.status === "CANCELLED" ? "เปิดใช้" : "ยกเลิก"}</Button> : null}</div></td></tr>)}</tbody></table></div> : <EmptyState title="ยังไม่มี Ticket" description="เพิ่มผู้เข้าร่วมเพื่อออก Ticket และ QR Code" />}</CardContent></Card>
    <Modal open={Boolean(confirmation)} onClose={() => setConfirmation(null)} title={confirmation?.action === "regenerate" ? "สร้าง QR ใหม่หรือไม่" : confirmation?.ticket.status === "CANCELLED" ? "เปิดใช้บัตรอีกครั้งหรือไม่" : "ยกเลิกบัตรหรือไม่"} description="การเปลี่ยนสถานะจะมีผลกับการใช้งานบัตรใบนี้ทันที"><div className="space-y-4"><p className="text-sm leading-6 text-muted">{confirmation?.ticket.attendee.name} · <span className="mono">{confirmation?.ticket.ticketNumber}</span>{confirmation?.action === "regenerate" ? " — QR เดิมจะใช้ไม่ได้ และระบบจะแสดงลิงก์ใหม่เพียงครั้งเดียว" : " — ตรวจสอบรายการนี้ก่อนดำเนินการ"}</p><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmation(null)}>กลับไปตรวจสอบ</Button><Button variant={confirmation?.action === "toggle" && confirmation.ticket.status !== "CANCELLED" ? "danger" : "primary"} onClick={() => void confirmAction()}>ยืนยัน</Button></div></div></Modal>
    <Modal open={Boolean(token)} onClose={() => setToken(null)} title={`บัตร ${PRODUCT_NAME} · ${token?.ticketNumber ?? ""}`} description="QR ใหม่พร้อมใช้งาน ลิงก์บัตรจะแสดงเฉพาะในรอบนี้"><div className="mx-auto max-w-[620px]">{token ? <IirfaTicketPass token={token.publicToken} attendeeName={token.attendeeName} ticketNumber={token.ticketNumber} ticketType={token.ticketType} eventName={event.name} eventDate={previewDate} venue={event.venue} showDownload /> : null}<p className="mt-4 break-all text-center text-xs text-muted">{token?.publicUrl}</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={() => token && void copy(token.publicUrl)}><Copy size={16} />คัดลอกลิงก์บัตร</Button>{token ? <Button href={token.publicUrl} target="_blank"><ExternalLink size={16} />เปิดบัตรดิจิทัล</Button> : null}<PrintButton label="พิมพ์บัตร" /></div></div></Modal>
  </>;
}

function TicketSummary({ label, value, icon: Icon, tone = "primary", detail }: { label: string; value: number; icon: typeof TicketIcon; tone?: "primary" | "success"; detail?: string }) { return <Card className="p-4"><div className="flex items-center justify-between gap-3"><span className={`grid h-9 w-9 place-items-center rounded-lg ${tone === "success" ? "bg-[#eef6ff] text-success" : "bg-[#eef6ff] text-primary"}`}><Icon size={18} /></span><span className="mono text-2xl font-semibold">{value.toLocaleString("th-TH")}</span></div><p className="mt-3 text-sm font-semibold">{label}</p>{detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}</Card>; }