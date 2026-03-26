import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ professorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { professorId } = await params;
  const body = await request.json();
  const { full_name, email, role, password } = body;

  if (!full_name || !email) {
    return NextResponse.json({ error: "full_name and email are required" }, { status: 400 });
  }

  const existing = await prisma.professor.findFirst({
    where: { email, NOT: { professor_id: professorId } },
  });
  if (existing) {
    return NextResponse.json({ error: "A professor with this email already exists" }, { status: 409 });
  }

  const data: Record<string, string> = { full_name, email, role: role || "Professor" };
  if (password) {
    data.password_hash = await bcrypt.hash(password, 10);
  }

  const professor = await prisma.professor.update({
    where: { professor_id: professorId },
    data,
  });

  return NextResponse.json(professor);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ professorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { professorId } = await params;

  // Check if professor has courses — cascading delete would be destructive
  const courseCount = await prisma.course.count({ where: { professor_id: professorId } });
  if (courseCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete professor with assigned courses. Reassign or delete their courses first." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.projectGroup.deleteMany({ where: { created_by_professor_id: professorId } }),
    prisma.professor.delete({ where: { professor_id: professorId } }),
  ]);

  return NextResponse.json({ success: true });
}
