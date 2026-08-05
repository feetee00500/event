"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CheckCircle2, Download, Edit3, FileSpreadsheet, Loader2, Plus, RefreshCw, Search, Ticket, Trash2, Upload, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, InlineNotice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export type AttendeeRow = {
  id: string;
  title: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  referenceCode: string | null;
  note: string | null;
  status: string;
  ticket: {
    id: string;
    ticketNumber: string;
    ticketType: string;
    status: string;
    checkedInAt: string | null;
  } | null;
};

type Form = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  referenceCode: string;
  ticketType: string;
  note: string;
};

const blank: Form = {
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  referenceCode: "",
  ticketType: "General",
  note: "",
};

const attendeeStatus: Record<string, string> = {
  REGISTERED: "ลงทะเบียน",
  QR_GENERATED: "สร้าง QR แล้ว",
  DELIVERED: "ส่งบัตรแล้ว",
  CHECKED_IN: "Check-in แล้ว",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มา",
};

export function AttendeeManager({ eventId, initialAttendees, canWrite }: { eventId: string; initialAttendees: AttendeeRow[]; canWrite: boolean }) {
  const router = useRouter();
  const [attendees, setAttendees] = useState(initialAttendees);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<AttendeeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendeeRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => { setAttendees(initialAttendees); }, [initialAttendees]);
  const deferredSearch = useDebouncedValue(search, 300);
  const rows = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    return attendees.filter((row) => {
      const searchable = `${row.title ?? ""} ${row.firstName} ${row.lastName} ${row.email ?? ""} ${row.phone ?? ""} ${row.company ?? ""} ${row.referenceCode ?? ""}`.toLowerCase();
      return (!normalizedSearch || searchable.includes(normalizedSearch)) && (status === "ALL" || row.status === status);
    });
  }, [attendees, deferredSearch, status]);

  const summary = useMemo(() => attendees.reduce((counts, row) => {
    counts.ticketCount += row.ticket ? 1 : 0;
    counts.checkedInCount += row.status === "CHECKED_IN" || Boolean(row.ticket?.checkedInAt) ? 1 : 0;
    counts.cancelledCount += row.status === "CANCELLED" ? 1 : 0;
    return counts;
  }, { ticketCount: 0, checkedInCount: 0, cancelledCount: 0 }), [attendees]);
  const totalCount = attendees.length;
  const { ticketCount, checkedInCount, cancelledCount } = summary;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.id));

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setMessage(null);
    setFormOpen(true);
  }

  function openEdit(attendee: AttendeeRow) {
    setEditing(attendee);
    setForm({
      title: attendee.title ?? "",
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      email: attendee.email ?? "",
      phone: attendee.phone ?? "",
      company: attendee.company ?? "",
      referenceCode: attendee.referenceCode ?? "",
      ticketType: attendee.ticket?.ticketType ?? "General",
      note: attendee.note ?? "",
    });
    setMessage(null);
    setFormOpen(true);
  }

  function resetForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function closeForm() {
    if (busy) return;
    resetForm();
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? [] : rows.map((row) => row.id));
  }

  function setFormField(field: keyof Form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveAttendee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const isEditing = Boolean(editing);
    const response = await fetch(isEditing ? `/api/events/${eventId}/attendees/${editing?.id}` : `/api/events/${eventId}/attendees`, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage({ tone: "error", text: body.error ?? (isEditing ? "แก้ไขผู้เข้าร่วมไม่สำเร็จ" : "เพิ่มผู้เข้าร่วมไม่สำเร็จ") });
      setBusy(false);
      return;
    }

    if (isEditing && editing) {
      setAttendees((current) => current.map((row) => row.id === editing.id ? {
        ...row,
        title: form.title || null,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        referenceCode: form.referenceCode || null,
        note: form.note || null,
        ticket: row.ticket ? { ...row.ticket, ticketType: form.ticketType } : null,
      } : row));
      setMessage({ tone: "success", text: `แก้ไข ${form.firstName} ${form.lastName} แล้ว` });
    } else if (body.attendee) {
      const attendee: AttendeeRow = {
        id: body.attendee.id,
        title: body.attendee.title ?? null,
        firstName: body.attendee.firstName,
        lastName: body.attendee.lastName,
        email: body.attendee.email ?? null,
        phone: body.attendee.phone ?? null,
        company: body.attendee.company ?? null,
        referenceCode: body.attendee.referenceCode ?? null,
        note: body.attendee.note ?? null,
        status: body.attendee.status ?? "REGISTERED",
        ticket: body.ticket ? { id: body.ticket.id, ticketNumber: body.ticket.ticketNumber, ticketType: body.ticket.ticketType, status: "ACTIVE", checkedInAt: null } : null,
      };
      setAttendees((current) => [attendee, ...current]);
      setMessage({ tone: "success", text: `เพิ่ม ${form.firstName} ${form.lastName} และสร้าง Ticket แล้ว` });
    }

    resetForm();
    setBusy(false);
  }

  async function deleteAttendee() {
    if (!deleteTarget) return;
    setBusy(true);
    setMessage(null);
    const target = deleteTarget;
    const response = await fetch(`/api/events/${eventId}/attendees/${target.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({ tone: "error", text: body.error ?? "ลบผู้เข้าร่วมไม่สำเร็จ" });
      setBusy(false);
      return;
    }
    setAttendees((current) => current.map((row) => row.id === target.id ? { ...row, status: "CANCELLED", ticket: row.ticket ? { ...row.ticket, status: "CANCELLED" } : null } : row));
    setSelected((current) => current.filter((id) => id !== target.id));
    setDeleteTarget(null);
    setMessage({ tone: "success", text: `ลบ ${target.firstName} ${target.lastName} แล้ว` });
    setBusy(false);
  }

  async function generateSelected() {
    if (!selected.length) return;
    setBusy(true);
    const response = await fetch(`/api/events/${eventId}/tickets/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendeeIds: selected }) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? { tone: "success", text: `สร้าง QR ใหม่แล้ว ${body.generated?.length ?? 0} รายการ` } : { tone: "error", text: body.error ?? "สร้าง QR ไม่สำเร็จ" });
    setSelected([]);
    setBusy(false);
    if (response.ok) router.refresh();
  }

  async function chooseFile(next: File | null) {
    setFile(next);
    setPreview([]);
    if (!next) return;
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await next.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setPreview(XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }).slice(0, 6));
    } catch {
      setMessage({ tone: "error", text: "อ่านไฟล์ตัวอย่างไม่สำเร็จ" });
    }
  }

  async function importFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    const data = new FormData();
    data.append("file", file);
    const response = await fetch(`/api/events/${eventId}/attendees/import`, { method: "POST", body: data });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? { tone: "success", text: `นำเข้าสำเร็จ ${body.imported ?? 0} รายการ · ไม่ผ่าน ${body.rejected ?? 0} รายการ` } : { tone: "error", text: body.error ?? "นำเข้าไม่สำเร็จ" });
    setBusy(false);
    if (response.ok) {
      setImportOpen(false);
      setFile(null);
      setPreview([]);
      router.refresh();
    }
  }

  return <>
    {message ? <div className="mb-4"><InlineNotice tone={message.tone}>{message.text}</InlineNotice></div> : null}

    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="สรุปผู้เข้าร่วม">
      <AttendeeSummary icon={UsersRound} label="ผู้เข้าร่วมทั้งหมด" value={totalCount} />
      <AttendeeSummary icon={Ticket} label="มีบัตรแล้ว" value={ticketCount} tone="success" />
      <AttendeeSummary icon={CheckCircle2} label="Check-in แล้ว" value={checkedInCount} tone="success" />
      <AttendeeSummary icon={UsersRound} label="ยกเลิก" value={cancelledCount} tone="danger" />
    </section>

    <Card>
      <CardContent>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
            <Field label="ค้นหาผู้เข้าร่วม">
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อ, อีเมล หรือเลขอ้างอิง" />
              </div>
            </Field>
            <Field label="สถานะ">
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">ทุกสถานะ</option>
                {Object.entries(attendeeStatus).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => setImportOpen(true)} disabled={!canWrite}><Upload size={16} />Import</Button>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" href={`/api/events/${eventId}/attendees/export`}><Download size={16} />Export</Button>
            {canWrite ? <Button size="sm" className="col-span-2 w-full sm:w-auto" onClick={openCreate}><Plus size={16} />เพิ่มคน</Button> : null}
          </div>
        </div>

        {canWrite && selected.length ? <div className="mt-4 flex flex-wrap items-center gap-3 rounded-sm border border-[#dcd9ff] bg-[#faf7ff] px-3 py-2">
          <span className="text-sm font-semibold text-primary">เลือก {selected.length} รายการ</span>
          <Button size="sm" variant="secondary" onClick={() => void generateSelected()} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}สร้าง QR ใหม่</Button>
          <button type="button" className="focus-ring touch-target ml-auto rounded-sm text-muted" aria-label="ยกเลิกการเลือก" onClick={() => setSelected([])}><X size={16} /></button>
        </div> : null}
      </CardContent>
    </Card>

    <Card className="mt-5">
      <CardContent className="p-0">
        {rows.length ? <>
          <div className="hidden md:block">
            <div className="table-scroll">
              <table className="data-table">
                <caption className="sr-only">รายชื่อผู้เข้าร่วมงาน</caption>
                <thead><tr>{canWrite ? <th className="w-10"><input type="checkbox" aria-label="เลือกทั้งหมด" checked={allVisibleSelected} onChange={toggleAll} /></th> : null}<th>ผู้เข้าร่วม</th><th>ติดต่อ</th><th>Ticket</th><th>สถานะ</th>{canWrite ? <th className="text-right">การทำงาน</th> : null}</tr></thead>
                <tbody>{rows.map((row) => <tr key={row.id}>
                  {canWrite ? <td><input type="checkbox" aria-label={`เลือก ${row.firstName} ${row.lastName}`} checked={selectedSet.has(row.id)} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /></td> : null}
                  <td><div className="max-w-[260px]"><p className="font-semibold break-words">{row.title ? `${row.title} ` : ""}{row.firstName} {row.lastName}</p><p className="mt-0.5 break-words text-xs text-muted">{row.company || row.referenceCode || "ไม่มีข้อมูลเพิ่มเติม"}</p></div></td>
                  <td><p className="break-all text-sm">{row.email || "—"}</p><p className="text-xs text-muted">{row.phone || "—"}</p></td>
                  <td><p className="mono whitespace-nowrap text-xs">{row.ticket?.ticketNumber || "—"}</p><p className="mt-1 text-xs text-muted">{row.ticket?.ticketType || "—"}</p></td>
                  <td><StatusBadge status={row.status} label={attendeeStatus[row.status] ?? row.status} /></td>
                  {canWrite ? <td><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Edit3 size={15} />แก้ไข</Button><Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteTarget(row)}><Trash2 size={15} />ลบ</Button></div></td> : null}
                </tr>)}</tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-line md:hidden">
            {rows.map((row) => <article key={row.id} className="p-4">
              <div className="flex items-start gap-3">
                {canWrite ? <input className="mt-1 h-5 w-5 shrink-0" type="checkbox" aria-label={`เลือก ${row.firstName} ${row.lastName}`} checked={selectedSet.has(row.id)} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /> : null}
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words font-semibold">{row.title ? `${row.title} ` : ""}{row.firstName} {row.lastName}</h3><p className="mt-0.5 break-words text-xs text-muted">{row.company || row.referenceCode || "ไม่มีข้อมูลเพิ่มเติม"}</p></div><StatusBadge status={row.status} label={attendeeStatus[row.status] ?? row.status} /></div><dl className="mt-4 grid gap-2 text-sm"><div className="flex min-w-0 justify-between gap-3"><dt className="shrink-0 text-muted">ติดต่อ</dt><dd className="min-w-0 break-all text-right">{row.email || row.phone || "—"}</dd></div><div className="flex min-w-0 justify-between gap-3"><dt className="shrink-0 text-muted">Ticket</dt><dd className="mono min-w-0 break-all text-right text-xs">{row.ticket?.ticketNumber || "—"}</dd></div><div className="flex min-w-0 justify-between gap-3"><dt className="shrink-0 text-muted">ประเภท</dt><dd className="text-right">{row.ticket?.ticketType || "—"}</dd></div></dl>{canWrite ? <div className="mt-4 grid grid-cols-2 gap-2"><Button size="sm" variant="secondary" className="w-full" onClick={() => openEdit(row)}><Edit3 size={15} />แก้ไข</Button><Button size="sm" variant="ghost" className="w-full text-danger" onClick={() => setDeleteTarget(row)}><Trash2 size={15} />ลบ</Button></div> : null}</div>
              </div>
            </article>)}
          </div>
        </> : <EmptyState title={search || status !== "ALL" ? "ไม่พบผู้เข้าร่วมที่ตรงเงื่อนไข" : "ยังไม่มีผู้เข้าร่วม"} description="เพิ่มทีละคนหรือนำเข้าจาก CSV/Excel ได้ทันที" action={canWrite ? <Button onClick={openCreate}>เพิ่มผู้เข้าร่วม</Button> : undefined} />}
      </CardContent>
    </Card>

    <Modal open={formOpen} onClose={closeForm} title={editing ? "แก้ไขผู้เข้าร่วม" : "เพิ่มผู้เข้าร่วม"} description={editing ? "แก้ไขข้อมูลรายชื่อและประเภทบัตรได้จากหน้านี้" : "ระบบจะออก Ticket และ QR Token ให้ทันที"}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void saveAttendee(event)}>
        <Field label="คำนำหน้า"><Input value={form.title} onChange={(event) => setFormField("title", event.target.value)} placeholder="คุณ" /></Field>
        <Field label="ประเภทบัตร"><Select value={form.ticketType} onChange={(event) => setFormField("ticketType", event.target.value)}><option>General</option><option>VIP</option><option>Staff</option></Select></Field>
        <Field label="ชื่อ"><Input required value={form.firstName} onChange={(event) => setFormField("firstName", event.target.value)} /></Field>
        <Field label="นามสกุล"><Input required value={form.lastName} onChange={(event) => setFormField("lastName", event.target.value)} /></Field>
        <Field label="Email"><Input type="email" inputMode="email" value={form.email} onChange={(event) => setFormField("email", event.target.value)} /></Field>
        <Field label="เบอร์โทร"><Input inputMode="tel" value={form.phone} onChange={(event) => setFormField("phone", event.target.value)} /></Field>
        <Field label="บริษัท"><Input value={form.company} onChange={(event) => setFormField("company", event.target.value)} /></Field>
        <Field label="เลขอ้างอิง"><Input value={form.referenceCode} onChange={(event) => setFormField("referenceCode", event.target.value)} /></Field>
        <Field label="หมายเหตุ" className="sm:col-span-2"><Textarea value={form.note} onChange={(event) => setFormField("note", event.target.value)} /></Field>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={closeForm}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : editing ? <Edit3 size={16} /> : <Plus size={16} />}{busy ? "กำลังบันทึก" : editing ? "บันทึกการแก้ไข" : "เพิ่มผู้เข้าร่วม"}</Button></div>
      </form>
    </Modal>

    <Modal open={Boolean(deleteTarget)} onClose={() => { if (!busy) setDeleteTarget(null); }} title="ลบผู้เข้าร่วม" description="ระบบจะยกเลิกผู้เข้าร่วมและ Ticket แต่ยังเก็บประวัติ Check-in ไว้ตรวจสอบ">
      <div className="space-y-4"><p className="text-sm leading-6 text-muted">ต้องการลบ <strong className="text-ink">{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ออกจากรายการใช้งานหรือไม่</p><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={busy}>กลับไปตรวจสอบ</Button><Button variant="danger" onClick={() => void deleteAttendee()} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}ยืนยันลบ</Button></div></div>
    </Modal>

    <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import ผู้เข้าร่วม" description="รองรับ CSV และ Excel — ระบบจะตรวจสอบแต่ละแถวก่อนบันทึก">
      <form onSubmit={(event) => void importFile(event)}><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-[#d7c7f1] bg-[#faf7ff] px-5 py-8 text-center"><FileSpreadsheet size={26} className="text-primary" /><span className="mt-3 text-sm font-semibold">เลือกไฟล์ CSV / Excel</span><span className="mt-1 max-w-md text-xs leading-5 text-muted">หัวตารางที่รองรับ: ชื่อ, นามสกุล, Email, เบอร์โทร, บริษัท, เลขอ้างอิง, ประเภทบัตร</span><input className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)} /></label>{file ? <p className="mt-3 break-all text-sm text-muted">ไฟล์ที่เลือก: <strong className="text-ink">{file.name}</strong></p> : null}{preview.length ? <div className="mt-4 overflow-x-auto rounded-sm border border-line"><table className="min-w-full text-xs"><tbody>{preview.map((row, index) => <tr key={index} className={index === 0 ? "bg-[#f7f7fb] font-semibold" : ""}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-line px-2 py-2">{cell}</td>)}</tr>)}</tbody></table></div> : null}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setImportOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={!file || busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}นำเข้า</Button></div></form>
    </Modal>
  </>;
}

function AttendeeSummary({ icon: Icon, label, value, tone = "primary" }: { icon: typeof UsersRound; label: string; value: number; tone?: "primary" | "success" | "danger" }) {
  const toneClass = tone === "success" ? "bg-[#eef6ff] text-success" : tone === "danger" ? "bg-[#fff4f4] text-danger" : "bg-[#eef6ff] text-primary";
  return <Card className="p-4"><div className="flex items-center justify-between gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${toneClass}`}><Icon size={18} /></span><span className="mono text-2xl font-semibold">{value.toLocaleString("th-TH")}</span></div><p className="mt-3 break-words text-sm font-semibold">{label}</p></Card>;
}
