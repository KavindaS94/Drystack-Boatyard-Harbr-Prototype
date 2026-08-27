import { addDays, toIsoDate, toLocalDate } from "./iso-date";

function mondayOf(iso: string): string {
  const date = toLocalDate(iso);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(iso, offset);
}

function saturdayOnOrAfter(iso: string): string {
  const day = toLocalDate(iso).getDay();
  return addDays(iso, (6 - day + 7) % 7);
}

function monthStart(iso: string): string {
  const date = toLocalDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function monthEnd(iso: string): string {
  const date = toLocalDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Real local today — calendar, launch board, and DNL all use this. */
export const DEMO_TODAY = toIsoDate(new Date());

export const DEMO_WEEK_START = mondayOf(DEMO_TODAY);
export const DEMO_WEEK_END = addDays(DEMO_WEEK_START, 6);
export const DEMO_SATURDAY = saturdayOnOrAfter(DEMO_TODAY);
export const DEMO_MONTH_START = monthStart(DEMO_TODAY);
export const DEMO_MONTH_END = monthEnd(DEMO_TODAY);

/** @deprecated Same as DEMO_TODAY; old scripts said “Friday”. */
export const DEMO_FRIDAY = DEMO_TODAY;
