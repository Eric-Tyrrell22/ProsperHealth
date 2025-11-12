import { v4 as uuidv4 } from "uuid";
import SchedulerService from "./starter-code/schedulerService";
import { Patient } from "./starter-code/patient";
import { Clinician } from "./starter-code/clinician";
import { AvailableAppointmentSlot } from "./starter-code/appointment";

// Patient data
const patient: Patient = {
  id: uuidv4(),
  firstName: "Byrne",
  lastName: "Hollander",
  state: "NY",
  insurance: "AETNA",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Clinician data
const clinician: Clinician = {
  id: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
  firstName: "Jane",
  lastName: "Doe",
  states: ["NY", "CA"],
  insurances: ["AETNA", "CIGNA"],
  clinicianType: "PSYCHOLOGIST",
  appointments: [],
  availableSlots: [
    {
      id: uuidv4(),
      clinicianId: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
      length: 90,
      date: new Date("2024-08-19T12:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      clinicianId: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
      length: 90,
      date: new Date("2024-08-19T12:15:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      clinicianId: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
      length: 90,
      date: new Date("2024-08-21T12:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      clinicianId: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
      length: 90,
      date: new Date("2024-08-21T15:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      clinicianId: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
      length: 90,
      date: new Date("2024-08-22T15:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      clinicianId: "9c516382-c5b2-4677-a7ac-4e100fa35bdd",
      length: 90,
      date: new Date("2024-08-28T12:15:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  maxDailyAppointments: 2,
  maxWeeklyAppointments: 8,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Initialize the scheduler service with the clinician
const schedulerService = new SchedulerService([clinician]);

// Get assessment availability for the patient
console.log("Patient:", {
  name: `${patient.firstName} ${patient.lastName}`,
  state: patient.state,
  insurance: patient.insurance,
});

console.log("\nClinician:", {
  name: `${clinician.firstName} ${clinician.lastName}`,
  type: clinician.clinicianType,
  states: clinician.states,
  insurances: clinician.insurances,
});

console.log("\n=== Assessment Availability ===");
const assessmentAvailability = schedulerService.getAssessmentAvailability(patient);

for (const [clinicianId, initialAssessments] of Object.entries(assessmentAvailability)) {
  console.log(`\nClinician ID: ${clinicianId}`);
  console.log(`\nInitial Assessment Slots (${initialAssessments.length}):`);

  initialAssessments.forEach((assessment, index) => {
    console.log(`  ${index + 1}. ${assessment.date.toISOString()} (${assessment.length} mins)`);
    console.log(`     Follow-ups (${assessment.followups.length}):`);
    assessment.followups.forEach((followUp, followUpIndex) => {
      console.log(`       ${followUpIndex + 1}. ${followUp.date.toISOString()} (${followUp.length} mins)`);
    });
  });
}
