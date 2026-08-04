"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Image as ImageIcon, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { InlineNotice } from "@/components/ui/feedback";
import { eventSchema } from "@/lib/validation";
import { PRODUCT_NAME } from "@/lib/branding";

export type EventFormValue = { id?: string; name: string; description: string; venue: string; imageUrl: string; startAt: string; endAt: string; checkinOpenAt: string; checkinCloseAt: string; status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "CANCELLED"; accessMode: "SINGLE_ENTRY" | "REENTRY" | "MULTI_DAY" };

type Step = { label: string; eyebrow: string; description: string };
const steps: Step[] = [
  { label: "ข้อมูลหลัก", eyebrow: "01", description: "ชื่อกิจกรรมและรายละเอียดที่ทีมใช้สื่อสาร" },
  { label: "วันเวลาและสถานที่", eyebrow: "02", description: "ช่วงเวลางาน จุดจัดงาน และภาพประกอบ" },
  { label: "การเข้าใช้งาน", eyebrow: "03", description: "หน้าต่าง Check-in และรูปแบบบัตร" },
  { label: "ตรวจสอบ", eyebrow: "04", description: "ตรวจข้อมูลให้ครบก่อนบันทึก" },
];

function localValue(value: string | Date): string { const date = new Date(value); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function initialValue(event?: Partial<EventFormValue>): EventFormValue { const now = new Date(); const start = event?.startAt ? localValue(event.startAt) : localValue(new Date(now.getTime() + 86400000)); const end = event?.endAt ? localValue(event.endAt) : localValue(new Date(now.getTime() + 90000000)); return { id: event?.id, name: event?.name ?? "", description: event?.description ?? "", venue: event?.venue ?? "", imageUrl: event?.imageUrl ?? "", startAt: start, endAt: end, checkinOpenAt: event?.checkinOpenAt ? localValue(event.checkinOpenAt) : start, checkinCloseAt: event?.checkinCloseAt ? localValue(event.checkinCloseAt) : end, status: event?.status ?? "DRAFT", accessMode: event?.accessMode ?? "SINGLE_ENTRY" }; }
function toIso(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toISOString(); }
function displayDate(value: string): string { if (!value) return "ยังไม่ได้กำหนด"; return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value)); }
function resizeCover(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("decode"));
      image.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas");
          ctx.fillStyle = "#171717";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          reject(new Error("canvas"));
        }
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function EventForm({ event }: { event?: Partial<EventFormValue> }) {
  const router = useRouter();
  const [value, setValue] = useState<EventFormValue>(() => initialValue(event));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const previewAvailable = useMemo(() => Boolean(value.imageUrl && !imageFailed), [imageFailed, value.imageUrl]);
  function setField(field: keyof EventFormValue, next: string) { setValue((current) => ({ ...current, [field]: next }) as EventFormValue); setErrors((current) => ({ ...current, [field]: "" })); setDirty(true); if (field === "imageUrl") setImageFailed(false); }
  async function handleCoverFile(file: File | null) {
    if (!file) return;
    setCoverMessage("");
    if (!file.type.startsWith("image/")) { setCoverMessage("เลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)"); return; }
    if (file.size > 10 * 1024 * 1024) { setCoverMessage("รูปภาพใหญ่เกินไป ขนาดสูงสุด 10MB"); return; }
    setCoverBusy(true);
    try {
      const dataUrl = await resizeCover(file, 1600);
      setField("imageUrl", dataUrl);
    } catch {
      setCoverMessage("ไม่สามารถอ่านไฟล์รูปภาพได้ ลองใช้ไฟล์ JPG, PNG หรือ WebP");
    } finally {
      setCoverBusy(false);
    }
  }
  function payload(statusOverride?: EventFormValue["status"]) { return { ...value, ...(statusOverride ? { status: statusOverride } : {}), startAt: toIso(value.startAt), endAt: toIso(value.endAt), checkinOpenAt: toIso(value.checkinOpenAt), checkinCloseAt: toIso(value.checkinCloseAt) }; }
  function validateCurrentStep(): boolean {
    const nextErrors: Record<string, string> = {};
    if (step === 0) { if (value.name.trim().length < 2) nextErrors.name = "กรุณาระบุชื่องานอย่างน้อย 2 ตัวอักษร"; if (value.description.length > 5000) nextErrors.description = "รายละเอียดงานยาวเกินไป"; }
    if (step === 1) { if (value.venue.trim().length < 2) nextErrors.venue = "กรุณาระบุสถานที่"; if (!value.startAt) nextErrors.startAt = "กรุณาระบุเวลาเริ่มงาน"; if (!value.endAt) nextErrors.endAt = "กรุณาระบุเวลาสิ้นสุดงาน"; }
    if (step === 2) { if (!value.checkinOpenAt) nextErrors.checkinOpenAt = "กรุณาระบุเวลาเปิด Check-in"; if (!value.checkinCloseAt) nextErrors.checkinCloseAt = "กรุณาระบุเวลาปิด Check-in"; }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }
  function nextStep() { if (validateCurrentStep()) setStep((current) => Math.min(current + 1, steps.length - 1)); }
  function previousStep() { setErrors({}); setStep((current) => Math.max(current - 1, 0)); }
  async function submit(formEvent: FormEvent<HTMLFormElement>, statusOverride?: EventFormValue["status"]) {
    formEvent.preventDefault(); setErrors({}); setMessage("");
    const parsed = eventSchema.safeParse(payload(statusOverride));
    if (!parsed.success) { const fields = parsed.error.flatten().fieldErrors; setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0] ?? "ข้อมูลไม่ถูกต้อง"]))); const firstErrorStep = steps.findIndex((_, index) => index < 3 && Object.keys(fields).some((field) => (index === 0 && ["name", "description"].includes(field)) || (index === 1 && ["venue", "imageUrl", "startAt", "endAt"].includes(field)) || (index === 2 && ["checkinOpenAt", "checkinCloseAt", "status", "accessMode"].includes(field)))); setStep(firstErrorStep >= 0 ? firstErrorStep : 0); return; }
    setSaving(true); const response = await fetch(value.id ? `/api/events/${value.id}` : "/api/events", { method: value.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) }); const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error ?? "ไม่สามารถบันทึกข้อมูลได้"); setSaving(false); return; }
    setDirty(false); router.push(value.id ? `/admin/events/${value.id}` : "/admin/events"); router.refresh();
  }
  function saveDraft() { const fakeEvent = { preventDefault() {}, } as FormEvent<HTMLFormElement>; void submit(fakeEvent, "DRAFT"); }

  const statusLabel: Record<EventFormValue["status"], string> = { DRAFT: "ฉบับร่าง", PUBLISHED: "เผยแพร่", ACTIVE: "กำลังใช้งาน", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก" }; const validationMessages = Object.values(errors).filter(Boolean);
  return <form onSubmit={(eventForm) => void submit(eventForm)} className="space-y-5">
    <Card className="overflow-hidden"><CardContent className="p-0"><ol className="grid md:grid-cols-4">{steps.map((item, index) => <li key={item.eyebrow} className={`border-b border-line p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${index === step ? "bg-[#eef6ff]" : "bg-white"}`}><button type="button" className="focus-ring flex w-full items-start gap-3 text-left" onClick={() => index < step ? setStep(index) : undefined} aria-current={index === step ? "step" : undefined}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index < step ? "bg-primary text-white" : index === step ? "bg-navy text-white" : "bg-[#e8eff3] text-muted"}`}>{index < step ? <Check size={15} /> : item.eyebrow}</span><span><span className={`block text-sm font-semibold ${index === step ? "text-primary" : "text-ink"}`}>{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.description}</span></span></button></li>)}</ol></CardContent></Card>

    <Card><CardHeader><p className="eyebrow">{steps[step].eyebrow} / {steps.length}</p><h1 className="mt-2 text-xl font-semibold">{steps[step].label}</h1><p className="mt-1 text-sm text-muted">{steps[step].description}</p></CardHeader><CardContent>
      {step === 0 ? <div className="grid gap-5"><Field label="ชื่องาน" error={errors.name} hint="ชื่อจะแสดงบน Event workspace, บัตร และหน้าข้อมูลสาธารณะ"><Input required value={value.name} onChange={(e) => setField("name", e.target.value)} placeholder={PRODUCT_NAME} autoFocus /></Field><Field label="รายละเอียดกิจกรรม" error={errors.description} hint="รองรับข้อความไม่เกิน 5,000 ตัวอักษร"><Textarea value={value.description} onChange={(e) => setField("description", e.target.value)} placeholder="วัตถุประสงค์ กำหนดการ หรือข้อมูลที่ทีมงานต้องรู้" /></Field></div> : null}
      {step === 1 ? <div className="grid gap-5 sm:grid-cols-2"><Field label="สถานที่" error={errors.venue}><Input required value={value.venue} onChange={(e) => setField("venue", e.target.value)} placeholder="อาคาร / ห้อง / จังหวัด" /></Field><Field label="เริ่มงาน" error={errors.startAt}><Input type="datetime-local" required value={value.startAt} onChange={(e) => setField("startAt", e.target.value)} /></Field><Field label="สิ้นสุดงาน" error={errors.endAt}><Input type="datetime-local" required value={value.endAt} onChange={(e) => setField("endAt", e.target.value)} /></Field><div className="sm:col-span-2"><p className="mb-2 text-sm font-semibold text-ink">ภาพปกกิจกรรม</p>{coverBusy ? <div className="flex min-h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-paper px-4 text-center text-sm text-muted"><Loader2 size={18} className="animate-spin" />กำลังประมวลผลรูปภาพ...</div> : previewAvailable ? <div><div className="relative h-44 overflow-hidden rounded-lg border border-line bg-navy" role="img" aria-label={`ตัวอย่างภาพกิจกรรม ${value.name || "ใหม่"}`}><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,39,86,.58),rgba(0,39,86,.15)),url(${value.imageUrl})` }} onError={() => setImageFailed(true)} /><div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-navy/70 px-4 py-3 text-xs font-semibold text-white"><ImageIcon size={15} />ตัวอย่างภาพปกกิจกรรม</div></div><div className="mt-3 flex flex-wrap gap-2"><label className="focus-ring inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-sm border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/30 hover:bg-paper"><ImageIcon size={16} />เปลี่ยนรูป<input className="sr-only" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; e.target.value = ""; void handleCoverFile(file); }} /></label><Button type="button" variant="secondary" size="sm" onClick={() => setField("imageUrl", "")}><Trash2 size={15} />ลบรูป</Button></div></div> : <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-line bg-paper px-5 py-8 text-center transition hover:border-ink/40 hover:bg-white"><ImageIcon size={26} className="text-primary" /><span className="mt-3 text-sm font-semibold">เพิ่มรูปภาพปก</span><span className="mt-1 max-w-md text-xs leading-5 text-muted">เลือกไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 10MB ระบบจะปรับขนาดให้อัตโนมัติ</span><input className="sr-only" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; e.target.value = ""; void handleCoverFile(file); }} /></label>}{coverMessage ? <p className="mt-2 text-sm text-danger">{coverMessage}</p> : null}<div className="mt-4"><Field label="หรือวาง URL รูปภาพ" error={errors.imageUrl} hint="รองรับ URL จาก CDN หรือใช้รูปที่อัปโหลดด้านบนก็ได้"><Input value={value.imageUrl.startsWith("data:") ? "" : value.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://..." /></Field></div></div></div> : null}
      {step === 2 ? <div className="grid gap-5 sm:grid-cols-2"><Field label="เปิด Check-in" error={errors.checkinOpenAt} hint="เวลาเริ่มรับผู้เข้าร่วม"><Input type="datetime-local" required value={value.checkinOpenAt} onChange={(e) => setField("checkinOpenAt", e.target.value)} /></Field><Field label="ปิด Check-in" error={errors.checkinCloseAt} hint="ต้องไม่เกินเวลาสิ้นสุดงาน"><Input type="datetime-local" required value={value.checkinCloseAt} onChange={(e) => setField("checkinCloseAt", e.target.value)} /></Field><Field label="รูปแบบการเข้า" hint="กำหนดกติกาที่ใช้กับ QR ของกิจกรรม"><Select value={value.accessMode} onChange={(e) => setField("accessMode", e.target.value)}><option value="SINGLE_ENTRY">เข้าได้ครั้งเดียว</option><option value="REENTRY">เข้าออกได้หลายครั้ง</option><option value="MULTI_DAY">งานหลายวัน</option></Select></Field><Field label="สถานะกิจกรรม" hint="ฉบับร่างจะยังไม่ถือว่าเปิดใช้งาน"><Select value={value.status} onChange={(e) => setField("status", e.target.value)}><option value="DRAFT">ฉบับร่าง</option><option value="PUBLISHED">เผยแพร่</option><option value="ACTIVE">กำลังใช้งาน</option><option value="COMPLETED">เสร็จสิ้น</option><option value="CANCELLED">ยกเลิก</option></Select></Field><InlineNotice tone="info"><span className="font-semibold">เวลาในระบบ:</span> Asia/Bangkok (UTC+7) และการเปิด/ปิด Check-in จะถูกตรวจสอบอีกครั้งก่อนบันทึก</InlineNotice></div> : null}
      {step === 3 ? <div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-2"><Review label="ชื่องาน" value={value.name || "ยังไม่ได้ระบุ"} /><Review label="สถานที่" value={value.venue || "ยังไม่ได้ระบุ"} /><Review label="เริ่มงาน" value={displayDate(value.startAt)} /><Review label="สิ้นสุดงาน" value={displayDate(value.endAt)} /><Review label="ช่วง Check-in" value={`${displayDate(value.checkinOpenAt)} – ${displayDate(value.checkinCloseAt)}`} /><Review label="สถานะ" value={statusLabel[value.status]} /></div><div className="rounded-lg border border-[#b9e7db] bg-[#effaf7] p-4 text-sm text-[#075e55]"><div className="flex items-start gap-2"><CircleCheck size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">พร้อมบันทึกกิจกรรม</p><p className="mt-1 leading-6">หลังบันทึก ระบบจะใช้ข้อมูลนี้กับ Dashboard, Event workspace, บัตรดิจิทัล และ Scanner ของกิจกรรมเดียวกัน</p></div></div></div></div> : null}
    </CardContent></Card>

    {validationMessages.length ? <InlineNotice tone="error"><p className="font-semibold">ตรวจพบข้อมูลที่ต้องแก้ {validationMessages.length} รายการ</p><ul className="mt-1 list-disc pl-5 text-xs leading-6">{validationMessages.map((error) => <li key={error}>{error}</li>)}</ul></InlineNotice> : null}{message ? <InlineNotice tone="error">{message}</InlineNotice> : null}
    <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row"><div className="flex flex-col gap-2 sm:flex-row">{step > 0 ? <Button type="button" variant="secondary" onClick={previousStep}><ArrowLeft size={17} />ย้อนกลับ</Button> : <Button type="button" variant="secondary" onClick={() => router.back()}>ยกเลิก</Button>}{dirty ? <Button type="button" variant="ghost" onClick={saveDraft} disabled={saving}><Save size={16} />บันทึกเป็นฉบับร่าง</Button> : null}</div><div className="flex flex-col gap-2 sm:flex-row">{step < steps.length - 1 ? <Button type="button" onClick={nextStep}><ArrowRight size={17} />ถัดไป</Button> : <Button type="submit" disabled={saving}>{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{saving ? "กำลังบันทึก" : "บันทึกกิจกรรม"}</Button>}</div></div>
  </form>;
}

function Review({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-line bg-paper px-4 py-3"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div>; }