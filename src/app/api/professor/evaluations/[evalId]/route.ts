import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// DELETE: Reset (delete) a specific peer evaluation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ evalId: string }> }
) {
  const { evalId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the evaluation and verify the professor owns the course
  const evaluation = await prisma.peerEvaluation.findUnique({
    where: { eval_id: evalId },
    include: {
      EvaluationCycle: {
        include: {
          Course: true,
        },
      },
    },
  });

  if (!evaluation) {
    return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
  }

  if (evaluation.EvaluationCycle.Course.professor_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete scores first (FK constraint), then the evaluation
  await prisma.peerEvaluationScore.deleteMany({
    where: { eval_id: evalId },
  });

  await prisma.peerEvaluation.delete({
    where: { eval_id: evalId },
  });

  return NextResponse.json({ success: true });
}
