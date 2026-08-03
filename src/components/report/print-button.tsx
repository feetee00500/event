"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "พิมพ์รายงาน" }: { label?: string }) {
  return <Button variant="secondary" onClick={() => window.print()}><Printer size={16} />{label}</Button>;
}