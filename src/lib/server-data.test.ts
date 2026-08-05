import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAttendeesPageData, getCheckinsPageData, getReportData, getReportPageData, getTicketsPageData } from "@/lib/server-data";

const mocks = vi.hoisted(() => ({
  attendeeCount: vi.fn(), attendeeFindMany: vi.fn(), checkinCount: vi.fn(), checkinFindMany: vi.fn(), gateFindMany: vi.fn(), ticketFindMany: vi.fn(), ticketGroupBy: vi.fn(), queryRaw: vi.fn(), requireEvent: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: {
  attendee: { count: mocks.attendeeCount, findMany: mocks.attendeeFindMany },
  checkin: { count: mocks.checkinCount, findMany: mocks.checkinFindMany },
  gate: { findMany: mocks.gateFindMany },
  ticket: { findMany: mocks.ticketFindMany, groupBy: mocks.ticketGroupBy },
  $queryRaw: mocks.queryRaw,
} }));
vi.mock("@/lib/guards", () => ({ requireEvent: mocks.requireEvent }));
vi.mock("@/lib/auth", () => ({ isDevelopmentAuthBypassEnabled: vi.fn(() => false) }));

beforeEach(() => {
  mocks.attendeeCount.mockReset().mockResolvedValueOnce(10).mockResolvedValueOnce(7).mockResolvedValueOnce(1);
  mocks.checkinCount.mockReset().mockResolvedValueOnce(2).mockResolvedValueOnce(1);
  mocks.gateFindMany.mockReset().mockResolvedValue([{ id: "gate-a", name: "Gate A", _count: { checkins: 9 } }]);
  mocks.ticketGroupBy.mockReset().mockResolvedValue([{ ticketType: "General", _count: { _all: 9 } }]);
  mocks.queryRaw.mockReset().mockResolvedValue([{ hour: "00", count: BigInt(9) }]);
  mocks.attendeeFindMany.mockReset().mockResolvedValue([]);
  mocks.ticketFindMany.mockReset().mockResolvedValue([]);
  mocks.checkinFindMany.mockReset().mockResolvedValue([]);
  mocks.requireEvent.mockReset().mockResolvedValue({ id: "event-a", name: "Event A", assignments: [{ role: "EVENT_ADMIN" }] });
});

describe("event page query composition", () => {
  it("loads attendee page metadata and rows through one authorization lookup", async () => {
    const user = { id: "admin", name: "Admin", email: "admin@test.local", role: "SUPER_ADMIN" as const, isActive: true };

    const result = await getAttendeesPageData(user, "event-a");

    expect(mocks.requireEvent).toHaveBeenCalledTimes(1);
    expect(mocks.requireEvent).toHaveBeenCalledWith(user, "event-a", "events:read");
    expect(mocks.attendeeFindMany).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ event: { id: "event-a", name: "Event A" }, attendees: { rows: [], truncated: false } });
  });

  it("keeps the existing read permissions while composing the other event pages", async () => {
    const user = { id: "admin", name: "Admin", email: "admin@test.local", role: "SUPER_ADMIN" as const, isActive: true };

    await getTicketsPageData(user, "event-a");
    await getCheckinsPageData(user, "event-a");
    await getReportPageData(user, "event-a");

    expect(mocks.requireEvent.mock.calls).toEqual([
      [user, "event-a", "events:read"],
      [user, "event-a", "reports:read"],
      [user, "event-a", "reports:read"],
    ]);
    expect(mocks.ticketFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.checkinFindMany).toHaveBeenCalledTimes(1);
  });
});

describe("report accuracy", () => {
  it("counts unique checked-in attendees separately from REENTRY scans", async () => {
    const report = await getReportData({ id: "admin", name: "Admin", email: "admin@test.local", role: "SUPER_ADMIN", isActive: true }, "event-a");
    expect(report).toMatchObject({ registered: 10, checkedIn: 7, successfulScans: 9, duplicateScans: 2, invalidScans: 1, noShow: 2 });
    expect(report?.byHour).toEqual([{ hour: "00", count: 9 }]);
    expect(report?.gates).toEqual([{ id: "gate-a", name: "Gate A", count: 9 }]);
    expect(mocks.attendeeCount).toHaveBeenNthCalledWith(2, { where: { eventId: "event-a", status: "CHECKED_IN" } });
    expect(mocks.ticketGroupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId: "event-a", status: { not: "CANCELLED" } } }));
  });
});
