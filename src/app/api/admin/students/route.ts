import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await prisma.student.findMany({
    include: {
      Enrollment: { include: { Course: true } },
      GroupMember: { include: { ProjectGroup: true } },
      _count: {
        select: {
          PeerEvaluation_PeerEvaluation_rater_student_idToStudent: { where: { status: "Submitted" } },
        },
      },
    },
    orderBy: { last_name: "asc" },
  });

  return NextResponse.json(students);
}
