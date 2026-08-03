import { describe, expect, it } from "vitest";
import { createQrToken, hashQrToken } from "@/lib/qr";

describe("QR token security", () => {
  it("creates opaque tokens without attendee data", () => {
    const token = createQrToken();
    expect(token).toMatch(/^evt_[A-Za-z0-9_-]{40,}$/);
    expect(token).not.toContain("@");
  });

  it("hashes the same token deterministically", () => {
    const token = "evt_example_secure_token";
    expect(hashQrToken(token)).toBe(hashQrToken(token));
    expect(hashQrToken(token)).toHaveLength(64);
    expect(hashQrToken(token)).not.toContain(token);
  });
});
