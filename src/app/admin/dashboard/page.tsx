import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            <Users className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Professors</CardTitle>
            <UserCheck className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professorCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Courses</CardTitle>
            <BookOpen className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evaluations</CardTitle>
            <ClipboardList className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evalCount}</div>
            <p className="text-xs text-muted-foreground">submitted</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
