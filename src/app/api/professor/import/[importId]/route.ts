import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ importId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { importId } = await params;

  const importLog = await prisma.importLog.findUnique({
    where: { import_id: importId },
    include: {
      ImportError: { orderBy: { row_number: "asc" } },
      Course: { select: { course_name: true, semester: true } },
    },
  });

  if (!importLog) {
    return NextResponse.json({ error: "Import not found." }, { status: 404 });
  }

  if (importLog.professor_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(importLog);
}
