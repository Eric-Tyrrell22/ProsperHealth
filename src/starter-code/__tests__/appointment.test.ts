import { addMinutes } from "date-fns";
import {
  getMaximumSlots,
  AvailableAppointmentSlot,
  THERAPY_LENGTH,
  ASSESSMENT_LENGTH,
} from "../appointment";

//also ai generated.
describe("getMaximumSlots", () => {
  const baseDate = new Date("2025-01-15T10:00:00Z");

  const createMockSlot = (
    id: string,
    clinicianId: string,
    date: Date,
    length: number = 60
  ): AvailableAppointmentSlot => ({
    id,
    clinicianId,
    date,
    length,
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  it("should return empty array when input is empty", () => {
    const result = getMaximumSlots([], THERAPY_LENGTH);
    expect(result).toEqual([]);
  });

  it("should return all slots when they are spaced far apart", () => {
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 60),
      createMockSlot("slot-2", "clinician-1", addMinutes(baseDate, 120), 60),
      createMockSlot("slot-3", "clinician-1", addMinutes(baseDate, 240), 60),
    ];

    const result = getMaximumSlots(slots, THERAPY_LENGTH);
    expect(result).toHaveLength(3);
    expect(result).toEqual(slots);
  });

  it("should filter out overlapping slots for therapy duration (60 mins)", () => {
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 60),
      createMockSlot("slot-2", "clinician-1", addMinutes(baseDate, 30), 60),
      createMockSlot("slot-3", "clinician-1", addMinutes(baseDate, 60), 60),
      createMockSlot("slot-4", "clinician-1", addMinutes(baseDate, 90), 60),
    ];

    const result = getMaximumSlots(slots, THERAPY_LENGTH);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("slot-1");
    expect(result[1].id).toBe("slot-3");
  });

  it("should filter out overlapping slots for assessment duration (90 mins)", () => {
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 90),
      createMockSlot("slot-2", "clinician-1", addMinutes(baseDate, 45), 90),
      createMockSlot("slot-3", "clinician-1", addMinutes(baseDate, 90), 90),
      createMockSlot("slot-4", "clinician-1", addMinutes(baseDate, 180), 90),
    ];

    const result = getMaximumSlots(slots, ASSESSMENT_LENGTH);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("slot-1");
    expect(result[1].id).toBe("slot-3");
    expect(result[2].id).toBe("slot-4");
  });

  it("should handle slots at exact duration boundary", () => {
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 60),
      createMockSlot("slot-2", "clinician-1", addMinutes(baseDate, 60), 60),
      createMockSlot("slot-3", "clinician-1", addMinutes(baseDate, 120), 60),
    ];

    const result = getMaximumSlots(slots, THERAPY_LENGTH);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("slot-1");
    expect(result[1].id).toBe("slot-2");
    expect(result[2].id).toBe("slot-3");
  });

  it("should handle single slot", () => {
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 60),
    ];

    const result = getMaximumSlots(slots, THERAPY_LENGTH);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(slots[0]);
  });

  it("should handle slots very close together", () => {
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 60),
      createMockSlot("slot-2", "clinician-1", addMinutes(baseDate, 1), 60),
      createMockSlot("slot-3", "clinician-1", addMinutes(baseDate, 2), 60),
    ];

    const result = getMaximumSlots(slots, THERAPY_LENGTH);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("slot-1");
  });

  it("should work with custom duration", () => {
    const customDuration = 45;
    const slots: AvailableAppointmentSlot[] = [
      createMockSlot("slot-1", "clinician-1", baseDate, 45),
      createMockSlot("slot-2", "clinician-1", addMinutes(baseDate, 30), 45),
      createMockSlot("slot-3", "clinician-1", addMinutes(baseDate, 45), 45),
      createMockSlot("slot-4", "clinician-1", addMinutes(baseDate, 90), 45),
    ];

    const result = getMaximumSlots(slots, customDuration);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("slot-1");
    expect(result[1].id).toBe("slot-3");
    expect(result[2].id).toBe("slot-4");
  });

  it("should maximize slots with 15-minute intervals and 90-minute duration", () => {
    const now = new Date();
    const testSlots: AvailableAppointmentSlot[] = [
      {
        id: "1",
        date: new Date("2024-08-19T12:00:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "2",
        date: new Date("2024-08-19T12:15:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "3",
        date: new Date("2024-08-19T12:30:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "4",
        date: new Date("2024-08-19T12:45:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "5",
        date: new Date("2024-08-19T13:00:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "6",
        date: new Date("2024-08-19T13:15:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "7",
        date: new Date("2024-08-19T13:30:00.000Z"),
        clinicianId: "test",
        length: 60,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const result = getMaximumSlots(testSlots, 90);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("7");
  });
});
