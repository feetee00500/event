export const BANGKOK_TIMEZONE = "Asia/Bangkok";
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: BANGKOK_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: BANGKOK_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: BANGKOK_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function formatBangkokDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatBangkokDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

export function formatBangkokTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return timeFormatter.format(new Date(value));
}

export function toIsoFromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export function bangkokDayBounds(now = new Date()): { start: Date; end: Date } {
  const bangkokNow = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const start = new Date(Date.UTC(bangkokNow.getUTCFullYear(), bangkokNow.getUTCMonth(), bangkokNow.getUTCDate()) - BANGKOK_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function isWithinWindow(now: Date, openAt: Date, closeAt: Date): "TOO_EARLY" | "TOO_LATE" | null {
  if (now < openAt) return "TOO_EARLY";
  if (now > closeAt) return "TOO_LATE";
  return null;
}
