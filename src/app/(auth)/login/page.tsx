import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isDevelopmentAuthBypassEnabled } from "@/lib/auth";
import { EVENT_SCOPE_NAME, PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (isDevelopmentAuthBypassEnabled()) redirect("/admin/dashboard");

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden border border-ink bg-white shadow-card lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-white/50">Operations Desk / {EVENT_SCOPE_NAME}</p>
            <p className="mt-8 text-6xl font-semibold leading-none tracking-[-0.07em]">{PRODUCT_NAME}</p>
            <p className="mt-2 text-sm tracking-[0.18em] text-signal">{EVENT_SCOPE_NAME}</p>
          </div>
          <div className="max-w-md">
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em]">ระบบควบคุมการลงทะเบียนและเข้างาน</h1>
            <p className="mt-4 text-sm leading-7 text-white/60">สำหรับทีมปฏิบัติงาน {PRODUCT_NAME} ในโครงการ {EVENT_SCOPE_NAME} เท่านั้น ข้อมูลผู้เข้าร่วม บัตร และจุดตรวจอยู่ในระบบเดียว</p>
            <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-white/50"><span className="h-2 w-2 rounded-full bg-signal" />Restricted operations access</div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-12 lg:hidden">
            <p className="text-3xl font-semibold tracking-[-0.05em]">{PRODUCT_NAME}</p>
            <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">Operations Desk</p>
          </div>
          <div className="mx-auto max-w-sm">
            <p className="eyebrow">Authorized access</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">เข้าสู่ระบบปฏิบัติการ</h2>
            <p className="mt-3 text-sm leading-6 text-muted">ใช้บัญชีที่ได้รับมอบหมายสำหรับ {PRODUCT_NAME} ในโครงการ {EVENT_SCOPE_NAME}</p>
            <div className="mt-8"><LoginForm /></div>
          </div>
        </section>
      </div>
    </main>
  );
}