import type { Equipment, EquipmentBooking, EquipmentKind, TaskModule } from "../types/domain";
import { toLocalDate } from "./iso-date";
import { equipmentKindForModule } from "./modules";

export function timeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesBetween(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

export function minutesBetweenSlots(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): number {
  const days = Math.round((toLocalDate(endDate).getTime() - toLocalDate(startDate).getTime()) / 86_400_000);
  return days * 24 * 60 + timeToMinutes(endTime) - timeToMinutes(startTime);
}

export function formatDurationMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "";
  const days = Math.floor(mins / (24 * 60));
  const remainder = mins % (24 * 60);
  const hours = Math.floor(remainder / 60);
  const minutes = remainder % 60;
  if (days > 0) {
    const parts = [days === 1 ? "1 day" : `${days} days`];
    if (hours) parts.push(hours === 1 ? "1 hour" : `${hours} hours`);
    if (minutes) parts.push(`${minutes} min`);
    return parts.join(" ");
  }
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours} h ${minutes} min`;
}

export function minutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function slotEnd(startTime: string, slotMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + slotMinutes);
}

export function buildDaySlots(equipment: Equipment): string[] {
  const start = timeToMinutes(equipment.dayStart);
  const end = timeToMinutes(equipment.dayEnd);
  const slots: string[] = [];
  for (let t = start; t + equipment.slotMinutes <= end; t += equipment.slotMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

export function snapToSlot(startTime: string, equipment: Equipment): string | null {
  const slots = buildDaySlots(equipment);
  if (slots.includes(startTime)) return startTime;
  const mins = timeToMinutes(startTime);
  const snapped = slots.find((slot) => timeToMinutes(slot) <= mins && mins < timeToMinutes(slot) + equipment.slotMinutes);
  return snapped ?? null;
}

export function findEquipmentConflict(
  bookings: EquipmentBooking[],
  equipmentId: string,
  date: string,
  startTime: string,
  excludeTaskId?: string
): EquipmentBooking | undefined {
  return bookings.find(
    (booking) =>
      booking.equipmentId === equipmentId &&
      booking.date === date &&
      booking.startTime === startTime &&
      booking.taskId !== excludeTaskId
  );
}

export function activeEquipmentForKind(
  equipment: Equipment[],
  kind: EquipmentKind
): Equipment | undefined {
  return equipment.find((item) => item.kind === kind && item.active);
}

export function equipmentForModule(
  equipment: Equipment[],
  module: TaskModule
): Equipment | undefined {
  const kind = equipmentKindForModule(module);
  if (!kind) return undefined;
  return activeEquipmentForKind(equipment, kind);
}

export interface EquipmentConflictDetails {
  equipmentName: string;
  date: string;
  startTime: string;
}

export function conflictDetailsForEquipment(
  bookings: EquipmentBooking[],
  equipment: Equipment[],
  module: TaskModule,
  date: string,
  startTime: string,
  excludeTaskId?: string
): EquipmentConflictDetails | null {
  const machine = equipmentForModule(equipment, module);
  if (!machine) return { equipmentName: "Equipment", date, startTime };
  const slot = snapToSlot(startTime, machine) ?? startTime;
  const conflict = findEquipmentConflict(bookings, machine.id, date, slot, excludeTaskId);
  if (!conflict) return null;
  return { equipmentName: machine.name, date, startTime: slot };
}
