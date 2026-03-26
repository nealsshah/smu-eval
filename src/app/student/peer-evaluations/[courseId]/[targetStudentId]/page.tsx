import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { pickActiveCycle } from "@/lib/services/evaluation";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PeerEvaluationForm } from "@/components/forms/PeerEvaluationForm";

export default async function EvaluationFormPage({
  params,
}: {
  params: Promise<{ courseId: string; targetStudentId: string }>;
}) {
  const { courseId, targetStudentId } = await params;
  const session = await requireAuth("student");
  const studentId = session.user.id;

  // Prevent self-evaluation
  if (targetStudentId === studentId) {
    redirect(`/student/peer-evaluations/${courseId}`);
  }

  // Get course
  const course = await prisma.course.findUnique({ where: { course_id: courseId } });
  if (!course) notFound();

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, course_id: courseId },
  });
  if (!enrollment) notFound();

  // Get group membership
  const groupMembership = await prisma.groupMember.findFirst({
    where: {
      student_id: studentId,
      ProjectGroup: { course_id: courseId },
    },
    include: {
      ProjectGroup: {
        include: {
          GroupMember: { include: { Student: true } },
          EvaluationCycle: true,
        },
      },
    },
  });

  if (!groupMembership) notFound();

  const group = groupMembership.ProjectGroup;
  const cycle = pickActiveCycle(group.EvaluationCycle);
  if (!cycle) notFound();

  // Verify target is in same group
  const targetMember = group.GroupMember.find((m) => m.student_id === targetStudentId);
  if (!targetMember) notFound();

  const targetStudent = targetMember.Student;

  // Get existing evaluation if any
  const existingEval = await prisma.peerEvaluation.findFirst({
    where: {
      rater_student_id: studentId,
      ratee_student_id: targetStudentId,
      cycle_id: cycle.cycle_id,
    },
    include: { PeerEvaluationScore: true },
  });

  // If already submitted, show read-only
  const isSubmitted = existingEval?.status === "Submitted";

  // Build initial scores map
  const initialScores: Record<string, number> = {};
  if (existingEval?.PeerEvaluationScore) {
    for (const score of existingEval.PeerEvaluationScore) {
      initialScores[score.criterion_id] = Number(score.score);
    }
  }

  // Get all peers for the dropdown
  const peers = group.GroupMember.filter((m) => m.student_id !== studentId).map((m) => ({
    student_id: m.student_id,
    name: `${m.Student.first_name} ${m.Student.last_name}`,
  }));

  return (
    <div>
      <PageHeader
        title="Submit Peer Evaluation"
        subtitle={`Course: ${course.course_name}`}
      />

      <PeerEvaluationForm
        courseId={courseId}
        targetStudentId={targetStudentId}
        targetStudentName={`${targetStudent.first_name} ${targetStudent.last_name}`}
        peers={peers}
        initialScores={initialScores}
        initialFeedback={existingEval?.written_feedback || ""}
        isSubmitted={isSubmitted}
        cycleCloseDate={cycle.close_datetime?.toISOString() || null}
      />
    </div>
  );
}
