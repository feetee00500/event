import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, requireEvent } from "@/lib/guards";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { event: { findFirst: mocks.findFirst } } }));
vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));

const user = (role: "SUPER_ADMIN" | "EVENT_ADMIN" | "EVENT_STAFF" | "VIEWER") => ({
  id: `${role.toLowerCase()}-id`, name: role, email: `${role.toLowerCase()}@test.local`, role, isActive: true,
});
const event = (assignment?: "EVENT_ADMIN" | "EVENT_STAFF" | "VIEWER") => ({ id: "event-a", assignments: assignment ? [{ role: assignment }] : [] });

beforeEach(() => mocks.findFirst.mockReset());

describe("requireEvent authorization", () => {
  it("blocks Viewer from Scanner and Event Settings before querying", async () => {
    await expect(requireEvent(user("VIEWER"), "event-a", "checkin:write")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireEvent(user("VIEWER"), "event-a", "events:write")).rejects.toBeInstanceOf(ForbiddenError);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("blocks Staff from event settings and user management permissions", async () => {
    await expect(requireEvent(user("EVENT_STAFF"), "event-a", "events:write")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireEvent(user("EVENT_STAFF"), "event-a", "users:write")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireEvent(user("EVENT_STAFF"), "event-a", "reports:read")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("hides an unassigned event from Event Admin", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(requireEvent(user("EVENT_ADMIN"), "event-other", "events:read")).rejects.toBeInstanceOf(NotFoundError);
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "event-other", assignments: { some: { userId: "event_admin-id" } } }) }));
  });

  it("does not elevate an Event Admin with a Viewer assignment", async () => {
    mocks.findFirst.mockResolvedValue(event("VIEWER"));
    await expect(requireEvent(user("EVENT_ADMIN"), "event-a", "events:write")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows Super Admin full event and scanner access", async () => {
    mocks.findFirst.mockResolvedValue(event());
    await expect(requireEvent(user("SUPER_ADMIN"), "event-a", "events:write")).resolves.toMatchObject({ id: "event-a" });
    await expect(requireEvent(user("SUPER_ADMIN"), "event-a", "checkin:write")).resolves.toMatchObject({ id: "event-a" });
  });
});
