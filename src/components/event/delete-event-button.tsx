"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { InlineNotice } from "@/components/ui/feedback";

export function DeleteEventButton({ eventId, eventName, menuItem = false }: { eventId: string; eventName: string; menuItem?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmed = confirm.trim() === eventName;

  async function deleteEvent() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${eventId}/delete`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "ไม่สามารถลบ Event ได้");
        return;
      }
      setOpen(false);
      setConfirm("");
      router.push("/admin/events");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {menuItem ? (
        <button type="button" className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-[#fff4f4]" onClick={() => { setConfirm(""); setError(""); setOpen(true); }}><Trash2 size={15} />ลบกิจกรรม</button>
      ) : (
        <Button variant="danger" onClick={() => { setConfirm(""); setError(""); setOpen(true); }}><Trash2 size={16} />ลบกิจกรรม</Button>
      )}
      <Modal open={open} onClose={() => { if (!busy) setOpen(false); }} title="ลบกิจกรรมถาวร" description="การลบจะทำลายข้อมูลทุกอย่างของกิจกรรมนี้ทันที และไม่สามารถกู้คืนได้">
        <div className="space-y-4">
          <div className="rounded-md border border-[#f4b7bb] bg-[#fff4f4] p-4 text-sm leading-6 text-muted">
            ข้อมูลที่จะถูกลบถาวร: <strong className="text-ink">{eventName}</strong> — รายชื่อผู้เข้าร่วม บัตรทั้งหมด QR Code ประวัติ Check-in ทุก Gate และการมอบหมายงาน จะหายไปจากระบบทันที
          </div>
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
          <div>
            <p className="mb-2 text-sm font-medium">พิมพ์ชื่อกิจกรรมเพื่อยืนยันการลบ</p>
            <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder={eventName} autoFocus />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>กลับ</Button>
            <Button variant="danger" disabled={!confirmed || busy} onClick={() => void deleteEvent()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{busy ? "กำลังลบ..." : "ลบถาวร"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
