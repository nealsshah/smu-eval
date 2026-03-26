import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(evaluations);
}
