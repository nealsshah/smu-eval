import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Groups" subtitle="Manage groups across your courses" />
        <Link href="/professor/groups/create">
          <Button className="bg-smu-gold hover:bg-smu-gold-hover text-white">
            <Plus className="w-4 h-4 mr-1" /> Create Group
          </Button>
        </Link>
      </div>

      {courses.map((course) => (
        <div key={course.course_id} className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            {course.course_name}
            <span className="text-sm text-muted-foreground font-normal ml-2">
              Semester {course.semester}
            </span>
          </h2>

          {course.ProjectGroup.length === 0 ? (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                No groups created yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {course.ProjectGroup.map((group) => (
                <Card key={group.group_id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">{group.group_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {group.GroupMember.map((m) => (
                        <span
                          key={m.student_id}
                          className="inline-flex items-center gap-1 bg-smu-navy/5 text-smu-text text-xs px-2 py-1 rounded"
                        >
                          {m.Student.first_name} {m.Student.last_name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
