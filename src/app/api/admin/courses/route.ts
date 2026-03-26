import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    include: {
      Professor: true,
      ProjectGroup: {
        include: {
          GroupMember: { include: { Student: true } },
        },
      },
      _count: { select: { Enrollment: true, EvaluationCycle: true } },
    },
    orderBy: { course_name: "asc" },
  });

  return NextResponse.json(courses);
}
