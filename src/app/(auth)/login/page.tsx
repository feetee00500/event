import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isDevelopmentAuthBypassEnabled } from "@/lib/auth";
import { EVENT_SCOPE_NAME, PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (isDevelopmentAuthBypassEnabled()) redirect("/admin/dashboard");

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-md border border-line bg-white shadow-soft lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hero-mesh flex min-h-[430px] flex-col justify-between border-b border-line p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Operations Desk / {EVENT_SCOPE_NAME}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#0070f3]"><span className="h-1.5 w-1.5 rounded-full bg-[#50e3c2]" /> Live</span>
            </div>
            <p className="mt-12 text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[0.95] tracking-[-0.085em]">{PRODUCT_NAME}</p>
            <p className="mono mt-4 text-xs uppercase tracking-[0.18em] text-muted">{EVENT_SCOPE_NAME}</p>
          </div>
          <div className="relative max-w-md">
            <p className="eyebrow">Restricted operations access</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.055em]">ระบบควบคุมการลงทะเบียนและเข้างาน</h1>
            <p className="mt-4 text-base leading-7 text-muted">สำหรับทีมปฏิบัติงาน {PRODUCT_NAME} ในโครงการ {EVENT_SCOPE_NAME} เท่านั้น ข้อมูลผู้เข้าร่วม บัตร และจุดตรวจอยู่ในระบบเดียว</p>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-12 lg:hidden">
            <p className="text-3xl font-semibold tracking-[-0.07em]">{PRODUCT_NAME}</p>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.12em] text-muted">{EVENT_SCOPE_NAME}</p>
          </div>
          <div className="mx-auto max-w-sm">
            <p className="eyebrow">Authorized access</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.055em]">เข้าสู่ระบบปฏิบัติการ</h2>
            <p className="mt-3 text-base leading-7 text-muted">ใช้บัญชีที่ได้รับมอบหมายสำหรับ {PRODUCT_NAME} ในโครงการ {EVENT_SCOPE_NAME}</p>
            <div className="mt-8"><LoginForm /></div>
          </div>
        </section>
      </div>
    </main>
  );
}
