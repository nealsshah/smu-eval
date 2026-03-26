import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET: Fetch all evaluations for a group (across all cycles)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the professor owns this group's course
  const group = await prisma.projectGroup.findUnique({
    where: { group_id: groupId },
    include: {
      Course: true,
      GroupMember: {
        include: { Student: true },
      },
      EvaluationCycle: {
        include: {
          PeerEvaluation: {
            include: {
              PeerEvaluationScore: true,
              Student_PeerEvaluation_rater_student_idToStudent: true,
              Student_PeerEvaluation_ratee_student_idToStudent: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.Course.professor_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build a map: rater -> ratee -> evaluation info
  const members = group.GroupMember.map((m) => ({
    student_id: m.student_id,
    first_name: m.Student.first_name,
    last_name: m.Student.last_name,
  }));

  const evaluations = group.EvaluationCycle.flatMap((cycle) =>
    cycle.PeerEvaluation.map((pe) => ({
      eval_id: pe.eval_id,
      cycle_id: pe.cycle_id,
      rater_student_id: pe.rater_student_id,
      ratee_student_id: pe.ratee_student_id,
      status: pe.status,
      submitted_at: pe.submitted_at,
      written_feedback: pe.written_feedback,
      rater_name: `${pe.Student_PeerEvaluation_rater_student_idToStudent.first_name} ${pe.Student_PeerEvaluation_rater_student_idToStudent.last_name}`,
      ratee_name: `${pe.Student_PeerEvaluation_ratee_student_idToStudent.first_name} ${pe.Student_PeerEvaluation_ratee_student_idToStudent.last_name}`,
      scores: pe.PeerEvaluationScore.map((s) => ({
        criterion_id: s.criterion_id,
        score: Number(s.score),
      })),
    }))
  );

  return NextResponse.json({ members, evaluations, group_name: group.group_name });
}
