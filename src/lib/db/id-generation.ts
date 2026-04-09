import { prisma } from "./prisma";

function padId(prefix: string, num: number): string {
  return `${prefix}${String(num).padStart(3, "0")}`;
}

async function getNextSequence(
  table: "student" | "professor",
  prefix: string,
): Promise<string> {
  const idColumn = table === "student" ? "student_id" : "professor_id";
  const rows = await prisma.$queryRawUnsafe<{ max_num: number | null }[]>(
    `SELECT MAX(CAST(SUBSTRING(${idColumn}, 2) AS UNSIGNED)) AS max_num FROM ${table === "student" ? "Student" : "Professor"} WHERE ${idColumn} REGEXP ?`,
    `^${prefix}[0-9]+$`,
  );
  const maxNum = rows[0]?.max_num ?? 0;
  return padId(prefix, maxNum + 1);
}

export async function generateStudentId(): Promise<string> {
  return getNextSequence("student", "S");
}

export async function generateProfessorId(): Promise<string> {
  return getNextSequence("professor", "P");
}
