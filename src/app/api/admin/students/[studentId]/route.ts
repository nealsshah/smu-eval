import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;
  const body = await request.json();
  const { first_name, last_name, email, password } = body;

  if (!first_name || !last_name || !email) {
    return NextResponse.json({ error: "first_name, last_name, and email are required" }, { status: 400 });
  }

  const existing = await prisma.student.findFirst({
    where: { email, NOT: { student_id: studentId } },
  });
  if (existing) {
    return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
  }

  const data: Record<string, string> = { first_name, last_name, email };
  if (password) {
    data.password_hash = await bcrypt.hash(password, 10);
  }

  const student = await prisma.student.update({
    where: { student_id: studentId },
    data,
  });

  return NextResponse.json(student);
}


export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;

  // Delete in correct order to respect foreign keys
  await prisma.$transaction([
    prisma.peerEvaluationScore.deleteMany({
      where: {
        PeerEvaluation: {
          OR: [
            { rater_student_id: studentId },
            { ratee_student_id: studentId },
          ],
        },
      },
    }),
    prisma.peerEvaluation.deleteMany({
      where: {
        OR: [
          { rater_student_id: studentId },
          { ratee_student_id: studentId },
        ],
      },
    }),
    prisma.groupMember.deleteMany({ where: { student_id: studentId } }),
    prisma.enrollment.deleteMany({ where: { student_id: studentId } }),
    prisma.student.delete({ where: { student_id: studentId } }),
  ]);

  return NextResponse.json({ success: true });
}
