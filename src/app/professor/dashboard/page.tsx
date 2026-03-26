import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList } from "lucide-react";
import Link from "next/link";

export default async function ProfessorDashboard() {
  const session = await requireAuth("professor");
  const professorId = session.user.id;

  const courses = await prisma.course.findMany({
    where: { professor_id: professorId },
    include: {
      ProjectGroup: { include: { GroupMember: true } },
      EvaluationCycle: { include: { PeerEvaluation: true } },
    },
  });

  const totalGroups = courses.reduce((sum, c) => sum + c.ProjectGroup.length, 0);
  const totalEvaluations = courses.reduce(
    (sum, c) =>
      sum + c.EvaluationCycle.reduce((s, ec) => s + ec.PeerEvaluation.length, 0),
    0
  );

  return (
    <div>
      <PageHeader
        title={`Welcome, ${session.user.name}`}
        subtitle="Manage your courses, groups, and evaluations"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Courses</CardTitle>
            <BookOpen className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
            <Users className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evaluations</CardTitle>
            <ClipboardList className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">total submitted</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link
          href="/professor/groups/create"
          className="bg-smu-gold hover:bg-smu-gold-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Create Group
        </Link>
        <Link
          href="/professor/evaluations/schedule"
          className="border border-smu-border hover:bg-white text-smu-text px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Schedule Evaluation
        </Link>
      </div>
    </div>
  );
}
