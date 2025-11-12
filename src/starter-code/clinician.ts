import { Appointment, AvailableAppointmentSlot } from "./appointment";
import { InsurancePayer } from "./payer";
import { Patient } from "./patient";
import { UsStateAbbreviation } from "./us-states";

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
