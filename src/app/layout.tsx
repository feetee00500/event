import type { Metadata } from "next";
import { SessionProvider } from "@/components/auth/session-provider";
import { isDevelopmentAuthBypassEnabled } from "@/lib/auth";
import { EVENT_SCOPE_NAME, PRODUCT_NAME } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | Operations Desk`,
  description: `ระบบลงทะเบียน ออกบัตร และควบคุมการ Check-in สำหรับ ${PRODUCT_NAME} ในโครงการ ${EVENT_SCOPE_NAME}`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        {isDevelopmentAuthBypassEnabled() ? children : <SessionProvider>{children}</SessionProvider>}
      </body>
    </html>
  );
}