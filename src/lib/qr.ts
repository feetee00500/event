import { createHash, randomBytes } from "node:crypto";

export function createQrToken(): string {
  return `evt_${randomBytes(32).toString("base64url")}`;
}

export function hashQrToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function ticketUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/ticket/${encodeURIComponent(token)}`;
}

export function createDeviceCode(): string {
  return `gate_${randomBytes(12).toString("hex")}`;
}
