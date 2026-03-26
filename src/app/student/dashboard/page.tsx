import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ClipboardList, Users, CheckCircle } from "lucide-react";

export default async function StudentDashboard() {
  const session = await requireAuth("student");
  const studentId = session.user.id;

  // Get student's groups and evaluations
  const groupMemberships = await prisma.groupMember.findMany({
    where: { student_id: studentId },
    include: {
      ProjectGroup: {
        include: {
          Course: true,
          GroupMember: true,
          EvaluationCycle: true,
        },
      },
    },
  });

  const evaluationsGiven = await prisma.peerEvaluation.findMany({
    where: { rater_student_id: studentId },
  });

  const submitted = evaluationsGiven.filter((e) => e.status === "Submitted").length;
  const drafts = evaluationsGiven.filter((e) => e.status === "Draft").length;

  // Count total peers to evaluate across all groups
  let totalPeers = 0;
  for (const gm of groupMemberships) {
    totalPeers += gm.ProjectGroup.GroupMember.filter(
      (m) => m.student_id !== studentId
    ).length;
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${session.user.name}`}
        subtitle="Here's an overview of your peer evaluations"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submitted
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submitted}</div>
            <p className="text-xs text-muted-foreground">of {totalPeers} evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
            <ClipboardList className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts}</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Groups
            </CardTitle>
            <Users className="w-4 h-4 text-smu-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupMemberships.length}</div>
            <p className="text-xs text-muted-foreground">across all courses</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link
          href="/student/peer-evaluations"
          className="bg-smu-gold hover:bg-smu-gold-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Go to Peer Evaluations
        </Link>
        <Link
          href="/student/groups"
          className="border border-smu-border hover:bg-white text-smu-text px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          View Groups
        </Link>
      </div>
    </div>
  );
}
