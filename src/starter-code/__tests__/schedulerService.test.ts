import SchedulerService from "../schedulerService";
import { Clinician, ClinicianType } from "../clinician";
import { Patient } from "../patient";
import { AvailableAppointmentSlot } from "../appointment";
import { addDays, addHours, startOfWeek } from "date-fns";

// This is AI generated, but I did read through them all, and it helped me catch a few bugs
describe("SchedulerService", () => {
  const baseDate = new Date("2025-01-15T10:00:00Z");

  const createMockSlot = (
    id: string,
    clinicianId: string,
    daysOffset: number,
    hoursOffset: number = 0
  ): AvailableAppointmentSlot => ({
    id,
    clinicianId,
    date: addHours(addDays(baseDate, daysOffset), hoursOffset),
    length: 60,
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  const createMockClinician = (
    id: string,
    type: ClinicianType,
    states: string[],
    insurances: string[],
    slots: AvailableAppointmentSlot[]
  ): Clinician => ({
    id,
    firstName: "Test",
    lastName: "Clinician",
    states: states as any,
    insurances: insurances as any,
    clinicianType: type,
    appointments: [],
    availableSlots: slots,
    maxDailyAppointments: 8,
    maxWeeklyAppointments: 40,
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  const createMockPatient = (state: string, insurance: string): Patient => ({
    id: "patient-1",
    firstName: "Test",
    lastName: "Patient",
    state: state as any,
    insurance: insurance as any,
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  describe("getTherapyAvailability", () => {
    it("should return availability for therapists matching patient state and insurance", () => {
      const slots = [
        createMockSlot("slot-1", "therapist-1", 0),
        createMockSlot("slot-2", "therapist-1", 1),
      ];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(1);
      expect(availability["therapist-1"]).toEqual(slots);
    });

    it("should exclude therapists not matching patient state", () => {
      const slots = [createMockSlot("slot-1", "therapist-1", 0)];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["NY"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(0);
    });

    it("should exclude therapists not matching patient insurance", () => {
      const slots = [createMockSlot("slot-1", "therapist-1", 0)];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["CA"],
          ["CIGNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(0);
    });

    it("should exclude psychologists from therapy availability", () => {
      const slots = [createMockSlot("slot-1", "psychologist-1", 0)];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(0);
    });

    it("should handle multiple matching therapists", () => {
      const slots1 = [createMockSlot("slot-1", "therapist-1", 0)];
      const slots2 = [createMockSlot("slot-2", "therapist-2", 1)];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["CA"],
          ["AETNA"],
          slots1
        ),
        createMockClinician(
          "therapist-2",
          "THERAPIST",
          ["CA"],
          ["AETNA"],
          slots2
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(2);
      expect(availability["therapist-1"]).toEqual(slots1);
      expect(availability["therapist-2"]).toEqual(slots2);
    });

    it("should match therapists with multiple states when patient state is included", () => {
      const slots = [createMockSlot("slot-1", "therapist-1", 0)];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["CA", "NY", "TX"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("NY", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(1);
    });
  });

  describe("getAssessmentAvailability - respecting clinician limits", () => {
    it("should respect daily max appointment limit when returning assessment slots", () => {
      // Create a psychologist with maxDailyAppointments = 2
      // Give them 3 slots on day 0, and followup slots on day 3
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0, 0), // Day 0, 10:00
        createMockSlot("slot-2", "psychologist-1", 0, 2), // Day 0, 12:00
        createMockSlot("slot-3", "psychologist-1", 0, 4), // Day 0, 14:00
        createMockSlot("slot-4", "psychologist-1", 3, 0), // Day 3 (followup)
      ];

      const psychologist = {
        id: "psychologist-1",
        firstName: "Test",
        lastName: "Psychologist",
        states: ["CA"] as any,
        insurances: ["AETNA"] as any,
        clinicianType: "PSYCHOLOGIST" as ClinicianType,
        appointments: [
          // Already has 2 appointments on day 0 - hitting the daily limit
          {
            id: "appt-1",
            clinicianId: "psychologist-1",
            patientId: "patient-x",
            scheduledFor: addDays(baseDate, 0), // Day 0
            appointmentType: "ASSESSMENT_SESSION_1" as const,
            status: "UPCOMING" as const,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
          {
            id: "appt-2",
            clinicianId: "psychologist-1",
            patientId: "patient-y",
            scheduledFor: addHours(addDays(baseDate, 0), 1), // Day 0, 1 hour later
            appointmentType: "ASSESSMENT_SESSION_1" as const,
            status: "UPCOMING" as const,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
        ],
        availableSlots: slots,
        maxDailyAppointments: 2,
        maxWeeklyAppointments: 40,
        createdAt: baseDate,
        updatedAt: baseDate,
      };

      const scheduler = new SchedulerService([psychologist]);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      // Should have no slots on day 0 because daily limit (2) is already reached
      expect(availability["psychologist-1"]).toHaveLength(0);
    });

    it("should respect weekly max appointment limit when returning assessment slots", () => {
      // Use startOfWeek to ensure all days are clearly in the same week
      const weekStart = startOfWeek(baseDate);

      // Create a psychologist with maxWeeklyAppointments = 3
      // Give them slots across multiple days in the same week
      const slots = [
        {
          id: "slot-1",
          clinicianId: "psychologist-1",
          date: addDays(weekStart, 0), // Monday (Week 1)
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-2",
          clinicianId: "psychologist-1",
          date: addDays(weekStart, 2), // Wednesday (Week 1)
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-3",
          clinicianId: "psychologist-1",
          date: addDays(weekStart, 4), // Friday (Week 1)
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-4",
          clinicianId: "psychologist-1",
          date: addDays(weekStart, 6), // Sunday (Week 1, followup)
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ];

      const psychologist = {
        id: "psychologist-1",
        firstName: "Test",
        lastName: "Psychologist",
        states: ["CA"] as any,
        insurances: ["AETNA"] as any,
        clinicianType: "PSYCHOLOGIST" as ClinicianType,
        appointments: [
          // Already has 3 appointments in week 1 - hitting the weekly limit
          {
            id: "appt-1",
            clinicianId: "psychologist-1",
            patientId: "patient-x",
            scheduledFor: addDays(weekStart, 0), // Monday (Week 1)
            appointmentType: "ASSESSMENT_SESSION_1" as const,
            status: "UPCOMING" as const,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
          {
            id: "appt-2",
            clinicianId: "psychologist-1",
            patientId: "patient-y",
            scheduledFor: addDays(weekStart, 1), // Tuesday (Week 1)
            appointmentType: "ASSESSMENT_SESSION_1" as const,
            status: "UPCOMING" as const,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
          {
            id: "appt-3",
            clinicianId: "psychologist-1",
            patientId: "patient-z",
            scheduledFor: addDays(weekStart, 3), // Thursday (Week 1)
            appointmentType: "ASSESSMENT_SESSION_1" as const,
            status: "UPCOMING" as const,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
        ],
        availableSlots: slots,
        maxDailyAppointments: 8,
        maxWeeklyAppointments: 3,
        createdAt: baseDate,
        updatedAt: baseDate,
      };

      const scheduler = new SchedulerService([psychologist]);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      // Should have no slots because weekly limit (3) is already reached
      expect(availability["psychologist-1"]).toHaveLength(0);
    });
  });

  describe("getAssessmentAvailability", () => {
    it("should return assessment availability with follow-ups for psychologists", () => {
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0),
        createMockSlot("slot-2", "psychologist-1", 2),
        createMockSlot("slot-3", "psychologist-1", 5),
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(1);
      // Only slot-1 and slot-2 should be included, as slot-3 has no follow-ups
      expect(availability["psychologist-1"]).toHaveLength(2);
      expect(availability["psychologist-1"][0]).toMatchObject(slots[0]);
      expect(availability["psychologist-1"][0].followups).toBeDefined();
      expect(availability["psychologist-1"][1]).toMatchObject(slots[1]);
      expect(availability["psychologist-1"][1].followups).toBeDefined();
    });

    it("should calculate follow-up slots within 7 days", () => {
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0),
        createMockSlot("slot-2", "psychologist-1", 3),
        createMockSlot("slot-3", "psychologist-1", 6),
        createMockSlot("slot-4", "psychologist-1", 10),
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      const firstAssessment = availability["psychologist-1"].find(
        (a) => a.id === "slot-1"
      );
      expect(firstAssessment).toBeDefined();

      // Should only include slots within 7 days (slot-4 is 10 days out)
      expect(firstAssessment!.followups).toHaveLength(2);
      expect(firstAssessment!.followups[0].id).toBe("slot-2");
      expect(firstAssessment!.followups[1].id).toBe("slot-3");
    });

    it("should not include same-day slots as follow-ups", () => {
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0),
        createMockSlot("slot-2", "psychologist-1", 0),
        createMockSlot("slot-3", "psychologist-1", 3),
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      const firstAssessment = availability["psychologist-1"].find(
        (a) => a.id === "slot-1"
      );
      expect(firstAssessment).toBeDefined();

      expect(firstAssessment!.followups).toHaveLength(1);
      expect(firstAssessment!.followups[0].id).toBe("slot-3");
    });

    it("should not include follow-ups for assessments with no available followups", () => {
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0),
        createMockSlot("slot-2", "psychologist-1", 3),
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      const secondAssessment = availability["psychologist-1"].find(
        (a) => a.id === "slot-2"
      );

      expect(secondAssessment).toBe(undefined);
    });

    it("should exclude therapists from assessment availability", () => {
      const slots = [createMockSlot("slot-1", "therapist-1", 0)];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(0);
    });

    it("should exclude psychologists not matching patient criteria", () => {
      const slots = [createMockSlot("slot-1", "psychologist-1", 0)];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["NY"],
          ["CIGNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(0);
    });

    it("should handle multiple matching psychologists", () => {
      const slots1 = [
        createMockSlot("slot-1", "psychologist-1", 0),
        createMockSlot("slot-2", "psychologist-1", 2),
      ];
      const slots2 = [
        createMockSlot("slot-3", "psychologist-2", 1),
        createMockSlot("slot-4", "psychologist-2", 4),
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots1
        ),
        createMockClinician(
          "psychologist-2",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots2
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      // Verify both psychologists are in the availability
      expect(Object.keys(availability)).toHaveLength(2);
      // Only slot-1 should be included for psychologist-1, as slot-2 has no follow-ups
      expect(availability["psychologist-1"]).toHaveLength(1);
      expect(availability["psychologist-1"][0]).toMatchObject(slots1[0]);
      // Only slot-3 should be included for psychologist-2, as slot-4 has no follow-ups
      expect(availability["psychologist-2"]).toHaveLength(1);
      expect(availability["psychologist-2"][0]).toMatchObject(slots2[0]);

      // Psychologist 1 follow-ups
      const p1Assessment = availability["psychologist-1"][0];
      expect(p1Assessment.followups).toHaveLength(1);
      expect(p1Assessment.followups[0].id).toBe("slot-2");

      // Psychologist 2 follow-ups
      const p2Assessment = availability["psychologist-2"][0];
      expect(p2Assessment.followups).toHaveLength(1);
      expect(p2Assessment.followups[0].id).toBe("slot-4");
    });
  });

  describe("cache behavior", () => {
    it("should cache follow-ups for slots on the same day (cache set and hit)", () => {
      // Create multiple slots on the same day, spaced 2 hours apart (> 90 min assessment length)
      // This ensures getMaximumSlots doesn't filter them out
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0, 0), // Day 0, 10:00
        createMockSlot("slot-2", "psychologist-1", 0, 2), // Day 0, 12:00 (same day, 2 hours later)
        createMockSlot("slot-3", "psychologist-1", 3, 0), // Day 3 (followup for both day 0 slots)
        createMockSlot("slot-4", "psychologist-1", 5, 0), // Day 5 (followup for both day 0 slots)
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      // Both slot-1 and slot-2 are on day 0 and should have the same followups
      const slot1Assessment = availability["psychologist-1"].find(
        (a) => a.id === "slot-1"
      );
      const slot2Assessment = availability["psychologist-1"].find(
        (a) => a.id === "slot-2"
      );

      expect(slot1Assessment).toBeDefined();
      expect(slot2Assessment).toBeDefined();

      // Both should have the same followups (slot-3 and slot-4)
      expect(slot1Assessment!.followups).toHaveLength(2);
      expect(slot2Assessment!.followups).toHaveLength(2);

      expect(slot1Assessment!.followups[0].id).toBe("slot-3");
      expect(slot1Assessment!.followups[1].id).toBe("slot-4");

      expect(slot2Assessment!.followups[0].id).toBe("slot-3");
      expect(slot2Assessment!.followups[1].id).toBe("slot-4");
    });

    it("should use cache for multiple slots on the same day across different days", () => {
      const slots = [
        createMockSlot("slot-1", "psychologist-1", 0, 0), // Day 0, 10:00
        createMockSlot("slot-2", "psychologist-1", 0, 2), // Day 0, 12:00 (cache hit)
        createMockSlot("slot-3", "psychologist-1", 3, 0), // Day 3, 10:00
        createMockSlot("slot-4", "psychologist-1", 3, 2), // Day 3, 12:00 (cache hit)
        createMockSlot("slot-5", "psychologist-1", 6, 0), // Day 6, 10:00
      ];

      const clinicians = [
        createMockClinician(
          "psychologist-1",
          "PSYCHOLOGIST",
          ["CA"],
          ["AETNA"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getAssessmentAvailability(patient);

      // Verify slots on day 0 have the same followups
      const slot1 = availability["psychologist-1"].find(
        (a) => a.id === "slot-1"
      );
      const slot2 = availability["psychologist-1"].find(
        (a) => a.id === "slot-2"
      );

      expect(slot1!.followups).toHaveLength(3); // slot-3, slot-4, slot-5
      expect(slot2!.followups).toHaveLength(3); // same as slot-1 (cached)

      // Verify slots on day 3 have the same followups
      const slot3 = availability["psychologist-1"].find(
        (a) => a.id === "slot-3"
      );
      const slot4 = availability["psychologist-1"].find(
        (a) => a.id === "slot-4"
      );

      expect(slot3!.followups).toHaveLength(1); // slot-5
      expect(slot4!.followups).toHaveLength(1); // same as slot-3 (cached)
    });
  });

  describe("edge cases", () => {
    it("should handle empty clinician list", () => {
      const scheduler = new SchedulerService([]);
      const patient = createMockPatient("CA", "AETNA");

      const therapyAvailability = scheduler.getTherapyAvailability(patient);
      const assessmentAvailability =
        scheduler.getAssessmentAvailability(patient);

      expect(Object.keys(therapyAvailability)).toHaveLength(0);
      expect(Object.keys(assessmentAvailability)).toHaveLength(0);
    });

    it("should handle clinicians with no available slots", () => {
      const clinicians = [
        createMockClinician("therapist-1", "THERAPIST", ["CA"], ["AETNA"], []),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("CA", "AETNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(availability["therapist-1"]).toEqual([]);
    });

    it("should handle clinicians with multiple states and insurances", () => {
      const slots = [createMockSlot("slot-1", "therapist-1", 0)];

      const clinicians = [
        createMockClinician(
          "therapist-1",
          "THERAPIST",
          ["CA", "NY", "TX"],
          ["AETNA", "CIGNA", "BLUE_CROSS"],
          slots
        ),
      ];

      const scheduler = new SchedulerService(clinicians);
      const patient = createMockPatient("NY", "CIGNA");
      const availability = scheduler.getTherapyAvailability(patient);

      expect(Object.keys(availability)).toHaveLength(1);
      expect(availability["therapist-1"]).toEqual(slots);
    });
  });
});
