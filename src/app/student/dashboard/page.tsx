import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ClipboardList, Users, CheckCircle, ArrowRight } from "lucide-react";

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 stagger-children">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Submitted
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{submitted}</div>
            <p className="text-xs text-muted-foreground mt-1">of {totalPeers} evaluations</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-smu-gold" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Drafts
              </span>
              <div className="w-8 h-8 rounded-lg bg-smu-gold/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-smu-gold" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{drafts}</div>
            <p className="text-xs text-muted-foreground mt-1">in progress</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-smu-navy" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Groups
              </span>
              <div className="w-8 h-8 rounded-lg bg-smu-navy/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-smu-navy" />
              </div>
            </div>
            <div className="font-heading text-4xl text-smu-text">{groupMemberships.length}</div>
            <p className="text-xs text-muted-foreground mt-1">across all courses</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <Link
          href="/student/peer-evaluations"
          className="group inline-flex items-center gap-2 bg-smu-gold hover:bg-smu-gold-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-smu-gold/20"
        >
          Go to Peer Evaluations
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/student/groups"
          className="border border-smu-border hover:border-smu-navy/20 hover:bg-white text-smu-text px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
        >
          View Groups
        </Link>
      </div>
    </div>
  );
}
