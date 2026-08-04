import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReportData } from "@/lib/server-data";

const mocks = vi.hoisted(() => ({
  attendeeCount: vi.fn(), checkinCount: vi.fn(), gateFindMany: vi.fn(), ticketGroupBy: vi.fn(), queryRaw: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: {
  attendee: { count: mocks.attendeeCount },
  checkin: { count: mocks.checkinCount },
  gate: { findMany: mocks.gateFindMany },
  ticket: { groupBy: mocks.ticketGroupBy },
  $queryRaw: mocks.queryRaw,
} }));
vi.mock("@/lib/guards", () => ({ requireEvent: vi.fn() }));
vi.mock("@/lib/auth", () => ({ isDevelopmentAuthBypassEnabled: vi.fn(() => false) }));

beforeEach(() => {
  mocks.attendeeCount.mockReset().mockResolvedValueOnce(10).mockResolvedValueOnce(7).mockResolvedValueOnce(1);
  mocks.checkinCount.mockReset().mockResolvedValueOnce(2).mockResolvedValueOnce(1);
  mocks.gateFindMany.mockReset().mockResolvedValue([{ id: "gate-a", name: "Gate A", _count: { checkins: 9 } }]);
  mocks.ticketGroupBy.mockReset().mockResolvedValue([{ ticketType: "General", _count: { _all: 9 } }]);
  mocks.queryRaw.mockReset().mockResolvedValue([{ hour: "00", count: BigInt(9) }]);
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
