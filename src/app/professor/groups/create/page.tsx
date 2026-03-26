import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { GroupCreationForm } from "@/components/forms/GroupCreationForm";

export default async function CreateGroupPage() {
  const session = await requireAuth("professor");
  const professorId = session.user.id;

  // Get professor's courses
  const courses = await prisma.course.findMany({
    where: { professor_id: professorId },
  });

  // Get all enrollments for these courses with student info
  const courseIds = courses.map((c) => c.course_id);
  const enrollments = await prisma.enrollment.findMany({
    where: { course_id: { in: courseIds }, enrollment_status: "Enrolled" },
    include: { Student: true },
  });

  // Get existing group members to mark as unavailable
  const existingGroupMembers = await prisma.groupMember.findMany({
    where: {
      ProjectGroup: { course_id: { in: courseIds } },
    },
    include: { ProjectGroup: true },
  });

  const groupedMap: Record<string, Set<string>> = {};
  for (const gm of existingGroupMembers) {
    const courseId = gm.ProjectGroup.course_id;
    if (!groupedMap[courseId]) groupedMap[courseId] = new Set();
    groupedMap[courseId].add(gm.student_id);
  }

  const coursesData = courses.map((c) => ({
    course_id: c.course_id,
    course_name: c.course_name,
    semester: c.semester,
    students: enrollments
      .filter((e) => e.course_id === c.course_id)
      .map((e) => ({
        student_id: e.Student.student_id,
        name: `${e.Student.first_name} ${e.Student.last_name}`,
        email: e.Student.email,
        isGrouped: groupedMap[c.course_id]?.has(e.Student.student_id) || false,
      })),
  }));

  return (
    <div>
      <PageHeader title="Create Group" subtitle="Create a new project group for one of your courses" />
      <GroupCreationForm courses={coursesData} />
    </div>
  );
}
