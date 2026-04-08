import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const professorId = session.user.id;

  // Verify professor owns the course this group belongs to
  const group = await prisma.projectGroup.findUnique({
    where: { group_id: groupId },
    include: { Course: { select: { professor_id: true } } },
  });

  if (!group || group.Course.professor_id !== professorId) {
    return NextResponse.json(
      { error: "Group not found or does not belong to you." },
      { status: 403 }
    );
  }

  // Get all evaluation cycles for this group to find related evaluations
  const cycles = await prisma.evaluationCycle.findMany({
    where: { group_id: groupId },
    select: { cycle_id: true },
  });
  const cycleIds = cycles.map((c) => c.cycle_id);

  await prisma.$transaction([
    // Delete scores for evaluations in this group's cycles
    prisma.peerEvaluationScore.deleteMany({
      where: { PeerEvaluation: { cycle_id: { in: cycleIds } } },
    }),
    // Delete evaluations in this group's cycles
    prisma.peerEvaluation.deleteMany({
      where: { cycle_id: { in: cycleIds } },
    }),
    // Delete evaluation cycles
    prisma.evaluationCycle.deleteMany({
      where: { group_id: groupId },
    }),
    // Delete group members
    prisma.groupMember.deleteMany({
      where: { group_id: groupId },
    }),
    // Delete the group itself
    prisma.projectGroup.delete({
      where: { group_id: groupId },
    }),
  ]);

  return NextResponse.json({ success: true });
}
