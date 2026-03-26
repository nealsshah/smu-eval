import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ evalId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { evalId } = await params;

  await prisma.$transaction([
    prisma.peerEvaluationScore.deleteMany({ where: { eval_id: evalId } }),
    prisma.peerEvaluation.delete({ where: { eval_id: evalId } }),
  ]);

  return NextResponse.json({ success: true });
}
