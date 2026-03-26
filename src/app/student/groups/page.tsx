import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentGroupsPage() {
  const session = await requireAuth("student");
  const studentId = session.user.id;

  const memberships = await prisma.groupMember.findMany({
    where: { student_id: studentId },
    include: {
      ProjectGroup: {
        include: {
          Course: true,
          GroupMember: { include: { Student: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader title="My Groups" subtitle="Groups you belong to across all courses" />

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You haven&apos;t been assigned to any groups yet. Your professor will add you to a group.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {memberships.map(({ ProjectGroup: group }) => (
            <Card key={group.group_id}>
              <CardHeader>
                <CardTitle className="text-base">{group.group_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {group.Course.course_name} &middot; Semester {group.Course.semester}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Members ({group.GroupMember.length})
                </p>
                <div className="space-y-2">
                  {group.GroupMember.map((m) => (
                    <div
                      key={m.student_id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-7 h-7 rounded-full bg-smu-navy/10 flex items-center justify-center text-smu-navy font-medium text-xs">
                        {m.Student.first_name[0]}
                        {m.Student.last_name[0]}
                      </div>
                      <span>
                        {m.Student.first_name} {m.Student.last_name}
                        {m.student_id === studentId && (
                          <span className="text-xs text-muted-foreground ml-1">(You)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
