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
  const maxNum = Number(rows[0]?.max_num ?? 0);
  return padId(prefix, maxNum + 1);
}

export async function generateStudentId(): Promise<string> {
  return getNextSequence("student", "S");
}

export async function generateProfessorId(): Promise<string> {
  return getNextSequence("professor", "P");
}

/**
 * Returns a function that produces sequential student IDs without re-querying.
 * Call once before a batch, then call the returned function for each new ID.
 */
export async function createStudentIdGenerator(): Promise<() => string> {
  const idColumn = "student_id";
  const prefix = "S";
  const rows = await prisma.$queryRawUnsafe<{ max_num: number | null }[]>(
    `SELECT MAX(CAST(SUBSTRING(${idColumn}, 2) AS UNSIGNED)) AS max_num FROM Student WHERE ${idColumn} REGEXP ?`,
    `^${prefix}[0-9]+$`,
  );
  let counter = Number(rows[0]?.max_num ?? 0);
  return () => padId(prefix, ++counter);
}
