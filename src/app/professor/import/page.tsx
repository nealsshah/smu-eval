import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { CsvImportWizard } from "@/components/professor/CsvImportWizard";
import { prisma } from "@/lib/db/prisma";

export default async function ImportPage() {
  const session = await requireAuth("professor");

  const courses = await prisma.course.findMany({
    where: { professor_id: session.user.id },
    orderBy: { course_name: "asc" },
    select: {
      course_id: true,
      course_name: true,
      semester: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Import Courses & Students"
        subtitle="Upload a CSV file to import students and assign them to groups"
      />

      <CsvImportWizard initialCourses={courses} />
    </div>
  );
}
