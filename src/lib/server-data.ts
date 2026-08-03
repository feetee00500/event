import type { EventStatus, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { eventScope } from "@/lib/permissions";
import { isDevelopmentAuthBypassEnabled, type CurrentUser } from "@/lib/auth";

export type EventListItem = {
  id: string;
  name: string;
  venue: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  registered: number;
  checkedIn: number;
};

export async function getEvents(user: CurrentUser): Promise<EventListItem[]> {
  const events = await prisma.event.findMany({
    where: eventScope(user.id, user.role),
    orderBy: { startAt: "asc" },
    include: { _count: { select: { attendees: true, checkins: { where: { result: "SUCCESS" } } } } },
  });
  return events.map((event) => ({ id: event.id, name: event.name, venue: event.venue, imageUrl: event.imageUrl, startAt: event.startAt.toISOString(), endAt: event.endAt.toISOString(), status: event.status, registered: event._count.attendees, checkedIn: event._count.checkins }));
}

export async function getEvent(user: CurrentUser, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, ...eventScope(user.id, user.role) },
    include: {
      _count: { select: { attendees: true, tickets: true, gates: true, checkins: { where: { result: "SUCCESS" } } } },
      gates: { orderBy: { createdAt: "asc" }, include: { _count: { select: { checkins: { where: { result: "SUCCESS" } } } } } },
    },
  });
}

export async function getDashboardData(user: CurrentUser) {
  if (isDevelopmentAuthBypassEnabled() && !process.env.DATABASE_URL) {
    return { eventCount: 0, upcomingCount: 0, attendeeCount: 0, checkinsToday: 0, latestEvents: [] };
  }
  const scope = eventScope(user.id, user.role);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [eventCount, upcomingCount, attendeeCount, checkinsToday, latestEvents] = await Promise.all([
    prisma.event.count({ where: scope }),
    prisma.event.count({ where: { ...scope, startAt: { gte: new Date() }, status: { in: ["PUBLISHED", "ACTIVE"] } } }),
    prisma.attendee.count({ where: { event: scope } }),
    prisma.checkin.count({ where: { event: scope, result: "SUCCESS", scannedAt: { gte: todayStart, lt: tomorrow } } }),
    prisma.event.findMany({ where: scope, orderBy: { startAt: "asc" }, take: 5, include: { _count: { select: { attendees: true, checkins: { where: { result: "SUCCESS" } } } } } }),
  ]);
  return { eventCount, upcomingCount, attendeeCount, checkinsToday, latestEvents: latestEvents.map((event) => ({ id: event.id, name: event.name, venue: event.venue, imageUrl: event.imageUrl, startAt: event.startAt.toISOString(), endAt: event.endAt.toISOString(), status: event.status, registered: event._count.attendees, checkedIn: event._count.checkins })) };
}

export async function getAttendees(user: CurrentUser, eventId: string) {
  const event = await getEvent(user, eventId);
  if (!event) return null;
  return prisma.attendee.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, include: { tickets: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, ticketNumber: true, ticketType: true, status: true, issuedAt: true, checkedInAt: true } } } });
}

export async function getTickets(user: CurrentUser, eventId: string) {
  const event = await getEvent(user, eventId);
  if (!event) return null;
  return prisma.ticket.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, include: { attendee: true } });
}

export async function getCheckins(user: CurrentUser, eventId: string) {
  const event = await getEvent(user, eventId);
  if (!event) return null;
  return prisma.checkin.findMany({ where: { eventId }, orderBy: { scannedAt: "desc" }, take: 100, include: { ticket: { include: { attendee: true } }, gate: true, scannedBy: true } });
}

export async function getReportData(user: CurrentUser, eventId: string) {
  const event = await getEvent(user, eventId);
  if (!event) return null;
  const [registered, checkedIn, duplicateScans, invalidScans, cancelled, gates, byType, hourly, noShows] = await Promise.all([
    prisma.attendee.count({ where: { eventId } }),
    prisma.checkin.count({ where: { eventId, result: "SUCCESS" } }),
    prisma.checkin.count({ where: { eventId, result: "ALREADY_CHECKED_IN" } }),
    prisma.checkin.count({ where: { eventId, result: "INVALID_TOKEN" } }),
    prisma.attendee.count({ where: { eventId, status: "CANCELLED" } }),
    prisma.gate.findMany({ where: { eventId }, include: { _count: { select: { checkins: { where: { result: "SUCCESS" } } } } }, orderBy: { name: "asc" } }),
    prisma.ticket.groupBy({ by: ["ticketType"], where: { eventId }, _count: { _all: true } }),
    prisma.checkin.findMany({ where: { eventId, result: "SUCCESS" }, select: { scannedAt: true }, orderBy: { scannedAt: "asc" } }),
    prisma.attendee.findMany({ where: { eventId, status: { in: ["REGISTERED", "QR_GENERATED", "DELIVERED", "NO_SHOW"] } }, orderBy: { lastName: "asc" }, take: 100, select: { id: true, firstName: true, lastName: true, email: true, status: true } }),
  ]);
  const byHour = new Map<string, number>();
  for (const scan of hourly) {
    const key = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(scan.scannedAt);
    byHour.set(key, (byHour.get(key) ?? 0) + 1);
  }
  return { registered, checkedIn, noShow: Math.max(0, registered - checkedIn - cancelled), duplicateScans, invalidScans, gates: gates.map((gate) => ({ id: gate.id, name: gate.name, count: gate._count.checkins })), byType: byType.map((item) => ({ type: item.ticketType, count: item._count._all })), byHour: Array.from(byHour.entries()).map(([hour, count]) => ({ hour, count })), noShows };
}

export async function getUsers(user: CurrentUser) {
  if (user.role !== "SUPER_ADMIN") return [];
  return prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, _count: { select: { assignments: true } } } });
}

export function ticketStatusLabel(status: TicketStatus): string {
  return { ACTIVE: "ใช้งานได้", CHECKED_IN: "เช็กอินแล้ว", CANCELLED: "ยกเลิก", EXPIRED: "หมดอายุ" }[status];
}
