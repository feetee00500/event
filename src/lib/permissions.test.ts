import { describe, expect, it } from "vitest";
import { canCheckIn, canManageEvent, hasPermission } from "@/lib/permissions";

describe("role permissions", () => {
  it("allows staff to check in but not manage events", () => {
    expect(hasPermission("EVENT_STAFF", "checkin:write")).toBe(true);
    expect(hasPermission("EVENT_STAFF", "events:write")).toBe(false);
    expect(canCheckIn("EVENT_STAFF", "EVENT_STAFF")).toBe(true);
    expect(canManageEvent("EVENT_STAFF", "EVENT_STAFF")).toBe(false);
  });

  it("allows super admins across events", () => {
    expect(canManageEvent("SUPER_ADMIN")).toBe(true);
    expect(canCheckIn("SUPER_ADMIN")).toBe(true);
  });

  it("allows assigned event admins to scan and manage", () => {
    expect(hasPermission("EVENT_ADMIN", "checkin:write")).toBe(true);
    expect(canCheckIn("EVENT_ADMIN", "EVENT_ADMIN")).toBe(true);
    expect(canManageEvent("EVENT_ADMIN", "EVENT_ADMIN")).toBe(true);
  });

  it("does not elevate a viewer through an inconsistent assignment", () => {
    expect(canCheckIn("VIEWER", "EVENT_STAFF")).toBe(false);
    expect(canManageEvent("VIEWER", "EVENT_ADMIN")).toBe(false);
  });
});
