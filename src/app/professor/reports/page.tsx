import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExternalLink } from "lucide-react";

const POWERBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiZjkzZmM2MTItNjJkYy00YjhmLTgxZjMtYjNmMzljMDhlOWU0IiwidCI6IjYwOTU2ODg0LTEwYWQtNDBmYS04NjNkLTRmMzJjMWUzYTM3YSIsImMiOjF9";

export default async function ProfessorReports() {
  await requireAuth("professor");

  return (
    <div>
      <PageHeader title="Reports" subtitle="View your course performance dashboard" />

      <div className="rounded-lg border border-smu-border overflow-hidden bg-white">
        <iframe
          title="SMU Professor Dashboard"
          src={POWERBI_URL}
          className="w-full"
          style={{ height: "calc(100vh - 240px)", minHeight: 400 }}
          frameBorder="0"
          allowFullScreen
        />
      </div>

      <div className="mt-4">
        <a
          href={POWERBI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-smu-navy hover:text-smu-gold transition-colors"
        >
          Open in Power BI
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
