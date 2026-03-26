import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GroupEvaluationManager } from "@/components/professor/GroupEvaluationManager";

export default async function ProfessorGroupsPage() {
  const session = await requireAuth("professor");
  const professorId = session.user.id;

  const courses = await prisma.course.findMany({
    where: { professor_id: professorId },
    include: {
      ProjectGroup: {
        include: {
          GroupMember: { include: { Student: true } },
        },
      },
    },
  });

  const coursesData = courses.map((course) => ({
    course_id: course.course_id,
    course_name: course.course_name,
    semester: course.semester,
    groups: course.ProjectGroup.map((group) => ({
      group_id: group.group_id,
      group_name: group.group_name,
      members: group.GroupMember.map((m) => ({
        student_id: m.student_id,
        first_name: m.Student.first_name,
        last_name: m.Student.last_name,
      })),
    })),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Groups" subtitle="Manage groups across your courses" />
        <Link href="/professor/groups/create">
          <Button className="bg-smu-gold hover:bg-smu-gold-hover text-white transition-all duration-200 hover:shadow-lg hover:shadow-smu-gold/20">
            <Plus className="w-4 h-4 mr-1" /> Create Group
          </Button>
        </Link>
      </div>

      <GroupEvaluationManager courses={coursesData} />
    </div>
  );
}
