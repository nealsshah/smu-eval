import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pad(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(3, "0")}`;
}

async function main() {
  console.log("Starting ID migration...\n");

  // Disable FK checks for the duration
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");

  try {
    // --- Migrate Students ---
    const students = await prisma.student.findMany({ orderBy: { student_id: "asc" } });
    console.log(`Found ${students.length} students to migrate`);

    for (let i = 0; i < students.length; i++) {
      const oldId = students[i].student_id;
      const newId = pad("S", i + 1);

      if (oldId === newId) {
        console.log(`  Student ${oldId} — already correct`);
        continue;
      }

      // Update FK references first, then the PK
      await prisma.$executeRawUnsafe(
        "UPDATE `Enrollment` SET `student_id` = ? WHERE `student_id` = ?",
        newId, oldId
      );
      await prisma.$executeRawUnsafe(
        "UPDATE `GroupMember` SET `student_id` = ? WHERE `student_id` = ?",
        newId, oldId
      );
      await prisma.$executeRawUnsafe(
        "UPDATE `PeerEvaluation` SET `rater_student_id` = ? WHERE `rater_student_id` = ?",
        newId, oldId
      );
      await prisma.$executeRawUnsafe(
        "UPDATE `PeerEvaluation` SET `ratee_student_id` = ? WHERE `ratee_student_id` = ?",
        newId, oldId
      );
      // Update the PK last
      await prisma.$executeRawUnsafe(
        "UPDATE `Student` SET `student_id` = ? WHERE `student_id` = ?",
        newId, oldId
      );

      console.log(`  Student ${oldId} -> ${newId}`);
    }

    // --- Migrate Professors ---
    const professors = await prisma.professor.findMany({ orderBy: { professor_id: "asc" } });
    console.log(`\nFound ${professors.length} professors to migrate`);

    for (let i = 0; i < professors.length; i++) {
      const oldId = professors[i].professor_id;
      const newId = pad("P", i + 1);

      if (oldId === newId) {
        console.log(`  Professor ${oldId} — already correct`);
        continue;
      }

      // Update FK references first, then the PK
      await prisma.$executeRawUnsafe(
        "UPDATE `Course` SET `professor_id` = ? WHERE `professor_id` = ?",
        newId, oldId
      );
      await prisma.$executeRawUnsafe(
        "UPDATE `ProjectGroup` SET `created_by_professor_id` = ? WHERE `created_by_professor_id` = ?",
        newId, oldId
      );
      await prisma.$executeRawUnsafe(
        "UPDATE `ImportLog` SET `professor_id` = ? WHERE `professor_id` = ?",
        newId, oldId
      );
      // Update the PK last
      await prisma.$executeRawUnsafe(
        "UPDATE `Professor` SET `professor_id` = ? WHERE `professor_id` = ?",
        newId, oldId
      );

      console.log(`  Professor ${oldId} -> ${newId}`);
    }

    console.log("\nMigration complete!");
  } finally {
    // Always re-enable FK checks
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
