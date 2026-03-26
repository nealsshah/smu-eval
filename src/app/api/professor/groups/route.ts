import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { createGroupSchema } from "@/lib/validations/group";
import { sendGroupCreatedWebhook } from "@/lib/integrations/pabbly";

function generateId() {
  return `G${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professorId = session.user.id;
  const body = await request.json();

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { course_id, group_name, student_ids } = parsed.data;

  // Verify professor owns this course
  const course = await prisma.course.findFirst({
    where: { course_id, professor_id: professorId },
  });
  if (!course) {
    return NextResponse.json({ error: "This course was not found or does not belong to you." }, { status: 403 });
  }

  // Check no student is already in a group for this course
  const existingMembers = await prisma.groupMember.findMany({
    where: {
      student_id: { in: student_ids },
      ProjectGroup: { course_id },
    },
    include: { Student: true },
  });

  if (existingMembers.length > 0) {
    const names = existingMembers.map(
      (m) => `${m.Student.first_name} ${m.Student.last_name}`
    );
    return NextResponse.json(
      { error: `These students are already assigned to a group: ${names.join(", ")}` },
      { status: 400 }
    );
  }

  const groupId = generateId();

  // Create group and members in a transaction
  await prisma.$transaction([
    prisma.projectGroup.create({
      data: {
        group_id: groupId,
        course_id,
        group_name,
        created_by_professor_id: professorId,
      },
    }),
    ...student_ids.map((student_id) =>
      prisma.groupMember.create({
        data: { group_id: groupId, student_id },
      })
    ),
  ]);

  // Fire Pabbly webhook (async, non-blocking)
  sendGroupCreatedWebhook({
    group_id: groupId,
    course_id,
    group_name,
    professor_id: professorId,
    student_ids,
  });

  return NextResponse.json({ group_id: groupId }, { status: 201 });
}
