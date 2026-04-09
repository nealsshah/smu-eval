import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { generateStudentId } from "@/lib/db/id-generation";
import bcrypt from "bcryptjs";

function generateEnrollmentId() {
  return `E${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { first_name, last_name, email, password, course_id } = body;

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password || !course_id) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  // Verify professor owns this course
  const course = await prisma.course.findFirst({
    where: { course_id, professor_id: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found or does not belong to you." }, { status: 403 });
  }

  // Check if email already exists
  const existing = await prisma.student.findUnique({ where: { email: email.trim() } });

  if (existing) {
    // Student exists — check if already enrolled in this course+semester
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { student_id: existing.student_id, course_id, semester: course.semester },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "This student is already enrolled in this course." },
        { status: 409 }
      );
    }

    // Enroll existing student
    await prisma.enrollment.create({
      data: {
        enrollment_id: generateEnrollmentId(),
        student_id: existing.student_id,
        course_id,
        semester: course.semester,
        enrollment_status: "Enrolled",
      },
    });

    return NextResponse.json({
      student_id: existing.student_id,
      message: "Existing student enrolled in course.",
    }, { status: 201 });
  }

  // Create new student + enrollment
  const studentId = await generateStudentId();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.student.create({
      data: {
        student_id: studentId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        import_valid_flag: true,
      },
    }),
    prisma.enrollment.create({
      data: {
        enrollment_id: generateEnrollmentId(),
        student_id: studentId,
        course_id,
        semester: course.semester,
        enrollment_status: "Enrolled",
      },
    }),
  ]);

  return NextResponse.json({ student_id: studentId }, { status: 201 });
}
