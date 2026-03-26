import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  console.log("Generated hash:", hash);

  // Update all students
  const students = await prisma.student.findMany();
  for (const s of students) {
    await prisma.student.update({
      where: { student_id: s.student_id },
      data: { password_hash: hash },
    });
    console.log(`Updated student ${s.student_id} (${s.email})`);
  }

  // Update all professors
  const professors = await prisma.professor.findMany();
  for (const p of professors) {
    await prisma.professor.update({
      where: { professor_id: p.professor_id },
      data: { password_hash: hash },
    });
    console.log(`Updated professor ${p.professor_id} (${p.email})`);
  }

  console.log("\nAll passwords set to: password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
