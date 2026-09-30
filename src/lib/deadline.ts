/**
 * Deadlines are stored as a local calendar date (due_date) plus, only when the
 * user named a time, an exact instant (due_at). Timing labels are always
 * derived from these values and the current clock — never stored.
 */

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export type ParsedDeadline = { date: string; time: string | null } | null;

const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Reads only explicit deadlines from the user's words, relative to the given
 * local date. Vague phrases ("this week", "next month") return null: there is
 * no honest single date for them.
 */
export function parseDeadline(text: string, todayISO: string): ParsedDeadline {
  const t = text.toLowerCase();
  const today = fromISODate(todayISO);
  let date: Date | null = null;

  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const monthDay = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  const dayMonth = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  const inN = t.match(/\bin\s+(\d{1,3})\s+(day|week)s?\b/);
  const nextWd = t.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  const wd = t.match(/\b(?:by|before|on|this|until|due)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);

  if (iso) date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  else if (monthDay || dayMonth) {
    const month = MONTHS.indexOf((monthDay ? monthDay[1] : dayMonth![2])!);
    const day = Number(monthDay ? monthDay[2] : dayMonth![1]);
    date = new Date(today.getFullYear(), month, day);
    if (date < today) date = new Date(today.getFullYear() + 1, month, day);
  } else if (/\btoday\b|\btonight\b|\bend of (?:the )?day\b|\beod\b/.test(t)) date = today;
  else if (/\btomorrow\b/.test(t)) date = addDays(today, 1);
  else if (inN) date = addDays(today, Number(inN[1]) * (inN[2] === "week" ? 7 : 1));
  else if (nextWd) {
    // "next Friday" = Friday of next week (Monday-based weeks).
    const target = WEEKDAYS.indexOf(nextWd[1]!);
    const mondayNext = addDays(today, ((8 - today.getDay()) % 7) || 7);
    date = addDays(mondayNext, (target + 6) % 7);
  } else if (wd) {
    const target = WEEKDAYS.indexOf(wd[1]!);
    date = addDays(today, (target - today.getDay() + 7) % 7);
  }
  if (!date || Number.isNaN(date.getTime())) return null;

  let time: string | null = null;
  const tm = t.match(/\b(?:at|by|before)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ?? t.match(/\b(?:at|by|before)\s+(\d{1,2}):(\d{2})\b/);
  if (tm) {
    let h = Number(tm[1]);
    const ap = tm[3];
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h < 24) time = `${pad(h)}:${tm[2] ?? "00"}`;
  } else if (/\bnoon\b/.test(t)) time = "12:00";

  return { date: toISODate(date), time };
}

/** Converts a local date + time to an ISO instant using the client's UTC offset (minutes, JS convention). */
export function toInstant(date: string, time: string, offsetMinutes: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, hh!, mm!) + offsetMinutes * 60000).toISOString();
}

export type TimingBucket = "OVERDUE" | "SOON" | "WEEK" | "LATER" | "NONE" | "COMPLETED";
export type Timing = { bucket: TimingBucket; label: string; rank: number | null };

type Deadlined = { due_date: string | null; due_at: string | null; status: string };

const dayDiff = (a: Date, b: Date) => Math.round((fromISODate(toISODate(a)).getTime() - fromISODate(toISODate(b)).getTime()) / 86400000);

/**
 * Timing boundaries (local time, Monday-based weeks):
 * - date-only deadlines are due until the end of that day; timed ones until that instant
 * - Due soon = today or tomorrow; Due this week = later this week; Due later = beyond this week
 */
export function deriveTiming(item: Deadlined, now: Date = new Date()): Timing {
  if (item.status === "COMPLETED") return { bucket: "COMPLETED", label: "Completed", rank: null };
  if (!item.due_date) return { bucket: "NONE", label: "No deadline", rank: null };
  const due = fromISODate(item.due_date);
  const exact = item.due_at ? new Date(item.due_at) : null;
  const rank = exact ? exact.getTime() : addDays(due, 1).getTime() - 1;
  const days = dayDiff(due, now);
  const timeText = exact ? ` at ${exact.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "";

  const overdue = exact ? now.getTime() > exact.getTime() : days < 0;
  if (overdue) {
    const late = -days;
    const label = late <= 0
      ? `Overdue since${timeText.replace(" at", "")}`
      : `Overdue by ${late} ${late === 1 ? "day" : "days"}`;
    return { bucket: "OVERDUE", label, rank };
  }
  if (days === 0) return { bucket: "SOON", label: `Due today${timeText}`, rank };
  if (days === 1) return { bucket: "SOON", label: `Due tomorrow${timeText}`, rank };
  const daysToSunday = (7 - now.getDay()) % 7;
  const weekday = due.toLocaleDateString("en-US", { weekday: "long" });
  if (days <= daysToSunday) return { bucket: "WEEK", label: `Due ${weekday}`, rank };
  if (days < 14) return { bucket: "LATER", label: days - daysToSunday <= 7 ? `Due next ${weekday}` : `Due in ${days} days`, rank };
  if (days < 60) return { bucket: "LATER", label: `Due in ${Math.round(days / 7)} weeks`, rank };
  return { bucket: "LATER", label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: due.getFullYear() !== now.getFullYear() ? "numeric" : undefined })}`, rank };
}
