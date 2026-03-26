import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, ArrowRight } from "lucide-react";
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 stagger-children">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-smu-navy" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Courses
              </span>
              <div className="w-8 h-8 rounded-lg bg-smu-navy/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-smu-navy" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{courses.length}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-smu-gold" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Groups
              </span>
              <div className="w-8 h-8 rounded-lg bg-smu-gold/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-smu-gold" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{totalGroups}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Evaluations
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground mt-1">total submitted</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <Link
          href="/professor/groups/create"
          className="group inline-flex items-center gap-2 bg-smu-gold hover:bg-smu-gold-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-smu-gold/20"
        >
          Create Group
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/professor/evaluations/schedule"
          className="border border-smu-border hover:border-smu-navy/20 hover:bg-white text-smu-text px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
        >
          Schedule Evaluation
        </Link>
      </div>
    </div>
  );
}
