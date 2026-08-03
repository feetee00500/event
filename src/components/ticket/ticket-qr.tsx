"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Skeleton } from "@/components/ui/feedback";
import { PRODUCT_NAME } from "@/lib/branding";

export function TicketQr({ token, size = 240, showDownload = false, downloadName = "event-tird-ticket-qr.png" }: { token: string; size?: number; showDownload?: boolean; downloadName?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { let cancelled = false; setSrc(""); void QRCode.toDataURL(token, { width: size, margin: 2, errorCorrectionLevel: "Q", color: { dark: "#002756", light: "#FFFFFF" } }).then((value) => { if (!cancelled) setSrc(value); }); return () => { cancelled = true; }; }, [size, token]);
  if (!src) return <Skeleton className="aspect-square w-full max-w-[240px]" />;
  return <div className="flex flex-col items-center gap-2"><Image src={src} alt={`QR Code สำหรับ Check-in งาน ${PRODUCT_NAME}`} width={size} height={size} unoptimized className="h-auto w-full max-w-[240px]" />{showDownload ? <a href={src} download={downloadName} className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-primary hover:bg-[#eaf6f3]"><Download size={14} />ดาวน์โหลด QR</a> : null}</div>;
}