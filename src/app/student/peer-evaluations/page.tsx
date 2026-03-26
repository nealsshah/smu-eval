import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { pickActiveCycle } from "@/lib/services/evaluation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function PeerEvaluationsPage() {
  const session = await requireAuth("student");
  const studentId = session.user.id;

  // Get courses via enrollment
  const enrollments = await prisma.enrollment.findMany({
    where: { student_id: studentId, enrollment_status: "Enrolled" },
    include: {
      Course: {
        include: {
          EvaluationCycle: true,
        },
      },
    },
  });

  // For each course, get group membership and evaluation progress
  const courseData = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = enrollment.Course;

      // Find the student's group in this course
      const groupMembership = await prisma.groupMember.findFirst({
        where: {
          student_id: studentId,
          ProjectGroup: { course_id: course.course_id },
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

      if (!groupMembership) return null;

      const group = groupMembership.ProjectGroup;
      const peers = group.GroupMember.filter((m) => m.student_id !== studentId);

      // Get evaluations for the active/latest cycle
      const cycle = pickActiveCycle(group.EvaluationCycle);
      if (!cycle) return null;

      const evaluations = await prisma.peerEvaluation.findMany({
        where: {
          rater_student_id: studentId,
          cycle_id: cycle.cycle_id,
        },
      });

      const submitted = evaluations.filter((e) => e.status === "Submitted").length;
      const drafts = evaluations.filter((e) => e.status === "Draft").length;
      const total = peers.length;

      return {
        course,
        group,
        cycle,
        peers: total,
        submitted,
        drafts,
        pending: total - submitted - drafts,
      };
    })
  );

  const courses = courseData.filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Peer Evaluations"
        subtitle="Select a course to view and submit evaluations for your group members"
      />

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active evaluation cycles right now. Your professor will open evaluations when they are ready.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 stagger-children">
          {courses.map((data) => {
            if (!data) return null;
            const allDone = data.submitted === data.peers;
            return (
              <Link
                key={data.course.course_id}
                href={`/student/peer-evaluations/${data.course.course_id}`}
              >
                <Card className="hover:border-smu-gold/50 transition-all duration-200 cursor-pointer hover:shadow-md hover:shadow-smu-gold/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {data.course.course_name}
                      </CardTitle>
                      <StatusBadge
                        status={allDone ? "complete" : data.drafts > 0 ? "in-progress" : "incomplete"}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Group: {data.group.group_name} &middot; Semester {data.course.semester}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm">
                      <span className="text-green-600">{data.submitted} submitted</span>
                      <span className="text-yellow-600">{data.drafts} drafts</span>
                      <span className="text-gray-500">{data.pending} pending</span>
                    </div>
                    {data.cycle.close_datetime && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due by {new Date(data.cycle.close_datetime).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
