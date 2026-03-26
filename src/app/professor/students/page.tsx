import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StudentsRoster } from "@/components/professor/StudentsRoster";

export default async function ProfessorStudentsPage() {
  const session = await requireAuth("professor");
  const professorId = session.user.id;

  const courses = await prisma.course.findMany({
    where: { professor_id: professorId },
    include: {
      Enrollment: {
        where: { enrollment_status: "Enrolled" },
        include: { Student: true },
      },
    },
  });

  const coursesData = courses.map((course) => ({
    course_id: course.course_id,
    course_name: course.course_name,
    semester: course.semester,
    students: course.Enrollment.map((e) => ({
      student_id: e.Student.student_id,
      first_name: e.Student.first_name,
      last_name: e.Student.last_name,
      email: e.Student.email,
    })),
  }));

  return (
    <div>
      <StudentsRoster courses={coursesData} />
    </div>
  );
}
