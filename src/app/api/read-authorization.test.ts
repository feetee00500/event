import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getReports } from "@/app/api/events/[eventId]/reports/route";
import { GET as getCheckins } from "@/app/api/events/[eventId]/checkins/route";
import { GET as getDashboard } from "@/app/api/events/[eventId]/dashboard/route";

const mocks = vi.hoisted(() => {
  class TestAuthRequiredError extends Error {}
  class TestForbiddenError extends Error {}
  class TestNotFoundError extends Error {}

  return {
    AuthRequiredError: TestAuthRequiredError,
    ForbiddenError: TestForbiddenError,
    NotFoundError: TestNotFoundError,
    requireAuthenticatedUser: vi.fn(),
    requireEvent: vi.fn(),
    getReportData: vi.fn(),
    getCheckins: vi.fn(),
    user: { id: "staff-id", name: "Staff", email: "staff@test.local", role: "EVENT_STAFF", isActive: true },
  };
});

vi.mock("@/lib/auth", () => ({ AuthRequiredError: mocks.AuthRequiredError }));
vi.mock("@/lib/guards", () => ({
  ForbiddenError: mocks.ForbiddenError,
  NotFoundError: mocks.NotFoundError,
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
  requireEvent: mocks.requireEvent,
}));
vi.mock("@/lib/server-data", () => ({ getReportData: mocks.getReportData, getCheckins: mocks.getCheckins }));

beforeEach(() => {
  mocks.requireAuthenticatedUser.mockReset().mockResolvedValue(mocks.user);
  mocks.requireEvent.mockReset().mockRejectedValue(new mocks.ForbiddenError("forbidden"));
  mocks.getReportData.mockReset().mockResolvedValue({ registered: 0 });
  mocks.getCheckins.mockReset().mockResolvedValue([]);
});

describe("read endpoint authorization", () => {
  it("returns 403 for Event Staff without reports:read", async () => {
    const response = await getReports(new Request("http://localhost/api/events/event-a/reports"), { params: Promise.resolve({ eventId: "event-a" }) });

    expect(response.status).toBe(403);
    expect(mocks.requireEvent).toHaveBeenCalledWith(mocks.user, "event-a", "reports:read");
    expect(mocks.getReportData).not.toHaveBeenCalled();
  });

  it("returns 403 for Event Staff without reports:read on check-in history", async () => {
    const response = await getCheckins(new Request("http://localhost/api/events/event-a/checkins"), { params: Promise.resolve({ eventId: "event-a" }) });

    expect(response.status).toBe(403);
    expect(mocks.requireEvent).toHaveBeenCalledWith(mocks.user, "event-a", "reports:read");
    expect(mocks.getCheckins).not.toHaveBeenCalled();
  });

  it("returns 403 for Event Staff without reports:read on dashboard data", async () => {
    const response = await getDashboard(new Request("http://localhost/api/events/event-a/dashboard"), { params: Promise.resolve({ eventId: "event-a" }) });

    expect(response.status).toBe(403);
    expect(mocks.requireEvent).toHaveBeenCalledWith(mocks.user, "event-a", "reports:read");
    expect(mocks.getReportData).not.toHaveBeenCalled();
  });
});
