import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { createCourseSchema } from "@/lib/validations/import";

async function generateCourseId(): Promise<string> {
  const courses = await prisma.course.findMany({
    where: { course_id: { startsWith: "C" } },
    select: { course_id: true },
  });

  let maxNum = 0;
  for (const c of courses) {
    const num = parseInt(c.course_id.slice(1), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  return `C${String(maxNum + 1).padStart(3, "0")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { professor_id: session.user.id },
    orderBy: { course_name: "asc" },
    select: {
      course_id: true,
      course_name: true,
      semester: true,
    },
  });

  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCourseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { course_name, semester } = parsed.data;

  const course = await prisma.course.create({
    data: {
      course_id: await generateCourseId(),
      course_name: course_name.trim(),
      professor_id: session.user.id,
      semester,
    },
  });

  return NextResponse.json(
    {
      course_id: course.course_id,
      course_name: course.course_name,
      semester: course.semester,
    },
    { status: 201 }
  );
}
