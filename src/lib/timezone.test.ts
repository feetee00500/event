import { describe, expect, it } from "vitest";
import { bangkokDayBounds, isWithinWindow } from "@/lib/timezone";

describe("Bangkok time helpers", () => {
  it("creates UTC bounds for a Bangkok calendar day", () => {
    const { start, end } = bangkokDayBounds(new Date("2026-08-03T16:59:00.000Z"));
    expect(start.toISOString()).toBe("2026-08-02T17:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-03T17:00:00.000Z");
  });

  it("rolls over at Bangkok midnight", () => {
    const { start } = bangkokDayBounds(new Date("2026-08-03T17:01:00.000Z"));
    expect(start.toISOString()).toBe("2026-08-03T17:00:00.000Z");
  });

  it("treats check-in window boundaries as inclusive", () => {
    const openAt = new Date("2026-08-03T01:00:00.000Z");
    const closeAt = new Date("2026-08-03T03:00:00.000Z");
    expect(isWithinWindow(openAt, openAt, closeAt)).toBeNull();
    expect(isWithinWindow(closeAt, openAt, closeAt)).toBeNull();
  });
});