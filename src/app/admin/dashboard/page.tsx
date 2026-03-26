import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, ClipboardList, UserCheck } from "lucide-react";

export default async function AdminDashboard() {
  await requireAuth("admin");

  const [studentCount, professorCount, courseCount, evalCount] = await Promise.all([
    prisma.student.count(),
    prisma.professor.count({ where: { role: "Professor" } }),
    prisma.course.count(),
    prisma.peerEvaluation.count({ where: { status: "Submitted" } }),
  ]);

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="System overview" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger-children">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-smu-navy" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Students
              </span>
              <div className="w-8 h-8 rounded-lg bg-smu-navy/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-smu-navy" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{studentCount}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-smu-gold" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Professors
              </span>
              <div className="w-8 h-8 rounded-lg bg-smu-gold/10 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-smu-gold" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{professorCount}</div>
          </CardContent>
        </Card>

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
            <div className="font-heading text-4xl text-smu-text">{courseCount}</div>
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
            <div className="font-heading text-4xl text-smu-text">{evalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">submitted</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
