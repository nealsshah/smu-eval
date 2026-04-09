import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { CsvImportWizard } from "@/components/professor/CsvImportWizard";
import { prisma } from "@/lib/db/prisma";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await requireAuth("professor");
  const { courseId } = await searchParams;

  const courses = await prisma.course.findMany({
    where: { professor_id: session.user.id },
    orderBy: { course_name: "asc" },
    select: {
      course_id: true,
      course_name: true,
      semester: true,
    },
  });

  // Validate that the preselected course belongs to this professor
  const validCourseId = courseId && courses.some((c) => c.course_id === courseId)
    ? courseId
    : undefined;

  return (
    <div>
      <PageHeader
        title="Import Students"
        subtitle="Upload a CSV file to import students and assign them to groups"
      />

      <CsvImportWizard initialCourses={courses} preselectedCourseId={validCourseId} />
    </div>
  );
}
