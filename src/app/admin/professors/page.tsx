import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfessorsTable } from "@/components/admin/ProfessorsTable";

export default async function AdminProfessorsPage() {
  await requireAuth("admin");

  const professors = await prisma.professor.findMany({
    include: {
      Course: true,
      _count: { select: { ProjectGroup: true } },
    },
    orderBy: { full_name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Professors" subtitle="Manage professor accounts and data" />
      <ProfessorsTable initialProfessors={JSON.parse(JSON.stringify(professors))} />
    </div>
  );
}
