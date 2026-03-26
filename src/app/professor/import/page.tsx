import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function ImportPage() {
  await requireAuth("professor");

  return (
    <div>
      <PageHeader
        title="Import Courses & Students"
        subtitle="Import data from SMU systems"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-smu-gold" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The import feature is being set up. Once ready, you&apos;ll be able to
            bring in courses and student enrollments directly from SMU systems.
          </p>
          <p className="text-sm text-muted-foreground">
            Planned import methods:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Direct API integration with SMU systems</li>
            <li>CSV file upload</li>
            <li>Manual data entry</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
