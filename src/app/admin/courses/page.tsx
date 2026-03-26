import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { CoursesTable } from "@/components/admin/CoursesTable";

export default async function AdminCoursesPage() {
  await requireAuth("admin");

  const courses = await prisma.course.findMany({
    include: {
      Professor: true,
      ProjectGroup: {
        include: {
          GroupMember: { include: { Student: true } },
        },
      },
      _count: { select: { Enrollment: true, EvaluationCycle: true } },
    },
    orderBy: { course_name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Courses" subtitle="Manage courses, groups, and enrollments" />
      <CoursesTable initialCourses={JSON.parse(JSON.stringify(courses))} />
    </div>
  );
}
