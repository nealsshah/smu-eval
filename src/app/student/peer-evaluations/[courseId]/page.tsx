import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { pickActiveCycle, getCycleWithDeadlineInfo } from "@/lib/services/evaluation";
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
        <PageHeader title={course.course_name} subtitle="You haven't been assigned to a group for this course yet. Your professor will add you to a group." />
      </div>
    );
  }

  const group = groupMembership.ProjectGroup;
  const cycle = pickActiveCycle(group.EvaluationCycle);
  const deadlineInfo = getCycleWithDeadlineInfo(group.EvaluationCycle);

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

  const isActive = !!cycle;

  return (
    <div>
      <PageHeader
        title={course.course_name}
        subtitle={`Group: ${group.group_name} · Semester ${course.semester}`}
      />

      {deadlineInfo && (
        <div
          className={`rounded-lg p-3 mb-4 text-sm ${
            !isActive
              ? "bg-red-50 border border-red-200 text-red-700"
              : deadlineInfo.daysLeft <= 2
                ? "bg-orange-50 border border-orange-200 text-orange-700"
                : "bg-blue-50 border border-blue-200 text-blue-700"
          }`}
        >
          {!isActive ? (
            "This evaluation cycle is closed. You can no longer submit evaluations."
          ) : (
            <>
              <span className="font-medium">{deadlineInfo.deadlineLabel}</span>
              {deadlineInfo.cycle.close_datetime && (
                <span className="ml-1">
                  — {new Date(deadlineInfo.cycle.close_datetime).toLocaleString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 stagger-children">
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
                isActive
                  ? `/student/peer-evaluations/${courseId}/${peer.student_id}`
                  : "#"
              }
              className={!isActive ? "pointer-events-none" : ""}
            >
              <Card
                className={`transition-all duration-200 ${
                  isActive
                    ? "hover:border-smu-gold/50 cursor-pointer hover:shadow-md hover:shadow-smu-gold/5"
                    : "opacity-60"
                }`}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-smu-navy flex items-center justify-center text-white font-medium text-sm">
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
