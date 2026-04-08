import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { createCourseSchema } from "@/lib/validations/import";

function generateCourseId() {
  return `C${Date.now().toString(36).toUpperCase()}`;
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
      course_id: generateCourseId(),
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
