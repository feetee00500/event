import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as importAttendees } from "@/app/api/events/[eventId]/attendees/import/route";
import { POST as generateTickets } from "@/app/api/events/[eventId]/tickets/generate/route";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  findMany: vi.fn(),
  transaction: vi.fn(),
  auditCreate: vi.fn(),
  requireEvent: vi.fn(),
}));
vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } })),
  utils: { sheet_to_json: vi.fn(() => mocks.rows) },
}));
vi.mock("@/lib/db", () => ({ prisma: {
  attendee: { findMany: mocks.findMany },
  auditLog: { create: mocks.auditCreate },
  $transaction: mocks.transaction,
} }));
vi.mock("@/lib/http", () => ({ apiError: vi.fn(() => new Response(null, { status: 500 })) }));
vi.mock("@/lib/guards", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ id: "admin-a", role: "SUPER_ADMIN" })),
  requireEvent: mocks.requireEvent,
}));

const context = { params: Promise.resolve({ eventId: "event-a" }) };
function fileRequest(file: File): Request {
  return { formData: vi.fn(async () => ({ get: () => file })) } as unknown as Request;
}
function jsonRequest(body: object): Request {
  return { json: vi.fn(async () => body) } as unknown as Request;
}
function xlsxFile(size = 1): File {
  const file = new File([new Uint8Array(size)], "attendees.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => new ArrayBuffer(size) });
  return file;
}

beforeEach(() => {
  mocks.rows = [];
  mocks.findMany.mockReset();
  mocks.transaction.mockReset();
  mocks.auditCreate.mockReset().mockResolvedValue({});
  mocks.requireEvent.mockReset().mockResolvedValue({ id: "event-a" });
});

describe("Import and bulk QR boundaries", () => {
  it("accepts a 5 MB import file boundary", async () => {
    const result = await importAttendees(fileRequest(xlsxFile(5 * 1024 * 1024)), context);
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toMatchObject({ imported: 0, rejected: 0 });
  });

  it("rejects an import file larger than 5 MB", async () => {
    const result = await importAttendees(fileRequest(xlsxFile(5 * 1024 * 1024 + 1)), context);
    expect(result.status).toBe(413);
  });

  it("accepts 500 rows and rejects 501 rows", async () => {
    mocks.rows = Array.from({ length: 500 }, () => ({}));
    const accepted = await importAttendees(fileRequest(xlsxFile()), context);
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toMatchObject({ imported: 0, rejected: 500 });

    mocks.rows = Array.from({ length: 501 }, () => ({}));
    const rejected = await importAttendees(fileRequest(xlsxFile()), context);
    expect(rejected.status).toBe(422);
  });

  it("rejects 301 selected attendees before querying for bulk QR", async () => {
    const attendeeIds = Array.from({ length: 301 }, (_, index) => `attendee-${index}`);
    const result = await generateTickets(jsonRequest({ attendeeIds }), context);
    expect(result.status).toBe(422);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
