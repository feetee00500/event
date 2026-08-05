import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventList } from "@/components/event/event-list";
import type { EventListItem } from "@/lib/server-data";

const event: EventListItem = {
  id: "event-a",
  name: "Event A",
  venue: "Bangkok",
  startAt: "2026-08-10T02:00:00.000Z",
  endAt: "2026-08-10T10:00:00.000Z",
  status: "ACTIVE",
  registered: 10,
  checkedIn: 2,
  assignmentRole: "EVENT_ADMIN",
  imageUrl: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EventList", () => {
  it("updates a cancelled event in place without reloading the document", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ event: { ...event, status: "CANCELLED" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EventList initialEvents={[event]} canWrite />);

    fireEvent.click(screen.getByRole("button", { name: "มุมมองตาราง" }));
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิกกิจกรรม" }));
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันยกเลิก" }));

    await waitFor(() => expect(screen.getByText("ยกเลิก")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters locally while typing without issuing requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<EventList initialEvents={[event]} canWrite={false} />);

    const search = screen.getByPlaceholderText("ชื่อกิจกรรมหรือสถานที่");
    fireEvent.change(search, { target: { value: "not" } });
    fireEvent.change(search, { target: { value: "not found" } });

    await waitFor(() => expect(screen.getByText("ไม่พบกิจกรรมที่ตรงเงื่อนไข")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the true empty state only after a successful empty query", () => {
    render(<EventList initialEvents={[]} canWrite />);

    expect(screen.getByText("ยังไม่มีกิจกรรม")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps controls visible on a DB fallback without inventing events", () => {
    render(<EventList initialEvents={[]} canWrite loadError />);

    expect(screen.getByPlaceholderText("ชื่อกิจกรรมหรือสถานที่")).toBeInTheDocument();
    expect(screen.getByText("ยังไม่สามารถแสดงรายการกิจกรรม")).toBeInTheDocument();
    expect(screen.queryByText("ยังไม่มีกิจกรรม")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("ไม่สามารถโหลดกิจกรรมได้ในขณะนี้");
    expect(screen.getByText("ยังไม่สามารถสรุปจำนวนกิจกรรมได้")).toBeInTheDocument();
  });
});