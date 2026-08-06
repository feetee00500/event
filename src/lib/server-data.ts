import type { EventAssignmentRole, EventStatus, TicketStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";
import { eventScope } from "@/lib/permissions";
import { requireEvent } from "@/lib/guards";
import { type CurrentUser } from "@/lib/auth";
import { bangkokDayBounds } from "@/lib/timezone";

export type EventListItem = {
  id: string;
  name: string;
  venue: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  registered: number;
  checkedIn: number;
  assignmentRole: EventAssignmentRole | null;
  imageUrl: string | null;
};

export async function getEvents(user: CurrentUser): Promise<EventListItem[]> {
  const db = getDb();
  const events = await db.event.findMany({
    where: eventScope(user.id, user.role),
    orderBy: { startAt: "asc" },
    include: { assignments: { where: { userId: user.id }, take: 1, select: { role: true } }, _count: { select: { attendees: true, tickets: { where: { status: "CHECKED_IN" } } } } },
  });
  return events.map((event) => ({ id: event.id, name: event.name, venue: event.venue, imageUrl: event.imageUrl, startAt: event.startAt.toISOString(), endAt: event.endAt.toISOString(), status: event.status, registered: event._count.attendees, checkedIn: event._count.tickets, assignmentRole: event.assignments[0]?.role ?? null }));
}

export async function getEvent(user: CurrentUser, eventId: string) {
  const db = getDb();
  return db.event.findFirst({
    where: { id: eventId, ...eventScope(user.id, user.role) },
    include: {
      assignments: { where: { userId: user.id }, take: 1, select: { role: true } },
      _count: { select: { attendees: true, tickets: true, gates: true, checkins: { where: { result: "SUCCESS" } } } },
      gates: { orderBy: { createdAt: "asc" }, include: { _count: { select: { checkins: { where: { result: "SUCCESS" } } } } } },
    },
  });
}

export async function getEventSummary(user: CurrentUser, eventId: string) {
  const db = getDb();
  return db.event.findFirst({
    where: { id: eventId, ...eventScope(user.id, user.role) },
    select: {
      id: true,
      name: true,
      description: true,
      venue: true,
      imageUrl: true,
      startAt: true,
      endAt: true,
      checkinOpenAt: true,
      checkinCloseAt: true,
      status: true,
      accessMode: true,
      assignments: { where: { userId: user.id }, take: 1, select: { role: true } },
    },
  });
}

export async function getEventWithGates(user: CurrentUser, eventId: string) {
  const db = getDb();
  return db.event.findFirst({
    where: { id: eventId, ...eventScope(user.id, user.role) },
    select: {
      id: true,
      name: true,
      assignments: { where: { userId: user.id }, take: 1, select: { role: true } },
      gates: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          deviceCode: true,
          isActive: true,
          _count: { select: { checkins: { where: { result: "SUCCESS" } } } },
        },
      },
    },
  });
}

export async function getDashboardData(user: CurrentUser) {
  const db = getDb();
  const scope = eventScope(user.id, user.role);
  const { start: todayStart, end: tomorrow } = bangkokDayBounds();
  const [eventCount, upcomingCount, attendeeCount, checkedInCount, checkinsToday, latestEvents] = await Promise.all([
    db.event.count({ where: scope }),
    db.event.count({ where: { ...scope, startAt: { gte: new Date() }, status: { in: ["PUBLISHED", "ACTIVE"] } } }),
    db.attendee.count({ where: { event: scope } }),
    db.attendee.count({ where: { event: scope, status: "CHECKED_IN" } }),
    db.checkin.count({ where: { event: scope, result: "SUCCESS", scannedAt: { gte: todayStart, lt: tomorrow } } }),
    db.event.findMany({ where: scope, orderBy: { startAt: "asc" }, take: 5, include: { _count: { select: { attendees: true, tickets: { where: { status: "CHECKED_IN" } } } } } }),
  ]);
  return { eventCount, upcomingCount, attendeeCount, checkedInCount, checkinsToday, latestEvents: latestEvents.map((event) => ({ id: event.id, name: event.name, venue: event.venue, imageUrl: event.imageUrl, startAt: event.startAt.toISOString(), endAt: event.endAt.toISOString(), status: event.status, registered: event._count.attendees, checkedIn: event._count.tickets })) };
}

export const MAX_LIST_ROWS = 1_000;

type ListResult<T> = { rows: T[]; truncated: boolean };

async function withBound<T>(fetch: (take: number) => Promise<T[]>): Promise<ListResult<T>> {
  const rows = await fetch(MAX_LIST_ROWS + 1);
  return rows.length > MAX_LIST_ROWS ? { rows: rows.slice(0, MAX_LIST_ROWS), truncated: true } : { rows, truncated: false };
}

function findAttendees(eventId: string) {
  const db = getDb();
  return withBound((take) => db.attendee.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, take, include: { tickets: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, ticketNumber: true, ticketType: true, status: true, issuedAt: true, checkedInAt: true } } } }));
}

export async function getAttendees(user: CurrentUser, eventId: string) {
  await requireEvent(user, eventId, "events:read");
  return findAttendees(eventId);
}

export async function getAttendeesPageData(user: CurrentUser, eventId: string) {
  const event = await requireEvent(user, eventId, "events:read");
  const attendees = await findAttendees(eventId);
  return { event, attendees };
}

function findTickets(eventId: string) {
  const db = getDb();
  return withBound((take) => db.ticket.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      ticketNumber: true,
      ticketType: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      checkedInAt: true,
      attendee: { select: { status: true, firstName: true, lastName: true, email: true } },
    },
  }));
}

export async function getTickets(user: CurrentUser, eventId: string) {
  await requireEvent(user, eventId, "events:read");
  return findTickets(eventId);
}

export async function getTicketsPageData(user: CurrentUser, eventId: string) {
  const event = await requireEvent(user, eventId, "events:read");
  const tickets = await findTickets(eventId);
  return { event, tickets };
}

function findCheckins(eventId: string) {
  const db = getDb();
  return db.checkin.findMany({
    where: { eventId },
    orderBy: { scannedAt: "desc" },
    take: 100,
    select: {
      id: true,
      result: true,
      scannedAt: true,
      deviceId: true,
      gate: { select: { name: true } },
      scannedBy: { select: { name: true } },
      ticket: { select: { ticketNumber: true, ticketType: true, attendee: { select: { firstName: true, lastName: true } } } },
    },
  });
}

export async function getCheckins(user: CurrentUser, eventId: string) {
  await requireEvent(user, eventId, "reports:read");
  return findCheckins(eventId);
}

export async function getCheckinsPageData(user: CurrentUser, eventId: string) {
  const event = await requireEvent(user, eventId, "reports:read");
  const checkins = await findCheckins(eventId);
  return { event, checkins };
}

async function findReportData(eventId: string) {
  const db = getDb();
  const [registered, checkedIn, duplicateScans, invalidScans, cancelled, gates, byType, hourly] = await Promise.all([
    db.attendee.count({ where: { eventId } }),
    db.attendee.count({ where: { eventId, status: "CHECKED_IN" } }),
    db.checkin.count({ where: { eventId, result: "ALREADY_CHECKED_IN" } }),
    db.checkin.count({ where: { eventId, result: "INVALID_TOKEN" } }),
    db.attendee.count({ where: { eventId, status: "CANCELLED" } }),
    db.gate.findMany({ where: { eventId }, include: { _count: { select: { checkins: { where: { result: "SUCCESS" } } } } }, orderBy: { name: "asc" } }),
    db.ticket.groupBy({ by: ["ticketType"], where: { eventId, status: { not: "CANCELLED" } }, _count: { _all: true } }),
    db.$queryRaw<Array<{ hour: string; count: bigint }>>(Prisma.sql`
      SELECT to_char(date_trunc('hour', "scannedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'), 'HH24') AS hour, COUNT(*) AS count
      FROM "Checkin"
      WHERE "eventId" = ${eventId} AND "result" = 'SUCCESS'
      GROUP BY 1
      ORDER BY 1
    `),
  ]);
  const byHour = hourly.map((item) => ({ hour: item.hour, count: Number(item.count) }));
  return { registered, checkedIn, noShow: Math.max(0, registered - checkedIn - cancelled), duplicateScans, invalidScans, gates: gates.map((gate) => ({ id: gate.id, name: gate.name, count: gate._count.checkins })), byType: byType.map((item) => ({ type: item.ticketType, count: item._count._all })), byHour, successfulScans: byHour.reduce((total, item) => total + item.count, 0) };
}

export async function getReportData(user: CurrentUser, eventId: string) {
  await requireEvent(user, eventId, "reports:read");
  return findReportData(eventId);
}

export async function getReportPageData(user: CurrentUser, eventId: string) {
  const event = await requireEvent(user, eventId, "reports:read");
  const report = await findReportData(eventId);
  return { event, report };
}

export async function getUsers(user: CurrentUser) {
  if (user.role !== "SUPER_ADMIN") return [];
  const db = getDb();
  return db.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, _count: { select: { assignments: true } } } });
}

export function ticketStatusLabel(status: TicketStatus): string {
  return { ACTIVE: "ใช้งานได้", CHECKED_IN: "เช็กอินแล้ว", CANCELLED: "ยกเลิก", EXPIRED: "หมดอายุ" }[status];
}
