
import { getCurrentUser } from "@/lib/auth";
import { getUsers } from "@/lib/server-data";
import { PageHeader } from "@/components/app-shell/page-header";
import { UserManager, type UserRow } from "@/components/user/user-manager";

import { InlineNotice } from "@/components/ui/feedback";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  if (currentUser.role !== "SUPER_ADMIN") return <InlineNotice tone="error">หน้านี้สงวนสำหรับผู้ดูแลระบบสูงสุด</InlineNotice>;
  try {
    const users = await getUsers(currentUser);
    const rows: UserRow[] = users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, lastLoginAt: user.lastLoginAt?.toISOString() ?? null, assignments: user._count.assignments }));
    return <><PageHeader eyebrow="Administration" title="ผู้ใช้งานและสิทธิ์" description="ควบคุมบัญชีผู้ใช้และบทบาทการเข้าถึงระบบ" /><UserManager initialUsers={rows} /></>;
  } catch {
    return <InlineNotice tone="error">ไม่สามารถโหลดผู้ใช้งานได้</InlineNotice>;
  }
}
