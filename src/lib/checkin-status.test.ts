import { describe, expect, it } from "vitest";
import { checkinStatusLabel } from "@/lib/checkin-status";

describe("check-in status mapping", () => {
  it("maps the important scanner outcomes", () => {
    expect(checkinStatusLabel("SUCCESS")).toBe("สำเร็จ");
    expect(checkinStatusLabel("ALREADY_CHECKED_IN")).toBe("สแกนซ้ำ");
    expect(checkinStatusLabel("EVENT_MISMATCH")).toBe("ผิด Event");
  });
});
