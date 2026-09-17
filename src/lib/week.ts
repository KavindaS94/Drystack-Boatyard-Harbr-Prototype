import { addDays, toLocalDate } from "./iso-date";
import { minutesToTime, timeToMinutes } from "./equipment";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function mondayOf(iso: string): string {
  const date = toLocalDate(iso);
  const day = date.getDay();
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function weekTitle(weekStart: string): string {
  const start = toLocalDate(weekStart);
  const end = toLocalDate(addDays(weekStart, 6));
  const endLabel = `${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  if (start.getMonth() === end.getMonth()) return `${start.getDate()}–${endLabel}`;
  return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${endLabel}`;
}

export const CALENDAR_DAY_START = "06:00";
export const CALENDAR_DAY_END = "18:00";

export function hourLabels(dayStart: string, dayEnd: string): string[] {
  const start = timeToMinutes(dayStart);
  const end = timeToMinutes(dayEnd);
  const hours: string[] = [];
  for (let t = start; t < end; t += 60) hours.push(minutesToTime(t));
  return hours;
}

export function formatHour(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  if (minutes) return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
  return `${hour12} ${suffix}`;
}

export function weekdayShort(iso: string): string {
  return WEEKDAY_SHORT[toLocalDate(iso).getDay()];
}

export { WEEKDAY_SHORT, MONTH_SHORT };
