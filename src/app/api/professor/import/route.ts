import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { importSubmissionSchema, validateCsvRows } from "@/lib/validations/import";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "password123";

function generateId(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professorId = session.user.id;
  const body = await request.json();

  const parsed = importSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { course_id, file_name, rows } = parsed.data;

  // Verify professor owns this course
  const course = await prisma.course.findFirst({
    where: { course_id, professor_id: professorId },
  });
  if (!course) {
    return NextResponse.json(
      { error: "Course not found or does not belong to you." },
      { status: 403 }
    );
  }

  // Server-side validation
  const validationErrors = validateCsvRows(rows);

  if (validationErrors.length > 0) {
    // Save import log as failed with errors
    const importId = generateId("I");
    await prisma.importLog.create({
      data: {
        import_id: importId,
        professor_id: professorId,
        course_id,
        file_name,
        total_rows: rows.length,
        success_count: 0,
        error_count: validationErrors.length,
        status: "failed",
      },
    });

    await prisma.importError.createMany({
      data: validationErrors.map((err) => ({
        error_id: generateId("IE"),
        import_id: importId,
        row_number: err.row,
        column_name: err.column,
        value: err.value?.slice(0, 255) || null,
        message: err.message,
      })),
    });

    return NextResponse.json(
      {
        success: false,
        import_id: importId,
        errors: validationErrors,
      },
      { status: 400 }
    );
  }

  // Process the import
  const importId = generateId("I");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let studentsCreated = 0;
  let studentsEnrolled = 0;
  let groupsCreated = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // Track group name -> group_id mapping
      const groupMap = new Map<string, string>();

      // Create groups first
      const uniqueGroups = [...new Set(rows.map((r) => r.group.trim()))];
      for (const groupName of uniqueGroups) {
        // Check if group already exists for this course
        const existing = await tx.projectGroup.findFirst({
          where: { course_id, group_name: groupName },
        });
        if (existing) {
          groupMap.set(groupName, existing.group_id);
        } else {
          const groupId = generateId("G");
          await tx.projectGroup.create({
            data: {
              group_id: groupId,
              course_id,
              group_name: groupName,
              created_by_professor_id: professorId,
            },
          });
          groupMap.set(groupName, groupId);
          groupsCreated++;
        }
      }

      // Process each student row
      for (const row of rows) {
        const emailLower = row.email.trim().toLowerCase();

        // Find or create student
        let studentId: string;
        const existingStudent = await tx.student.findUnique({
          where: { email: emailLower },
        });

        if (existingStudent) {
          studentId = existingStudent.student_id;
          studentsEnrolled++;
        } else {
          studentId = generateId("S");
          await tx.student.create({
            data: {
              student_id: studentId,
              first_name: row.first_name.trim(),
              last_name: row.last_name.trim(),
              email: emailLower,
              password_hash: passwordHash,
              import_valid_flag: true,
            },
          });
          studentsCreated++;
        }

        // Create enrollment if not already enrolled
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            student_id: studentId,
            course_id,
            semester: course.semester,
          },
        });

        if (!existingEnrollment) {
          await tx.enrollment.create({
            data: {
              enrollment_id: generateId("E"),
              student_id: studentId,
              course_id,
              semester: course.semester,
              enrollment_status: "Enrolled",
            },
          });
        }

        // Add to group if not already a member
        const groupId = groupMap.get(row.group.trim())!;
        const existingMember = await tx.groupMember.findUnique({
          where: {
            group_id_student_id: {
              group_id: groupId,
              student_id: studentId,
            },
          },
        });

        if (!existingMember) {
          await tx.groupMember.create({
            data: {
              group_id: groupId,
              student_id: studentId,
            },
          });
        }
      }

      // Save successful import log
      await tx.importLog.create({
        data: {
          import_id: importId,
          professor_id: professorId,
          course_id,
          file_name,
          total_rows: rows.length,
          success_count: rows.length,
          error_count: 0,
          status: "completed",
        },
      });
    }, { timeout: 30000 });

    return NextResponse.json(
      {
        success: true,
        import_id: importId,
        summary: {
          total_rows: rows.length,
          students_created: studentsCreated,
          students_enrolled: studentsEnrolled,
          groups_created: groupsCreated,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Import failed:", error);

    // Log the failed import
    await prisma.importLog.create({
      data: {
        import_id: importId,
        professor_id: professorId,
        course_id,
        file_name,
        total_rows: rows.length,
        success_count: 0,
        error_count: 1,
        status: "failed",
      },
    });

    await prisma.importError.create({
      data: {
        error_id: generateId("IE"),
        import_id: importId,
        row_number: 0,
        column_name: "system",
        value: null,
        message:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "An unexpected error occurred during import.",
      },
    });

    return NextResponse.json(
      { error: "Import failed. Please try again." },
      { status: 500 }
    );
  }
}
