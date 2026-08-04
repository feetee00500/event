import { beforeEach, describe, expect, it, vi } from "vitest";
import { processCheckin, processManualCheckin } from "@/lib/checkin-service";

const mocks = vi.hoisted(() => ({
  event: { findUnique: vi.fn() },
  ticket: { findUnique: vi.fn(), update: vi.fn() },
  attendee: { update: vi.fn() },
  checkin: { create: vi.fn(), findFirst: vi.fn() },
  queryRaw: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    event: mocks.event,
    ticket: mocks.ticket,
    attendee: mocks.attendee,
    checkin: mocks.checkin,
    $queryRaw: mocks.queryRaw,
  },
}));
vi.mock("@/lib/qr", () => ({ hashQrToken: vi.fn(() => "hash") }));

const baseEvent = {
  id: "event-a",
  status: "ACTIVE",
  accessMode: "SINGLE_ENTRY",
  checkinOpenAt: new Date("2020-01-01T00:00:00.000Z"),
  checkinCloseAt: new Date("2100-01-01T00:00:00.000Z"),
  gates: [{ id: "gate-a", name: "Gate A" }],
};
const baseTicket = {
  id: "ticket-a",
  eventId: "event-a",
  attendeeId: "attendee-a",
  ticketNumber: "T-1",
  ticketType: "General",
  status: "ACTIVE",
  expiresAt: null,
  attendee: { id: "attendee-a", firstName: "Test", lastName: "User" },
};
const input = { token: "qr", eventId: "event-a", gateId: "gate-a", userId: "user-a" };

function rawQueryText(): string {
  const call = mocks.queryRaw.mock.calls[0];
  let text = String(call[0][0]);
  for (let i = 1; i < call.length; i++) text += String(call[i]) + String(call[0][i]);
  return text;
}

beforeEach(() => {
  mocks.event.findUnique.mockReset();
  mocks.ticket.findUnique.mockReset();
  mocks.ticket.update.mockReset();
  mocks.checkin.create.mockReset();
  mocks.checkin.findFirst.mockReset();
  mocks.queryRaw.mockReset();
  mocks.event.findUnique.mockResolvedValue(baseEvent);
  mocks.ticket.findUnique.mockResolvedValue(baseTicket);
  mocks.checkin.findFirst.mockResolvedValue({ scannedAt: new Date("2026-01-01T00:00:00Z"), gate: { name: "Gate A" } });
  mocks.queryRaw.mockResolvedValue([{ claimed: 1 }]);
});

describe("processCheckin access modes and duplicate safety", () => {
  it("rejects a duplicate for SINGLE_ENTRY", async () => {
    mocks.ticket.findUnique.mockResolvedValue({ ...baseTicket, status: "CHECKED_IN" });
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "ALREADY_CHECKED_IN" });
    expect(mocks.queryRaw).not.toHaveBeenCalled();
    expect(mocks.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "ALREADY_CHECKED_IN" }) }));
  });

  it("allows a checked-in ticket for REENTRY", async () => {
    mocks.event.findUnique.mockResolvedValue({ ...baseEvent, accessMode: "REENTRY" });
    mocks.ticket.findUnique.mockResolvedValue({ ...baseTicket, status: "CHECKED_IN" });
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: true, status: "CHECKED_IN" });
    expect(mocks.queryRaw).toHaveBeenCalled();
    expect(rawQueryText()).toContain("CHECKED_IN");
    expect(rawQueryText()).toContain("SUCCESS");
    expect(mocks.checkin.create).not.toHaveBeenCalled();
  });

  it("rejects and records a cancelled ticket", async () => {
    mocks.ticket.findUnique.mockResolvedValue({ ...baseTicket, status: "CANCELLED" });
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "CANCELLED" });
    expect(mocks.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "CANCELLED" }) }));
  });

  it("turns a lost atomic update race into a duplicate result", async () => {
    mocks.ticket.findUnique.mockResolvedValueOnce(baseTicket).mockResolvedValueOnce({ status: "CHECKED_IN" });
    mocks.queryRaw.mockResolvedValue([{ claimed: 0 }]);
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "ALREADY_CHECKED_IN" });
    expect(mocks.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "ALREADY_CHECKED_IN" }) }));
    expect(mocks.attendee.update).not.toHaveBeenCalled();
  });

  it("does not log when the gate is missing", async () => {
    mocks.event.findUnique.mockResolvedValue({ ...baseEvent, gates: [] });
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "EVENT_MISMATCH" });
    expect(mocks.checkin.create).not.toHaveBeenCalled();
  });

  it("rejects and records an invalid ticket", async () => {
    mocks.ticket.findUnique.mockResolvedValue(null);
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "INVALID_TOKEN" });
    expect(mocks.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "INVALID_TOKEN" }) }));
  });

  it("expires a stale ticket and records the rejection", async () => {
    mocks.ticket.findUnique.mockResolvedValue({ ...baseTicket, expiresAt: new Date("2025-01-01T00:00:00Z") });
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "EXPIRED" });
    expect(mocks.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "EXPIRED" }) }));
    expect(mocks.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "EXPIRED" }) }));
  });

  it("does not record an ALREADY log when the race winner cancelled the ticket", async () => {
    mocks.ticket.findUnique.mockResolvedValueOnce(baseTicket).mockResolvedValueOnce({ status: "CANCELLED" });
    mocks.queryRaw.mockResolvedValue([{ claimed: 0 }]);
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "CANCELLED" });
    expect(mocks.checkin.create).not.toHaveBeenCalled();
  });
});

describe("processManualCheckin", () => {
  it("looks up the ticket by ticketNumber without hashing the token", async () => {
    const result = await processManualCheckin({ ...input, ticketNumber: "T-1" });
    expect(result).toMatchObject({ success: true, status: "CHECKED_IN" });
    expect(mocks.ticket.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { ticketNumber: "T-1" } }));
    expect(rawQueryText()).toContain("manual");
  });
});
