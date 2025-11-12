import {
  Appointment,
  AvailableAppointmentSlot,
  getMaximumSlots,
} from "./appointment";
import { InsurancePayer } from "./payer";
import { Patient } from "./patient";
import { UsStateAbbreviation } from "./us-states";
import { startOfDay, startOfWeek } from "date-fns";

export const ClinicianTypes = ["THERAPIST", "PSYCHOLOGIST"] as const;

export type ClinicianType = (typeof ClinicianTypes)[number];

export interface Clinician {
  id: string;
  firstName: string;
  lastName: string;
  states: UsStateAbbreviation[];
  insurances: InsurancePayer[];
  clinicianType: ClinicianType;
  appointments: Appointment[];
  availableSlots: AvailableAppointmentSlot[];
  maxDailyAppointments: number;
  maxWeeklyAppointments: number;
  createdAt: Date;
  updatedAt: Date;
}

export function filterAvailableClinicians(
  clinicians: Clinician[],
  patient: Patient,
  clinicianType: ClinicianType
): Clinician[] {
  return clinicians.filter((clinician) => {
    const { states, insurances } = clinician;

    return (
      states.includes(patient.state) &&
      insurances.includes(patient.insurance) &&
      clinician.clinicianType === clinicianType
    );
  });
}

export function getAvailableSlots(
  clinician: Clinician,
  duration: number
): AvailableAppointmentSlot[] {
  const {
    availableSlots,
    appointments,
    maxDailyAppointments,
    maxWeeklyAppointments,
  } = clinician;

  const maximizedSlots = getMaximumSlots(availableSlots, duration);
  const dailyAppointmentCounts = new Map<string, number>();
  const weeklyAppointmentCounts = new Map<string, number>();

  for (const appointment of appointments) {
    const dayKey = startOfDay(appointment.scheduledFor).toISOString();
    const weekKey = startOfWeek(appointment.scheduledFor).toISOString();

    dailyAppointmentCounts.set(
      dayKey,
      (dailyAppointmentCounts.get(dayKey) || 0) + 1
    );
    weeklyAppointmentCounts.set(
      weekKey,
      (weeklyAppointmentCounts.get(weekKey) || 0) + 1
    );
  }

  const availableFilteredSlots: AvailableAppointmentSlot[] = [];

  for (const slot of maximizedSlots) {
    const slotDayKey = startOfDay(slot.date).toISOString();
    const slotWeekKey = startOfWeek(slot.date).toISOString();

    const dailyCount = dailyAppointmentCounts.get(slotDayKey) || 0;
    const weeklyCount = weeklyAppointmentCounts.get(slotWeekKey) || 0;

    if (
      dailyCount >= maxDailyAppointments ||
      weeklyCount >= maxWeeklyAppointments
    ) {
      continue;
    }

    availableFilteredSlots.push(slot);
  }

  return availableFilteredSlots;
}
