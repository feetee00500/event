import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckinHistory, type CheckinRow } from "@/components/checkin/checkin-history";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));

const rows: CheckinRow[] = [
  { id: "one", result: "SUCCESS", scannedAt: "2026-08-05T01:00:00.000Z", gate: "Gate A", staff: "Admin", deviceId: null, ticketNumber: "T-001", attendee: "Ada Lovelace", ticketType: "General" },
  { id: "two", result: "ALREADY_CHECKED_IN", scannedAt: "2026-08-05T02:00:00.000Z", gate: "Gate B", staff: "Staff", deviceId: "phone", ticketNumber: "T-002", attendee: "Grace Hopper", ticketType: "VIP" },
];

beforeEach(() => {
  mocks.refresh.mockReset();
});

describe("CheckinHistory refresh", () => {
  it("refreshes route data without resetting the active search", () => {
    render(<CheckinHistory initialRows={rows} />);

    const search = screen.getByPlaceholderText("ชื่อ, Ticket, Gate หรือ Staff");
    fireEvent.change(search, { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "รีเฟรชข้อมูล" }));

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(search).toHaveValue("Ada");
  });
});