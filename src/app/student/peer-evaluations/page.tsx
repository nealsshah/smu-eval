import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getCycleWithDeadlineInfo } from "@/lib/services/evaluation";
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

      // Get cycle info with deadline details
      const deadlineInfo = getCycleWithDeadlineInfo(group.EvaluationCycle);
      if (!deadlineInfo) return null;

      const { cycle, isActive, isPastDue, isUpcoming, deadlineLabel, daysLeft } = deadlineInfo;

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
        isActive,
        isPastDue,
        isUpcoming,
        deadlineLabel,
        daysLeft,
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
                href={
                  data.isActive
                    ? `/student/peer-evaluations/${data.course.course_id}`
                    : "#"
                }
                className={!data.isActive ? "pointer-events-none" : ""}
              >
                <Card
                  className={`transition-all duration-200 ${
                    data.isActive
                      ? "hover:border-smu-gold/50 cursor-pointer hover:shadow-md hover:shadow-smu-gold/5"
                      : "opacity-75"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {data.course.course_name}
                      </CardTitle>
                      {data.isActive ? (
                        <StatusBadge
                          status={allDone ? "complete" : data.drafts > 0 ? "in-progress" : "incomplete"}
                        />
                      ) : data.isPastDue ? (
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                          Closed
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Group: {data.group.group_name} &middot; Semester {data.course.semester}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {data.isActive && (
                      <div className="flex gap-6 text-sm">
                        <span className="text-green-600">{data.submitted} submitted</span>
                        <span className="text-yellow-600">{data.drafts} drafts</span>
                        <span className="text-gray-500">{data.pending} pending</span>
                      </div>
                    )}
                    <p
                      className={`text-xs mt-2 font-medium ${
                        data.isPastDue
                          ? "text-red-600"
                          : data.isActive && data.daysLeft <= 2
                            ? "text-orange-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {data.deadlineLabel}
                      {data.isActive && data.cycle.close_datetime && (
                        <span className="font-normal text-muted-foreground ml-1">
                          ({new Date(data.cycle.close_datetime).toLocaleDateString()})
                        </span>
                      )}
                    </p>
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
