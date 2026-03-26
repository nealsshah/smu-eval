import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { sendEvaluationScheduledWebhook } from "@/lib/integrations/pabbly";

function generateId() {
  return `EC${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professorId = session.user.id;
  const body = await request.json();

  const { course_id, group_id, open_datetime, close_datetime, comments } = body;

  if (!course_id || !group_id || !open_datetime || !close_datetime) {
    return NextResponse.json({ error: "Please fill in all required fields: course, group, start date, and due date." }, { status: 400 });
  }

  // Verify professor owns course
  const course = await prisma.course.findFirst({
    where: { course_id, professor_id: professorId },
  });
  if (!course) {
    return NextResponse.json({ error: "This course was not found or does not belong to you." }, { status: 403 });
  }

  // Verify group belongs to course
  const group = await prisma.projectGroup.findFirst({
    where: { group_id, course_id },
  });
  if (!group) {
    return NextResponse.json({ error: "This group does not belong to the selected course." }, { status: 400 });
  }

  const openDt = new Date(open_datetime);
  const closeDt = new Date(close_datetime);

  if (closeDt <= openDt) {
    return NextResponse.json({ error: "The due date must be after the start date." }, { status: 400 });
  }

  // Check for overlapping cycles for this group
  const overlapping = await prisma.evaluationCycle.findFirst({
    where: {
      group_id,
      OR: [
        {
          open_datetime: { lte: closeDt },
          close_datetime: { gte: openDt },
        },
      ],
    },
  });

  if (overlapping) {
    return NextResponse.json({ error: "This group already has an evaluation cycle during this time period." }, { status: 400 });
  }

  const cycleId = generateId();

  const cycle = await prisma.evaluationCycle.create({
    data: {
      cycle_id: cycleId,
      course_id,
      group_id,
      semester: course.semester,
      open_datetime: openDt,
      close_datetime: closeDt,
      status: "Open",
      config_valid_flag: true,
      config_validation_msg: comments || "Configuration valid",
    },
  });

  // Fire Pabbly webhook (async, non-blocking)
  sendEvaluationScheduledWebhook({
    cycle_id: cycleId,
    course_id,
    group_id,
    open_datetime: openDt.toISOString(),
    close_datetime: closeDt.toISOString(),
    professor_id: professorId,
  });

  return NextResponse.json({ cycle }, { status: 201 });
}
