import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { pickActiveCycle } from "@/lib/services/evaluation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CourseEvaluationsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await requireAuth("student");
  const studentId = session.user.id;

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, course_id: courseId },
  });
  if (!enrollment) notFound();

  const course = await prisma.course.findUnique({
    where: { course_id: courseId },
  });
  if (!course) notFound();

  // Find the student's group
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

  if (!groupMembership) {
    return (
      <div>
        <PageHeader title={course.course_name} subtitle="You are not assigned to a group for this course yet." />
      </div>
    );
  }

  const group = groupMembership.ProjectGroup;
  const cycle = pickActiveCycle(group.EvaluationCycle);

  // Get peers (exclude self)
  const peers = group.GroupMember.filter((m) => m.student_id !== studentId);

  // Get existing evaluations for this cycle
  const evaluations = cycle
    ? await prisma.peerEvaluation.findMany({
        where: {
          rater_student_id: studentId,
          cycle_id: cycle.cycle_id,
        },
      })
    : [];

  const evalMap = new Map(evaluations.map((e) => [e.ratee_student_id, e]));

  // Sort: unevaluated first, then drafts, then submitted
  const sortedPeers = [...peers].sort((a, b) => {
    const aEval = evalMap.get(a.student_id);
    const bEval = evalMap.get(b.student_id);
    const aOrder = !aEval ? 0 : aEval.status === "Draft" ? 1 : 2;
    const bOrder = !bEval ? 0 : bEval.status === "Draft" ? 1 : 2;
    return aOrder - bOrder;
  });

  return (
    <div>
      <PageHeader
        title={course.course_name}
        subtitle={`Group: ${group.group_name} · Semester ${course.semester}`}
      />

      <div className="grid gap-3">
        {sortedPeers.map((peer) => {
          const evaluation = evalMap.get(peer.student_id);
          const status = evaluation
            ? evaluation.status === "Submitted"
              ? "complete"
              : "in-progress"
            : "incomplete";

          return (
            <Link
              key={peer.student_id}
              href={
                cycle
                  ? `/student/peer-evaluations/${courseId}/${peer.student_id}`
                  : "#"
              }
            >
              <Card className="hover:border-smu-gold transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-smu-navy/10 flex items-center justify-center text-smu-navy font-medium text-sm">
                      {peer.Student.first_name[0]}
                      {peer.Student.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {peer.Student.first_name} {peer.Student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {peer.Student.email}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
