import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { student_ids } = body;

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return NextResponse.json(
      { error: "student_ids must be a non-empty array." },
      { status: 400 }
    );
  }

  const professorId = session.user.id;

  // Verify all students are enrolled in courses owned by this professor
  const professorCourses = await prisma.course.findMany({
    where: { professor_id: professorId },
    select: { course_id: true },
  });
  const professorCourseIds = professorCourses.map((c) => c.course_id);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      student_id: { in: student_ids },
      course_id: { in: professorCourseIds },
    },
    select: { student_id: true },
  });

  const enrolledStudentIds = [...new Set(enrollments.map((e) => e.student_id))];

  if (enrolledStudentIds.length !== student_ids.length) {
    return NextResponse.json(
      { error: "Some students are not enrolled in your courses." },
      { status: 403 }
    );
  }

  // Delete each student fully: scores, evaluations, group members, enrollments, then student
  await prisma.$transaction(
    [
      prisma.peerEvaluationScore.deleteMany({
        where: {
          PeerEvaluation: {
            OR: [
              { rater_student_id: { in: student_ids } },
              { ratee_student_id: { in: student_ids } },
            ],
          },
        },
      }),
      prisma.peerEvaluation.deleteMany({
        where: {
          OR: [
            { rater_student_id: { in: student_ids } },
            { ratee_student_id: { in: student_ids } },
          ],
        },
      }),
      prisma.groupMember.deleteMany({
        where: { student_id: { in: student_ids } },
      }),
      prisma.enrollment.deleteMany({
        where: { student_id: { in: student_ids } },
      }),
      prisma.student.deleteMany({
        where: { student_id: { in: student_ids } },
      }),
    ],
  );

  return NextResponse.json({
    success: true,
    deleted_count: student_ids.length,
  });
}
