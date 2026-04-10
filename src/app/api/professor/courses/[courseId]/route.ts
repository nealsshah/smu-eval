import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  // Verify the course belongs to this professor
  const course = await prisma.course.findUnique({
    where: { course_id: courseId },
    select: { professor_id: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (course.professor_id !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Gather related IDs for cascade delete
  const groups = await prisma.projectGroup.findMany({
    where: { course_id: courseId },
    select: { group_id: true },
  });
  const groupIds = groups.map((g) => g.group_id);

  const cycles = await prisma.evaluationCycle.findMany({
    where: { course_id: courseId },
    select: { cycle_id: true },
  });
  const cycleIds = cycles.map((c) => c.cycle_id);

  await prisma.$transaction([
    // Evaluations
    prisma.peerEvaluationScore.deleteMany({
      where: { PeerEvaluation: { cycle_id: { in: cycleIds } } },
    }),
    prisma.peerEvaluation.deleteMany({
      where: { cycle_id: { in: cycleIds } },
    }),
    prisma.evaluationCycle.deleteMany({ where: { course_id: courseId } }),
    // Groups
    prisma.groupMember.deleteMany({ where: { group_id: { in: groupIds } } }),
    prisma.projectGroup.deleteMany({ where: { course_id: courseId } }),
    // Enrollments
    prisma.enrollment.deleteMany({ where: { course_id: courseId } }),
    // Course
    prisma.course.delete({ where: { course_id: courseId } }),
  ]);

  return NextResponse.json({ success: true });
}
