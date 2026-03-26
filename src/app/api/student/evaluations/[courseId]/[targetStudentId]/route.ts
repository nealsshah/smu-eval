import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { evaluationSubmitSchema, evaluationDraftSchema } from "@/lib/validations/evaluation";
import { pickActiveCycle } from "@/lib/services/evaluation";
import { sendEvaluationSubmittedWebhook } from "@/lib/integrations/pabbly";
import { Decimal } from "@prisma/client/runtime/library";

function generateId() {
  return `PE${Date.now().toString(36).toUpperCase()}`;
}

async function getGroupAndCycle(studentId: string, courseId: string) {
  const groupMembership = await prisma.groupMember.findFirst({
    where: {
      student_id: studentId,
      ProjectGroup: { course_id: courseId },
    },
    include: {
      ProjectGroup: {
        include: {
          GroupMember: true,
          EvaluationCycle: true,
        },
      },
    },
  });

  if (!groupMembership) return null;

  const group = groupMembership.ProjectGroup;
  const cycle = pickActiveCycle(group.EvaluationCycle);

  return { group, cycle };
}

// GET: Fetch existing evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; targetStudentId: string }> }
) {
  const { courseId, targetStudentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getGroupAndCycle(session.user.id, courseId);
  if (!result) return NextResponse.json({ error: "You are not in a group for this course." }, { status: 403 });
  if (!result.cycle) return NextResponse.json({ error: "There is no active evaluation cycle for this course." }, { status: 404 });

  const evaluation = await prisma.peerEvaluation.findFirst({
    where: {
      rater_student_id: session.user.id,
      ratee_student_id: targetStudentId,
      cycle_id: result.cycle.cycle_id,
    },
    include: { PeerEvaluationScore: true },
  });

  return NextResponse.json({ evaluation, cycle: result.cycle });
}

// POST: Save draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; targetStudentId: string }> }
) {
  const { courseId, targetStudentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = session.user.id;
  const body = await request.json();

  const parsed = evaluationDraftSchema.safeParse({
    ratee_student_id: targetStudentId,
    ...body,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (targetStudentId === studentId) {
    return NextResponse.json({ error: "You cannot evaluate yourself." }, { status: 400 });
  }

  const result = await getGroupAndCycle(studentId, courseId);
  if (!result) return NextResponse.json({ error: "You are not in a group for this course." }, { status: 403 });

  const { group, cycle } = result;
  if (!cycle) return NextResponse.json({ error: "There is no active evaluation cycle for this course." }, { status: 404 });

  const targetInGroup = group.GroupMember.some((m) => m.student_id === targetStudentId);
  if (!targetInGroup) {
    return NextResponse.json({ error: "This student is not in your group." }, { status: 400 });
  }

  const existing = await prisma.peerEvaluation.findFirst({
    where: {
      rater_student_id: studentId,
      ratee_student_id: targetStudentId,
      cycle_id: cycle.cycle_id,
    },
  });

  const evalId = existing?.eval_id || generateId();

  const evaluation = existing
    ? await prisma.peerEvaluation.update({
        where: { eval_id: evalId },
        data: {
          written_feedback: parsed.data.written_feedback || null,
          status: "Draft",
        },
      })
    : await prisma.peerEvaluation.create({
        data: {
          eval_id: evalId,
          cycle_id: cycle.cycle_id,
          semester: cycle.semester,
          rater_student_id: studentId,
          ratee_student_id: targetStudentId,
          status: "Draft",
          written_feedback: parsed.data.written_feedback || null,
        },
      });

  if (parsed.data.scores) {
    for (const [criterionId, score] of Object.entries(parsed.data.scores)) {
      if (score !== undefined && score !== null) {
        await prisma.peerEvaluationScore.upsert({
          where: {
            eval_id_criterion_id: { eval_id: evalId, criterion_id: criterionId },
          },
          create: {
            eval_id: evalId,
            semester: cycle.semester,
            criterion_id: criterionId,
            score: new Decimal(score),
          },
          update: {
            score: new Decimal(score),
          },
        });
      }
    }
  }

  return NextResponse.json({ evaluation });
}

// PUT: Submit evaluation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; targetStudentId: string }> }
) {
  const { courseId, targetStudentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = session.user.id;
  const body = await request.json();

  const parsed = evaluationSubmitSchema.safeParse({
    ratee_student_id: targetStudentId,
    ...body,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (targetStudentId === studentId) {
    return NextResponse.json({ error: "You cannot evaluate yourself." }, { status: 400 });
  }

  const result = await getGroupAndCycle(studentId, courseId);
  if (!result) return NextResponse.json({ error: "You are not in a group for this course." }, { status: 403 });

  const { group, cycle } = result;
  if (!cycle) return NextResponse.json({ error: "There is no active evaluation cycle for this course." }, { status: 404 });

  const targetInGroup = group.GroupMember.some((m) => m.student_id === targetStudentId);
  if (!targetInGroup) {
    return NextResponse.json({ error: "This student is not in your group." }, { status: 400 });
  }

  // Check deadline
  if (cycle.close_datetime && new Date() > cycle.close_datetime) {
    return NextResponse.json({ error: "The evaluation deadline has passed. You can no longer submit." }, { status: 400 });
  }

  const existing = await prisma.peerEvaluation.findFirst({
    where: {
      rater_student_id: studentId,
      ratee_student_id: targetStudentId,
      cycle_id: cycle.cycle_id,
    },
  });

  if (existing?.status === "Submitted") {
    return NextResponse.json({ error: "You have already submitted an evaluation for this student in this cycle." }, { status: 400 });
  }

  const evalId = existing?.eval_id || generateId();
  const now = new Date();

  const evaluation = existing
    ? await prisma.peerEvaluation.update({
        where: { eval_id: evalId },
        data: {
          written_feedback: parsed.data.written_feedback || null,
          status: "Submitted",
          submitted_at: now,
        },
      })
    : await prisma.peerEvaluation.create({
        data: {
          eval_id: evalId,
          cycle_id: cycle.cycle_id,
          semester: cycle.semester,
          rater_student_id: studentId,
          ratee_student_id: targetStudentId,
          status: "Submitted",
          submitted_at: now,
          written_feedback: parsed.data.written_feedback || null,
        },
      });

  for (const [criterionId, score] of Object.entries(parsed.data.scores)) {
    await prisma.peerEvaluationScore.upsert({
      where: {
        eval_id_criterion_id: { eval_id: evalId, criterion_id: criterionId },
      },
      create: {
        eval_id: evalId,
        semester: cycle.semester,
        criterion_id: criterionId,
        score: new Decimal(score),
      },
      update: {
        score: new Decimal(score),
      },
    });
  }

  // Fire Pabbly webhook (async, non-blocking)
  sendEvaluationSubmittedWebhook({
    eval_id: evalId,
    rater_student_id: studentId,
    ratee_student_id: targetStudentId,
    course_id: courseId,
    cycle_id: cycle.cycle_id,
    submitted_at: now.toISOString(),
  });

  return NextResponse.json({ evaluation });
}
