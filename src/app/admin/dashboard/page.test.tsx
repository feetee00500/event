import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  getDashboardData: vi.fn(),
  loadWithFallback: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/lib/server-data", () => ({ getDashboardData: mocks.getDashboardData }));
vi.mock("@/lib/data-loading", () => ({ loadWithFallback: mocks.loadWithFallback }));

import DashboardPage from "@/app/admin/dashboard/page";

describe("DashboardPage DB fallback", () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({
      id: "admin",
      name: "Admin",
      email: "admin@test.local",
      role: "SUPER_ADMIN",
      isActive: true,
    });
    mocks.loadWithFallback.mockResolvedValue({
      data: { eventCount: 0, upcomingCount: 0, attendeeCount: 0, checkedInCount: 0, checkinsToday: 0, latestEvents: [] },
      hasError: true,
    });
  });

  it("keeps the shell but does not present fallback zeros as real data", async () => {
    render(await DashboardPage());

    expect(screen.getByText("ยังไม่สามารถแสดงตัวเลขภาพรวม")).toBeInTheDocument();
    expect(screen.getByText("ยังไม่สามารถโหลดรายการกิจกรรม")).toBeInTheDocument();
    expect(screen.queryByText("รอตั้งค่ากิจกรรม")).not.toBeInTheDocument();
    expect(screen.queryByText("ยังไม่มีข้อมูลกิจกรรม")).not.toBeInTheDocument();

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
