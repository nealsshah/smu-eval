import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { EvaluationsTable } from "@/components/admin/EvaluationsTable";

export default async function AdminEvaluationsPage() {
  await requireAuth("admin");

  const evaluations = await prisma.peerEvaluation.findMany({
    include: {
      Student_PeerEvaluation_rater_student_idToStudent: true,
      Student_PeerEvaluation_ratee_student_idToStudent: true,
      EvaluationCycle: {
        include: { Course: true, ProjectGroup: true },
      },
      PeerEvaluationScore: true,
    },
    orderBy: { submitted_at: "desc" },
  });

  return (
    <div>
      <PageHeader title="Evaluations" subtitle="View and manage all peer evaluations" />
      <EvaluationsTable initialEvaluations={JSON.parse(JSON.stringify(evaluations))} />
    </div>
  );
}
