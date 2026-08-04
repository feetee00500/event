import { beforeEach, describe, expect, it, vi } from "vitest";
import { processCheckin } from "@/lib/checkin-service";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction } }));
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

function txFor(event = baseEvent, ticket = baseTicket) {
  return {
    event: { findUnique: vi.fn().mockResolvedValue(event) },
    ticket: {
      findUnique: vi.fn().mockResolvedValue(ticket),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
    },
    attendee: { update: vi.fn() },
    checkin: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue({ scannedAt: new Date("2026-01-01T00:00:00Z"), gate: { name: "Gate A" } }) },
  };
}

beforeEach(() => {
  mocks.transaction.mockReset();
});

describe("processCheckin access modes and duplicate safety", () => {
  it("rejects a duplicate for SINGLE_ENTRY", async () => {
    const tx = txFor(baseEvent, { ...baseTicket, status: "CHECKED_IN" });
    mocks.transaction.mockImplementation((callback) => callback(tx));
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "ALREADY_CHECKED_IN" });
    expect(tx.ticket.updateMany).not.toHaveBeenCalled();
    expect(tx.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "ALREADY_CHECKED_IN" }) }));
  });

  it("allows a checked-in ticket for REENTRY", async () => {
    const tx = txFor({ ...baseEvent, accessMode: "REENTRY" }, { ...baseTicket, status: "CHECKED_IN" });
    mocks.transaction.mockImplementation((callback) => callback(tx));
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: true, status: "CHECKED_IN" });
    expect(tx.ticket.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: { in: ["ACTIVE", "CHECKED_IN"] } }) }));
    expect(tx.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "SUCCESS" }) }));
  });

  it("rejects and records a cancelled ticket", async () => {
    const tx = txFor(baseEvent, { ...baseTicket, status: "CANCELLED" });
    mocks.transaction.mockImplementation((callback) => callback(tx));
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "CANCELLED" });
    expect(tx.checkin.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: "CANCELLED" }) }));
  });

  it("turns a lost atomic update race into a duplicate result", async () => {
    const tx = txFor();
    tx.ticket.updateMany.mockResolvedValue({ count: 0 });
    tx.ticket.findUnique.mockResolvedValueOnce(baseTicket).mockResolvedValueOnce({ status: "CHECKED_IN" });
    mocks.transaction.mockImplementation((callback) => callback(tx));
    const result = await processCheckin(input);
    expect(result).toMatchObject({ success: false, status: "ALREADY_CHECKED_IN" });
    expect(tx.attendee.update).not.toHaveBeenCalled();
  });
});
