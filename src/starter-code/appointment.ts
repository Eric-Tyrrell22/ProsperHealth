import { addMinutes } from "date-fns";

export const AppointmentStatuses = [
  "UPCOMING",
  "OCCURRED",
  "NO_SHOW",
  "RE_SCHEDULED",
  "CANCELLED",
  "LATE_CANCELLATION",
] as const;
export type AppointmentStatus = (typeof AppointmentStatuses)[number];

export const AppointmentTypes = [
  "ASSESSMENT_SESSION_1",
  "ASSESSMENT_SESSION_2",
  "THERAPY_INTAKE",
  "THERAPY_SIXTY_MINS",
] as const;
export type AppointmentType = (typeof AppointmentTypes)[number];

export const THERAPY_LENGTH = 60;
export const ASSESSMENT_LENGTH = 90;

export const MAX_FOLLOWUP_DAYS = 7;
export const MIN_FOLLOWUP_DAYS = 1;

export interface Appointment {
  id: string;
  patientId: string;
  clinicianId: string;
  scheduledFor: Date;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableAppointmentSlot {
  id: string;
  clinicianId: string;
  date: Date;
  length: number;
  createdAt: Date;
  updatedAt: Date;
}

export function getMaximumSlots(
  slots: AvailableAppointmentSlot[],
  duration: number
): AvailableAppointmentSlot[] {
  const results: AvailableAppointmentSlot[] = [];

  let prevSlotDate = new Date(0);

  for (const slot of slots) {
    if (slot.date >= addMinutes(prevSlotDate, duration)) {
      results.push(slot);
      prevSlotDate = slot.date;
    }
  }

  return results;
}
