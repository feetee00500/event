
import { getSessionUser } from "@/lib/auth";
import { getUsers } from "@/lib/server-data";
import { loadWithFallback } from "@/lib/data-loading";
import { PageHeader } from "@/components/app-shell/page-header";
import { UserManager, type UserRow } from "@/components/user/user-manager";

import { DataLoadNotice, InlineNotice } from "@/components/ui/feedback";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await getSessionUser();
  if (!currentUser) return null;
  if (currentUser.role !== "SUPER_ADMIN") return <InlineNotice tone="error">หน้านี้สงวนสำหรับผู้ดูแลระบบสูงสุด</InlineNotice>;
    const { data: users, hasError } = await loadWithFallback(() => getUsers(currentUser), [], "UsersPage.getUsers");
    const rows: UserRow[] = users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, lastLoginAt: user.lastLoginAt?.toISOString() ?? null, assignments: user._count.assignments }));
    return <><PageHeader eyebrow="Administration" title="ผู้ใช้งานและสิทธิ์" description="ควบคุมบัญชีผู้ใช้และบทบาทการเข้าถึงระบบ" /><>{hasError ? <div className="mb-5"><DataLoadNotice resource="ผู้ใช้งาน" /></div> : null}<UserManager initialUsers={rows} /></></>;
}
