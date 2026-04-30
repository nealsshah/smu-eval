import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

async function verifyCycleOwnership(cycleId: string, professorId: string) {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { cycle_id: cycleId },
    include: { Course: true },
  });

  if (!cycle || cycle.Course.professor_id !== professorId) {
    return null;
  }

  return cycle;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId } = await params;
  const cycle = await verifyCycleOwnership(cycleId, session.user.id);
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const body = await request.json();
  const { open_datetime, close_datetime, status } = body;

  const updateData: Record<string, unknown> = {};

  if (open_datetime) updateData.open_datetime = new Date(open_datetime);
  if (close_datetime) updateData.close_datetime = new Date(close_datetime);
  if (status && ["Open", "Closed"].includes(status)) updateData.status = status;

  if (updateData.open_datetime && updateData.close_datetime) {
    if ((updateData.close_datetime as Date) <= (updateData.open_datetime as Date)) {
      return NextResponse.json({ error: "Due date must be after start date." }, { status: 400 });
    }
  }

  const updated = await prisma.evaluationCycle.update({
    where: { cycle_id: cycleId },
    data: updateData,
  });

  return NextResponse.json({ cycle: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId } = await params;
  const cycle = await verifyCycleOwnership(cycleId, session.user.id);
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  // Delete all evaluations and their scores for this cycle
  const evals = await prisma.peerEvaluation.findMany({
    where: { cycle_id: cycleId },
    select: { eval_id: true },
  });

  if (evals.length > 0) {
    const evalIds = evals.map((e) => e.eval_id);
    await prisma.peerEvaluationScore.deleteMany({
      where: { eval_id: { in: evalIds } },
    });
    await prisma.peerEvaluation.deleteMany({
      where: { cycle_id: cycleId },
    });
  }

  await prisma.evaluationCycle.delete({
    where: { cycle_id: cycleId },
  });

  return NextResponse.json({ success: true });
}
