import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({ credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } }, async authorize(credentials) { const parsed = loginSchema.safeParse(credentials); if (!parsed.success) return null; const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } }); if (!user?.isActive || !user.passwordHash) return null; const valid = await bcrypt.compare(parsed.data.password, user.passwordHash); if (!valid) return null; await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }); return { id: user.id, name: user.name, email: user.email, role: user.role }; } })],
  callbacks: {
    jwt({ token, user }) { if (user) token.role = user.role; return token; },
    session({ session, token }) { if (session.user && token.sub) { session.user.id = token.sub; session.user.role = (token.role ?? "VIEWER") as UserRole; } return session; },
  },
});

export type CurrentUser = { id: string; name: string; email: string; role: UserRole; isActive: boolean };

const developmentUser: CurrentUser = {
  id: "development-super-admin",
  name: "Development Admin",
  email: "dev@iirfa2026.local",
  role: "SUPER_ADMIN",
  isActive: true,
};

export function isDevelopmentAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS !== "false";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDevelopmentAuthBypassEnabled()) {
    if (!process.env.DATABASE_URL) return developmentUser;
    try {
      const user = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", isActive: true }, orderBy: { createdAt: "asc" } });
      if (user) return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
    } catch {
      return developmentUser;
    }
    return developmentUser;
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.isActive) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
  } catch {
    return null;
  }
}

export class AuthRequiredError extends Error { constructor(message = "กรุณาเข้าสู่ระบบ") { super(message); this.name = "AuthRequiredError"; } }
export async function requireUser(): Promise<CurrentUser> { const user = await getCurrentUser(); if (!user) throw new AuthRequiredError(); return user; }
