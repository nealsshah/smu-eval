import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Create open evaluation cycles for all 4 groups
  const cycles = [
    {
      cycle_id: "EC005",
      course_id: "C001",
      group_id: "G001",
      semester: 1,
      open_datetime: now,
      close_datetime: twoWeeksFromNow,
      status: "Open",
      config_valid_flag: true,
      config_validation_msg: "Midterm peer evaluation cycle",
    },
    {
      cycle_id: "EC006",
      course_id: "C001",
      group_id: "G002",
      semester: 1,
      open_datetime: now,
      close_datetime: twoWeeksFromNow,
      status: "Open",
      config_valid_flag: true,
      config_validation_msg: "Midterm peer evaluation cycle",
    },
    {
      cycle_id: "EC007",
      course_id: "C002",
      group_id: "G003",
      semester: 2,
      open_datetime: now,
      close_datetime: twoWeeksFromNow,
      status: "Open",
      config_valid_flag: true,
      config_validation_msg: "Midterm peer evaluation cycle",
    },
    {
      cycle_id: "EC008",
      course_id: "C002",
      group_id: "G004",
      semester: 2,
      open_datetime: now,
      close_datetime: twoWeeksFromNow,
      status: "Open",
      config_valid_flag: true,
      config_validation_msg: "Midterm peer evaluation cycle",
    },
  ];

  for (const cycle of cycles) {
    // Check if already exists
    const existing = await prisma.evaluationCycle.findUnique({
      where: { cycle_id: cycle.cycle_id },
    });
    if (existing) {
      console.log(`Cycle ${cycle.cycle_id} already exists, updating to Open...`);
      await prisma.evaluationCycle.update({
        where: { cycle_id: cycle.cycle_id },
        data: {
          open_datetime: cycle.open_datetime,
          close_datetime: cycle.close_datetime,
          status: "Open",
        },
      });
    } else {
      await prisma.evaluationCycle.create({ data: cycle });
      console.log(`Created cycle ${cycle.cycle_id} for group ${cycle.group_id}`);
    }
  }

  console.log("\nOpen evaluation cycles created. Students can now submit new evaluations.");
  console.log(`Close date: ${twoWeeksFromNow.toISOString()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
