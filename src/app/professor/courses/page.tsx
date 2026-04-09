import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ProfessorCoursesManager } from "@/components/professor/ProfessorCoursesManager";

export default async function ProfessorCoursesPage() {
  const session = await requireAuth("professor");

  const courses = await prisma.course.findMany({
    where: { professor_id: session.user.id },
    orderBy: { course_name: "asc" },
    include: {
      ProjectGroup: {
        include: {
          GroupMember: {
            include: { Student: { select: { student_id: true, first_name: true, last_name: true } } },
          },
        },
      },
      _count: { select: { Enrollment: true, EvaluationCycle: true } },
    },
  });

  return (
    <div>
      <ProfessorCoursesManager initialCourses={courses} />
    </div>
  );
}
