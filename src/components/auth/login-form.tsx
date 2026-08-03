"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { InlineNotice } from "@/components/ui/feedback";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/admin/dashboard" });
    if (result?.error) { setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน"); setLoading(false); return; }
    window.location.assign(result?.url ?? "/admin/dashboard");
  }
  return <form className="space-y-5" onSubmit={submit}>{error ? <InlineNotice tone="error">{error}</InlineNotice> : null}<Field label="อีเมล"><Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></Field><Field label="รหัสผ่าน"><div className="relative"><Input className="pr-11" type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" /><button type="button" className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-2 text-muted" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></Field><Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}{loading ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}</Button><p className="text-center text-xs text-muted">ระบบบันทึกเวลาเข้าใช้งานเพื่อความปลอดภัย</p></form>;
}
