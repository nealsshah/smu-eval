import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudentsTable } from "@/components/admin/StudentsTable";

export default async function AdminStudentsPage() {
  await requireAuth("admin");

  const students = await prisma.student.findMany({
    include: {
      Enrollment: { include: { Course: true } },
      GroupMember: { include: { ProjectGroup: true } },
      _count: {
        select: {
          PeerEvaluation_PeerEvaluation_rater_student_idToStudent: { where: { status: "Submitted" } },
        },
      },
    },
    orderBy: { last_name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Students" subtitle="Manage student accounts and data" />
      <StudentsTable initialStudents={JSON.parse(JSON.stringify(students))} />
    </div>
  );
}
