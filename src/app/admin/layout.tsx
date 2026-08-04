import { redirect } from "next/navigation";
import { AdminShell } from "@/components/app-shell/admin-shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AdminShell user={user}>{children}</AdminShell>;
}
