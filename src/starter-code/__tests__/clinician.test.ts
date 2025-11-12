import { addDays, addHours } from "date-fns";
import {
  filterAvailableClinicians,
  getAvailableSlots,
  Clinician,
  ClinicianType,
} from "../clinician";
import { Patient } from "../patient";
import { AvailableAppointmentSlot, Appointment } from "../appointment";

describe("clinician", () => {
  const baseDate = new Date("2025-01-15T10:00:00Z");

  const createMockSlot = (
    id: string,
    clinicianId: string,
    daysOffset: number,
    length: number = 60
  ): AvailableAppointmentSlot => ({
    id,
    clinicianId,
    date: addDays(baseDate, daysOffset),
    length,
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  const createMockAppointment = (
    id: string,
    scheduledFor: Date
  ): Appointment => ({
    id,
    clinicianId: "clinician-1",
    patientId: "patient-1",
    scheduledFor,
    appointmentType: "THERAPY_SIXTY_MINS",
    status: "UPCOMING",
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  const createMockClinician = (
    id: string,
    type: ClinicianType,
    states: string[],
    insurances: string[],
    slots: AvailableAppointmentSlot[] = [],
    appointments: Appointment[] = [],
    maxDailyAppointments: number = 8,
    maxWeeklyAppointments: number = 40
  ): Clinician => ({
    id,
    firstName: "Test",
    lastName: "Clinician",
    states: states as any,
    insurances: insurances as any,
    clinicianType: type,
    appointments,
    availableSlots: slots,
    maxDailyAppointments,
    maxWeeklyAppointments,
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

  describe("filterAvailableClinicians", () => {
    it("should return clinicians matching patient state, insurance, and type", () => {
      const clinicians = [
        createMockClinician("clinician-1", "THERAPIST", ["CA"], ["AETNA"]),
        createMockClinician("clinician-2", "PSYCHOLOGIST", ["CA"], ["AETNA"]),
      ];

      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("clinician-1");
    });

    it("should filter out clinicians not in patient state", () => {
      const clinicians = [
        createMockClinician("clinician-1", "THERAPIST", ["NY"], ["AETNA"]),
        createMockClinician("clinician-2", "THERAPIST", ["CA"], ["AETNA"]),
      ];

      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("clinician-2");
    });

    it("should filter out clinicians not accepting patient insurance", () => {
      const clinicians = [
        createMockClinician("clinician-1", "THERAPIST", ["CA"], ["CIGNA"]),
        createMockClinician("clinician-2", "THERAPIST", ["CA"], ["AETNA"]),
      ];

      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("clinician-2");
    });

    it("should filter out clinicians of different type", () => {
      const clinicians = [
        createMockClinician("clinician-1", "PSYCHOLOGIST", ["CA"], ["AETNA"]),
        createMockClinician("clinician-2", "THERAPIST", ["CA"], ["AETNA"]),
      ];

      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("clinician-2");
    });

    it("should handle clinicians with multiple states", () => {
      const clinicians = [
        createMockClinician(
          "clinician-1",
          "THERAPIST",
          ["CA", "NY", "TX"],
          ["AETNA"]
        ),
      ];

      const patient = createMockPatient("NY", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("clinician-1");
    });

    it("should handle clinicians with multiple insurances", () => {
      const clinicians = [
        createMockClinician(
          "clinician-1",
          "THERAPIST",
          ["CA"],
          ["AETNA", "CIGNA", "BLUE_CROSS"]
        ),
      ];

      const patient = createMockPatient("CA", "CIGNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("clinician-1");
    });

    it("should return empty array when no clinicians match", () => {
      const clinicians = [
        createMockClinician("clinician-1", "THERAPIST", ["NY"], ["CIGNA"]),
      ];

      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(0);
    });

    it("should return empty array when clinicians list is empty", () => {
      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians([], patient, "THERAPIST");

      expect(result).toHaveLength(0);
    });

    it("should return multiple matching clinicians", () => {
      const clinicians = [
        createMockClinician("clinician-1", "THERAPIST", ["CA"], ["AETNA"]),
        createMockClinician("clinician-2", "THERAPIST", ["CA"], ["AETNA"]),
        createMockClinician("clinician-3", "THERAPIST", ["CA"], ["AETNA"]),
      ];

      const patient = createMockPatient("CA", "AETNA");
      const result = filterAvailableClinicians(
        clinicians,
        patient,
        "THERAPIST"
      );

      expect(result).toHaveLength(3);
    });
  });

  describe("getAvailableSlots", () => {
    it("should return all slots when no appointments exist", () => {
      const slots = [
        createMockSlot("slot-1", "clinician-1", 0),
        createMockSlot("slot-2", "clinician-1", 1),
        createMockSlot("slot-3", "clinician-1", 2),
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots
      );

      const result = getAvailableSlots(clinician, 60);

      expect(result).toHaveLength(3);
    });

    it("should filter slots when daily appointment limit is reached", () => {
      const day1 = addDays(baseDate, 0);
      const slots = [
        createMockSlot("slot-1", "clinician-1", 0),
        createMockSlot("slot-2", "clinician-1", 1),
      ];

      const appointments = [
        createMockAppointment("appt-1", addHours(day1, 1)),
        createMockAppointment("appt-2", addHours(day1, 2)),
        createMockAppointment("appt-3", addHours(day1, 3)),
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        3, // maxDailyAppointments
        40
      );

      const result = getAvailableSlots(clinician, 60);

      // slot-1 should be filtered out because daily limit is reached
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("slot-2");
    });

    it("should filter slots when weekly appointment limit is reached", () => {
      const week1Start = baseDate;
      const slots = [
        createMockSlot("slot-1", "clinician-1", 0),
        createMockSlot("slot-2", "clinician-1", 8), // Next week
      ];

      // Create 3 appointments in the first week (limit is 3, so this should block new slots)
      // Note: based on startOfWeek, day 4 would be in a different week for this baseDate
      const appointments = [
        createMockAppointment("appt-1", addDays(week1Start, 0)),
        createMockAppointment("appt-2", addDays(week1Start, 1)),
        createMockAppointment("appt-3", addDays(week1Start, 2)),
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        8,
        3 // maxWeeklyAppointments - already at limit with 3 appointments
      );

      const result = getAvailableSlots(clinician, 60);

      // slot-1 should be filtered out because weekly limit is reached (3 >= 3)
      // slot-2 is in the next week, so it should be available
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("slot-2");
    });

    it("should handle both daily and weekly limits", () => {
      const week1Start = baseDate;
      const slots = [
        createMockSlot("slot-1", "clinician-1", 0),
        createMockSlot("slot-2", "clinician-1", 1),
        createMockSlot("slot-3", "clinician-1", 8),
      ];

      const appointments = [
        // Day 0: 2 appointments (below daily limit of 3, but counting toward weekly)
        createMockAppointment("appt-1", addHours(addDays(week1Start, 0), 1)),
        createMockAppointment("appt-2", addHours(addDays(week1Start, 0), 2)),
        // Day 1: 2 appointments
        createMockAppointment("appt-3", addHours(addDays(week1Start, 1), 1)),
        createMockAppointment("appt-4", addHours(addDays(week1Start, 1), 2)),
        // Total for week: 4 appointments (weekly limit is 5)
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        3, // maxDailyAppointments
        5 // maxWeeklyAppointments
      );

      const result = getAvailableSlots(clinician, 60);

      // slot-1: daily count = 2, weekly count = 4 (allowed)
      // slot-2: daily count = 2, weekly count = 4 (allowed)
      // slot-3: in next week (allowed)
      expect(result).toHaveLength(3);
    });

    it("should properly count appointments per day", () => {
      const day1 = addDays(baseDate, 0);
      const day2 = addDays(baseDate, 1);
      const slots = [
        createMockSlot("slot-1", "clinician-1", 0),
        createMockSlot("slot-2", "clinician-1", 1),
      ];

      const appointments = [
        // 2 appointments on day 1
        createMockAppointment("appt-1", addHours(day1, 1)),
        createMockAppointment("appt-2", addHours(day1, 2)),
        // 1 appointment on day 2
        createMockAppointment("appt-3", addHours(day2, 1)),
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        2, // maxDailyAppointments
        40
      );

      const result = getAvailableSlots(clinician, 60);

      // slot-1 should be filtered (2 appointments on day 0)
      // slot-2 should be filtered (1 appointment on day 1, but slot would make it 2)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("slot-2");
    });

    it("should maximize slots based on duration", () => {
      // Create overlapping slots
      const slots = [
        {
          id: "slot-1",
          clinicianId: "clinician-1",
          date: baseDate,
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-2",
          clinicianId: "clinician-1",
          date: addHours(baseDate, 0.5), // 30 minutes later
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-3",
          clinicianId: "clinician-1",
          date: addHours(baseDate, 1), // 60 minutes later
          length: 60,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots
      );

      const result = getAvailableSlots(clinician, 60);

      // Should maximize and return slot-1 and slot-3
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("slot-1");
      expect(result[1].id).toBe("slot-3");
    });

    it("should return empty array when all slots are filtered", () => {
      const day1 = addDays(baseDate, 0);
      const slots = [createMockSlot("slot-1", "clinician-1", 0)];

      const appointments = [createMockAppointment("appt-1", addHours(day1, 1))];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        1, // maxDailyAppointments
        40
      );

      const result = getAvailableSlots(clinician, 60);

      expect(result).toHaveLength(0);
    });

    it("should return empty array when no slots exist", () => {
      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        []
      );

      const result = getAvailableSlots(clinician, 60);

      expect(result).toHaveLength(0);
    });

    it("should handle different durations correctly", () => {
      const slots = [
        {
          id: "slot-1",
          clinicianId: "clinician-1",
          date: baseDate,
          length: 90,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-2",
          clinicianId: "clinician-1",
          date: addHours(baseDate, 1), // 60 minutes later
          length: 90,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: "slot-3",
          clinicianId: "clinician-1",
          date: addHours(baseDate, 1.5), // 90 minutes later
          length: 90,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "PSYCHOLOGIST",
        ["CA"],
        ["AETNA"],
        slots
      );

      const result = getAvailableSlots(clinician, 90);

      // slot-1 and slot-3 should be included (90 minutes apart)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("slot-1");
      expect(result[1].id).toBe("slot-3");
    });

    it("should correctly handle edge case where daily limit is exactly met", () => {
      const day1 = addDays(baseDate, 0);
      const slots = [createMockSlot("slot-1", "clinician-1", 0)];

      const appointments = [
        createMockAppointment("appt-1", addHours(day1, 1)),
        createMockAppointment("appt-2", addHours(day1, 2)),
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        3, // maxDailyAppointments - currently at 2, slot would make 3
        40
      );

      const result = getAvailableSlots(clinician, 60);

      // Should be allowed since 2 < 3
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("slot-1");
    });

    it("should correctly handle edge case where weekly limit is exactly met", () => {
      const week1Start = baseDate;
      const slots = [createMockSlot("slot-1", "clinician-1", 0)];

      const appointments = [
        createMockAppointment("appt-1", addDays(week1Start, 0)),
        createMockAppointment("appt-2", addDays(week1Start, 1)),
      ];

      const clinician = createMockClinician(
        "clinician-1",
        "THERAPIST",
        ["CA"],
        ["AETNA"],
        slots,
        appointments,
        8,
        3 // maxWeeklyAppointments - currently at 2, slot would make 3
      );

      const result = getAvailableSlots(clinician, 60);

      // Should be allowed since 2 < 3
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("slot-1");
    });
  });
});
