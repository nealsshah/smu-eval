import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScheduleEvaluationForm } from "@/components/forms/ScheduleEvaluationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Get existing evaluation cycles for display
  const allCycles = await prisma.evaluationCycle.findMany({
    where: {
      Course: { professor_id: professorId },
    },
    include: {
      Course: true,
      ProjectGroup: true,
    },
    orderBy: { open_datetime: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Schedule Evaluations"
        subtitle="Create evaluation cycles for your course groups"
      />

      <ScheduleEvaluationForm courses={coursesData} />

      {/* Existing cycles */}
      <div className="mt-8">
        <h2 className="font-heading text-xl mb-3">Existing Evaluation Cycles</h2>
        {allCycles.length === 0 ? (
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">
              No evaluation cycles yet. Create one above to open evaluations for a group.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {allCycles.map((cycle) => (
              <Card key={cycle.cycle_id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {cycle.Course.course_name} &middot; {cycle.ProjectGroup.group_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cycle.open_datetime
                        ? new Date(cycle.open_datetime).toLocaleDateString()
                        : "No date set"}{" "}
                      —{" "}
                      {cycle.close_datetime
                        ? new Date(cycle.close_datetime).toLocaleDateString()
                        : "No date set"}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      cycle.status === "Open"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {cycle.status || "Unknown"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
