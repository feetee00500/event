"use client";

import { useRef, useState } from "react";
import { Copy, DoorOpen, Loader2, MapPin, Plus, Power, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, InlineNotice } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export type GateRow = { id: string; name: string; description: string | null; location: string | null; deviceCode: string | null; isActive: boolean; checkins: number };
type Form = { name: string; description: string; location: string; isActive: boolean };

export function GateManager({ eventId, initialGates, canWrite }: { eventId: string; initialGates: GateRow[]; canWrite: boolean }) {
  const [gates, setGates] = useState(initialGates); const busyRef = useRef(false); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<GateRow | null>(null); const [form, setForm] = useState<Form>({ name: "", description: "", location: "", isActive: true }); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  function startNew() { setEditing(null); setForm({ name: "", description: "", location: "", isActive: true }); setOpen(true); }
  function startEdit(gate: GateRow) { setEditing(gate); setForm({ name: gate.name, description: gate.description ?? "", location: gate.location ?? "", isActive: gate.isActive }); setOpen(true); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const url = editing ? "/api/gates/" + editing.id : "/api/events/" + eventId + "/gates";
      const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: body.error ?? "บันทึก Gate ไม่สำเร็จ" });
        return;
      }
      const saved = body.gate as Omit<GateRow, "checkins">;
      setGates((current) => {
        const existing = editing ? current.find((gate) => gate.id === editing.id) : undefined;
        const next: GateRow = { ...saved, checkins: existing?.checkins ?? 0 };
        return editing ? current.map((gate) => gate.id === editing.id ? next : gate) : [...current, next];
      });
      setMessage({ tone: "success", text: editing ? "แก้ไข Gate แล้ว" : "สร้าง Gate แล้ว" });
      setOpen(false);
    } catch {
      setMessage({ tone: "error", text: "ไม่สามารถเชื่อมต่อเพื่อบันทึก Gate ได้" });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function copy(code: string) { await navigator.clipboard?.writeText(code); setMessage({ tone: "success", text: "คัดลอก Device Code แล้ว" }); }
  return <>{message ? <div className="mb-4"><InlineNotice tone={message.tone}>{message.text}</InlineNotice></div> : null}<div className="mb-4 flex justify-end">{canWrite ? <Button onClick={startNew}><Plus size={17} />สร้าง Gate</Button> : null}</div>{gates.length ? <div className="grid gap-4 md:grid-cols-2">{gates.map((gate) => <Card key={gate.id}><CardContent><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-sm ${gate.isActive ? "bg-[#e4faf3] text-[#0761d1]" : "bg-[#f1f1f5] text-muted"}`}><DoorOpen size={20} /></span><div><h2 className="font-semibold">{gate.name}</h2><p className="mt-0.5 text-xs text-muted">{gate.description || "ไม่มีคำอธิบาย"}</p></div></div><Badge tone={gate.isActive ? "success" : "neutral"}>{gate.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge></div><div className="mt-5 grid grid-cols-2 gap-4 border-y border-line py-4"><div><p className="text-xs text-muted">Check-in สำเร็จ</p><p className="mt-1 text-xl font-bold">{gate.checkins}</p></div><div><p className="text-xs text-muted">สถานที่</p><p className="mt-1 flex items-center gap-1 text-sm font-medium"><MapPin size={14} className="text-primary" />{gate.location || "—"}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-xs text-muted">Device Code</p><p className="mono mt-1 text-xs">{gate.deviceCode || "—"}</p></div><div className="flex gap-1">{gate.deviceCode ? <Button size="sm" variant="ghost" onClick={() => void copy(gate.deviceCode ?? "")}><Copy size={15} />คัดลอก</Button> : null}{canWrite ? <Button size="sm" variant="ghost" onClick={() => startEdit(gate)}><Settings2 size={15} />แก้ไข</Button> : null}</div></div></CardContent></Card>)}</div> : <Card><CardContent><EmptyState title="ยังไม่มี Gate" description="สร้าง Gate เพื่อให้เจ้าหน้าที่เลือกจุดตรวจตอนเปิด Scanner" action={canWrite ? <Button onClick={startNew}>สร้าง Gate</Button> : undefined} /></CardContent></Card>}<Modal open={open} onClose={() => setOpen(false)} title={editing ? "แก้ไข Gate" : "สร้าง Gate"}><form className="space-y-4" onSubmit={submit}><Field label="ชื่อ Gate"><Input required value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="เช่น Gate A" /></Field><Field label="รายละเอียด"><Textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} /></Field><Field label="Location"><Input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} placeholder="ชั้น 1 ฝั่งทิศเหนือ" /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} /><Power size={15} className="text-success" />เปิดใช้งาน Gate</label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : null}บันทึก</Button></div></form></Modal></>;
}
