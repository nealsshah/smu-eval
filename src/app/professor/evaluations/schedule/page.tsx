import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScheduleEvaluationForm } from "@/components/forms/ScheduleEvaluationForm";
import { EvaluationCycleList } from "@/components/professor/EvaluationCycleList";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarPlus, Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function ScheduleEvaluationPage() {
  const session = await requireAuth("professor");
  const professorId = session.user.id;

  const courses = await prisma.course.findMany({
    where: { professor_id: professorId },
    include: {
      ProjectGroup: {
        include: {
          GroupMember: { include: { Student: true } },
          EvaluationCycle: true,
        },
      },
    },
  });

  const coursesData = courses.map((c) => ({
    course_id: c.course_id,
    course_name: c.course_name,
    semester: c.semester,
    groups: c.ProjectGroup.map((g) => ({
      group_id: g.group_id,
      group_name: g.group_name,
      students: g.GroupMember.map((m) => ({
        student_id: m.student_id,
        name: `${m.Student.first_name} ${m.Student.last_name}`,
      })),
      cycles: g.EvaluationCycle.map((ec) => ({
        cycle_id: ec.cycle_id,
        status: ec.status,
        open_datetime: ec.open_datetime?.toISOString() || null,
        close_datetime: ec.close_datetime?.toISOString() || null,
      })),
    })),
  }));

  // Get existing evaluation cycles with submitted counts
  const allCycles = await prisma.evaluationCycle.findMany({
    where: {
      Course: { professor_id: professorId },
    },
    include: {
      Course: true,
      ProjectGroup: {
        include: {
          GroupMember: { select: { student_id: true } },
        },
      },
      PeerEvaluation: {
        select: { eval_id: true, status: true },
      },
    },
    orderBy: { close_datetime: "desc" },
  });

  const now = new Date();
  const cyclesData = allCycles.map((cycle) => {
    const isOpen = cycle.status === "Open";
    const isPastDue = cycle.close_datetime ? cycle.close_datetime < now : false;
    const totalMembers = cycle.ProjectGroup.GroupMember.length;
    const expectedEvals = totalMembers * (totalMembers - 1); // each member evals every other

    return {
      cycle_id: cycle.cycle_id,
      status: cycle.status,
      open_datetime: cycle.open_datetime?.toISOString() || null,
      close_datetime: cycle.close_datetime?.toISOString() || null,
      course_name: cycle.Course.course_name,
      group_name: cycle.ProjectGroup.group_name,
      submitted_count: cycle.PeerEvaluation.filter((e) => e.status === "Submitted").length,
      draft_count: cycle.PeerEvaluation.filter((e) => e.status === "Draft").length,
      expected_count: expectedEvals,
      member_count: totalMembers,
      is_past_due: isOpen && isPastDue,
    };
  });

  // Stats
  const activeCycles = cyclesData.filter(
    (c) => c.status === "Open" && !c.is_past_due
  ).length;
  const closedCycles = cyclesData.filter(
    (c) => c.status === "Closed" || c.is_past_due
  ).length;
  const totalSubmitted = cyclesData.reduce((s, c) => s + c.submitted_count, 0);

  return (
    <div>
      <PageHeader
        title="Schedule Evaluations"
        subtitle="Create and manage evaluation cycles for your course groups"
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-heading font-semibold text-smu-text">{activeCycles}</p>
              <p className="text-xs text-muted-foreground">Active Cycles</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-semibold text-smu-text">{closedCycles}</p>
              <p className="text-xs text-muted-foreground">Closed</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-heading font-semibold text-smu-text">{totalSubmitted}</p>
              <p className="text-xs text-muted-foreground">Evaluations Submitted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Create form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-smu-gold" />
                <CardTitle>New Evaluation Cycle</CardTitle>
              </div>
              <CardDescription>
                Students will be emailed when scheduled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleEvaluationForm courses={coursesData} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Existing cycles */}
        <div className="lg:col-span-3">
          <EvaluationCycleList cycles={cyclesData} />
        </div>
      </div>
    </div>
  );
}
