import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import {
  sendEvaluationScheduledWebhook,
  sendEvalScheduledStudentWebhook,
} from "@/lib/integrations/pabbly";

function generateId() {
  return `EC${Date.now().toString(36).toUpperCase()}`;
}

async function createCycleForGroup(
  courseId: string,
  groupId: string,
  semester: number,
  openDt: Date,
  closeDt: Date,
  comments: string,
  professorName: string,
  courseName: string,
  professorId: string
) {
  // Check for overlapping cycles
  const overlapping = await prisma.evaluationCycle.findFirst({
    where: {
      group_id: groupId,
      OR: [
        {
          open_datetime: { lte: closeDt },
          close_datetime: { gte: openDt },
        },
      ],
    },
  });

  if (overlapping) {
    return { error: true, groupId };
  }

  const cycleId = generateId();

  const cycle = await prisma.evaluationCycle.create({
    data: {
      cycle_id: cycleId,
      course_id: courseId,
      group_id: groupId,
      semester,
      open_datetime: openDt,
      close_datetime: closeDt,
      status: "Open",
      config_valid_flag: true,
      config_validation_msg: comments || "Configuration valid",
    },
  });

  // Fetch group members for per-student webhooks
  const group = await prisma.projectGroup.findUnique({
    where: { group_id: groupId },
    include: {
      GroupMember: { include: { Student: true } },
    },
  });

  if (group) {
    // Fire Pabbly webhook (async, non-blocking)
    sendEvaluationScheduledWebhook({
      cycle_id: cycleId,
      course_id: courseId,
      group_id: groupId,
      open_datetime: openDt.toISOString(),
      close_datetime: closeDt.toISOString(),
      professor_id: professorId,
    });

    // Fire per-student webhooks so Pabbly can email each student
    for (const member of group.GroupMember) {
      sendEvalScheduledStudentWebhook({
        student_email: member.Student.email,
        student_name: `${member.Student.first_name} ${member.Student.last_name}`,
        professor_name: professorName,
        course_name: courseName,
        group_name: group.group_name,
        deadline: closeDt.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }),
        open_date: openDt.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }),
      });
    }
  }

  return { error: false, cycle };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professorId = session.user.id;
  const body = await request.json();

  const { course_id, group_id, open_datetime, close_datetime, comments } = body;
  const scheduleAll = group_id === "__all__";

  if (!course_id || !group_id || !open_datetime || !close_datetime) {
    return NextResponse.json(
      { error: "Please fill in all required fields: course, group, start date, and due date." },
      { status: 400 }
    );
  }

  // Verify professor owns course & get professor details
  const course = await prisma.course.findFirst({
    where: { course_id, professor_id: professorId },
    include: { Professor: true },
  });
  if (!course) {
    return NextResponse.json(
      { error: "This course was not found or does not belong to you." },
      { status: 403 }
    );
  }

  const openDt = new Date(open_datetime);
  const closeDt = new Date(close_datetime);

  if (closeDt <= openDt) {
    return NextResponse.json(
      { error: "The due date must be after the start date." },
      { status: 400 }
    );
  }

  const professorName = course.Professor.full_name;
  const courseName = course.course_name;

  if (scheduleAll) {
    // Schedule all groups in the course
    const groups = await prisma.projectGroup.findMany({
      where: { course_id },
    });

    if (groups.length === 0) {
      return NextResponse.json(
        { error: "No groups found for this course." },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      groups.map((g) =>
        createCycleForGroup(
          course_id,
          g.group_id,
          course.semester,
          openDt,
          closeDt,
          comments || "",
          professorName,
          courseName,
          professorId
        )
      )
    );

    const skipped = results.filter((r) => r.error);
    const created = results.filter((r) => !r.error);

    return NextResponse.json(
      {
        message: `Created ${created.length} evaluation cycle(s)${skipped.length > 0 ? `. ${skipped.length} group(s) skipped due to overlapping cycles.` : "."}`,
        created: created.length,
        skipped: skipped.length,
      },
      { status: 201 }
    );
  }

  // Single group scheduling
  const group = await prisma.projectGroup.findFirst({
    where: { group_id, course_id },
  });
  if (!group) {
    return NextResponse.json(
      { error: "This group does not belong to the selected course." },
      { status: 400 }
    );
  }

  const result = await createCycleForGroup(
    course_id,
    group_id,
    course.semester,
    openDt,
    closeDt,
    comments || "",
    professorName,
    courseName,
    professorId
  );

  if (result.error) {
    return NextResponse.json(
      { error: "This group already has an evaluation cycle during this time period." },
      { status: 400 }
    );
  }

  return NextResponse.json({ cycle: result.cycle }, { status: 201 });
}
