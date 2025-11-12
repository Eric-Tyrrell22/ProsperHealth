import SchedulerService from "./src/starter-code/schedulerService";
import { AvailableAppointmentSlot } from "./src/starter-code/appointment";

// ai generated for a quick spot check before I write tests.
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

const scheduler = new SchedulerService([]);

const result = scheduler.getMaximumSlots(testSlots, 90);

console.log("Input slots:");
testSlots.forEach((slot) => {
  console.log(`  ${slot.id}: ${slot.date.toISOString()}`);
});

console.log("\nDuration: 90 minutes");

console.log("\nMaximized slots (filtered to maximize appointments):");
result.forEach((slot) => {
  console.log(`  ${slot.id}: ${slot.date.toISOString()}`);
});

console.log(`\nTotal possible appointments: ${result.length}`);
