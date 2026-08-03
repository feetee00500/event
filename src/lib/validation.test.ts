import { describe, expect, it } from "vitest";
import { eventSchema } from "@/lib/validation";

const valid = { name: "งานตัวอย่าง", description: "", venue: "Bangkok", imageUrl: "", startAt: "2026-08-03T09:00:00.000Z", endAt: "2026-08-03T18:00:00.000Z", checkinOpenAt: "2026-08-03T08:00:00.000Z", checkinCloseAt: "2026-08-03T17:00:00.000Z", status: "DRAFT" as const, accessMode: "SINGLE_ENTRY" as const };

describe("event time validation", () => {
  it("accepts a valid event window", () => expect(eventSchema.safeParse(valid).success).toBe(true));
  it("rejects an end time before the start", () => expect(eventSchema.safeParse({ ...valid, endAt: "2026-08-03T08:00:00.000Z" }).success).toBe(false));
  it("rejects check-in closing before opening", () => expect(eventSchema.safeParse({ ...valid, checkinCloseAt: "2026-08-03T07:00:00.000Z" }).success).toBe(false));
});
