import {
  ASSESSMENT_LENGTH,
  AvailableAppointmentSlot,
  THERAPY_LENGTH,
} from "./appointment";
import {
  Clinician,
  filterAvailableClinicians,
  getAvailableSlots,
} from "./clinician";
import { Patient } from "./patient";

import { differenceInCalendarDays, format } from "date-fns";

type InitialAssessment = AvailableAppointmentSlot & {
  followups: AvailableAppointmentSlot[];
};

type AssessmentAvailability = Record<Clinician["id"], InitialAssessment[]>;

type TherapyIntakeSlots = AvailableAppointmentSlot[];
type TherapyAvailability = Record<Clinician["id"], TherapyIntakeSlots>;

const MAX_FOLLOWUP_DAYS = 7;
const MIN_FOLLOWUP_DAYS = 1;

export default class SchedulerService {
  constructor(private clinicians: Clinician[]) {}

  getTherapyAvailability(patient: Patient): TherapyAvailability {
    const clinicians = filterAvailableClinicians(
      this.clinicians,
      patient,
      "THERAPIST"
    );
    const availability: TherapyAvailability = {};

    for (const clinician of clinicians) {
      availability[clinician.id] = getAvailableSlots(clinician, THERAPY_LENGTH);
    }

    return availability;
  }

  getAssessmentAvailability(patient: Patient): AssessmentAvailability {
    const clinicians = filterAvailableClinicians(
      this.clinicians,
      patient,
      "PSYCHOLOGIST"
    );
    const assessmentAvailability: AssessmentAvailability = {};

    for (const clinician of clinicians) {
      const maximizedSlots = getAvailableSlots(clinician, ASSESSMENT_LENGTH);
      const slotFollowups = this.getAssessmentFollowUps(maximizedSlots);

      const initialAssessments: InitialAssessment[] = maximizedSlots.map(
        (slot) => ({
          ...slot,
          followups: slotFollowups[slot.id] || [],
        })
      );

      assessmentAvailability[clinician.id] = initialAssessments.filter(
        (slot) => {
          return slot.followups.length > 0;
        }
      );
    }

    return assessmentAvailability;
  }

  private getAssessmentFollowUps(
    availableSlots: AvailableAppointmentSlot[]
  ): Record<AvailableAppointmentSlot["id"], AvailableAppointmentSlot[]> {
    const slotFollowups: Record<
      AvailableAppointmentSlot["id"],
      AvailableAppointmentSlot[]
    > = {};
    const cache = new Map<string, AvailableAppointmentSlot[]>();

    for (let i = 0; i < availableSlots.length; i++) {
      const slot = availableSlots[i];
      const availableFollowUps: AvailableAppointmentSlot[] = [];
      const startKey = format(slot.date, "yyyy-MM-dd");

      if (cache.has(startKey)) {
        slotFollowups[slot.id] = cache.get(startKey)!;
        continue;
      }

      for (let j = i + 1; j < availableSlots.length; j++) {
        const candidate = availableSlots[j];
        const diff = differenceInCalendarDays(candidate.date, slot.date);

        if (diff <= MIN_FOLLOWUP_DAYS) continue;
        if (diff > MAX_FOLLOWUP_DAYS) break;

        availableFollowUps.push(candidate);
      }

      if (availableFollowUps.length > 0) {
        slotFollowups[slot.id] = availableFollowUps;
        cache.set(startKey, availableFollowUps);
      }
    }

    return slotFollowups;
  }
}
