import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professors = await prisma.professor.findMany({
    include: {
      Course: true,
      _count: { select: { ProjectGroup: true } },
    },
    orderBy: { full_name: "asc" },
  });

  return NextResponse.json(professors);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { professor_id, full_name, email, role, password } = body;

  if (!professor_id || !full_name || !email || !password) {
    return NextResponse.json(
      { error: "professor_id, full_name, email, and password are required" },
      { status: 400 }
    );
  }

  const existingEmail = await prisma.professor.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "A professor with this email already exists" }, { status: 409 });
  }

  const existingId = await prisma.professor.findUnique({ where: { professor_id } });
  if (existingId) {
    return NextResponse.json({ error: "A professor with this ID already exists" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const professor = await prisma.professor.create({
    data: {
      professor_id,
      full_name,
      email,
      role: role || "Professor",
      password_hash,
    },
  });

  return NextResponse.json(professor, { status: 201 });
}
